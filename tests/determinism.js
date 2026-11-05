#!/usr/bin/env node
// ============================================================================
// Hummingbird x86 PC Emulator — Deterministic Boot Verification Test
// Boots the same floppy image twice in two independent HummingbirdPC instances
// with Deterministic mode enabled and verifies that both runs produce
// bit-for-bit identical framebuffer hashes and CPU states at the exact same
// instruction counts all the way to the GUI desktop.
//
// Usage:
//   node tests/determinism.js [path/to/kolibri.img]
// ============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');
const { loadCoreFromHtml } = require('./headless.js');

function resolveImagePath(argPath) {
  const candidates = [
    argPath,
    'kolibri-0.7.7.0+8930.img',
    'kolibri.img',
    path.join(__dirname, '..', 'user_uploaded_files', 'ttl=63d', 'user_uploaded', 'kolibri-0.7.7.0+8930.img')
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(`Floppy image not found. Tried: ${candidates.join(', ')}`);
}

function hashFramebufferAndCPU(pc) {
  const { width, height, rgba } = pc.vga.renderFrame();
  const fbBytes = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength);
  const fbHash = crypto.createHash('sha256').update(fbBytes).digest('hex');
  const cpuState = `${pc.cpu.eip >>> 0}:${pc.cpu.eflags >>> 0}:${Array.from(pc.cpu.regs).map(r => r >>> 0).join(',')}`;
  return { width, height, fbHash, cpuState };
}

function runDeterministicCheckpoints(core, imgBytes, checkpoints) {
  const pc = new core.HummingbirdPC({ ramSizeMB: 64, deterministic: true });
  pc.loadFloppyImage(imgBytes);

  const results = [];
  for (const targetInst of checkpoints) {
    const delta = targetInst - pc.cpu.totalInstructions;
    if (delta > 0) {
      pc.cpu.runSteps(delta);
    }
    const snap = hashFramebufferAndCPU(pc);
    results.push({ inst: pc.cpu.totalInstructions, ...snap });
  }
  return results;
}

function main() {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const imgPath = resolveImagePath(process.argv[2]);
  const core = loadCoreFromHtml(htmlPath);
  const imgBytes = new Uint8Array(fs.readFileSync(imgPath));

  // Instruction checkpoints covering real-mode boot menu, kernel unpack,
  // protected-mode paging init, autorun apps, and full 1024x768x32 GUI desktop
  const checkpoints = [
    250000,
    10000000,
    30000000,
    100000000,
    290000000
  ];

  console.log('=== Hummingbird Determinism Verification ===');
  console.log(`Image: ${imgPath}`);
  console.log(`Checkpoints: ${checkpoints.map(c => c.toLocaleString()).join(', ')} instructions\n`);

  const t1 = Date.now();
  const run1 = runDeterministicCheckpoints(core, imgBytes, checkpoints);
  console.log(`Run 1 completed in ${((Date.now() - t1) / 1000).toFixed(2)}s`);

  const t2 = Date.now();
  const run2 = runDeterministicCheckpoints(core, imgBytes, checkpoints);
  console.log(`Run 2 completed in ${((Date.now() - t2) / 1000).toFixed(2)}s\n`);

  for (let i = 0; i < checkpoints.length; i++) {
    const a = run1[i];
    const b = run2[i];
    assert.strictEqual(a.inst, b.inst, `Instruction count mismatch at checkpoint ${i}`);
    assert.strictEqual(a.fbHash, b.fbHash, `Framebuffer hash mismatch at inst=${a.inst}`);
    assert.strictEqual(a.cpuState, b.cpuState, `CPU register state mismatch at inst=${a.inst}`);
    console.log(`  [MATCH] inst=${a.inst.toLocaleString().padStart(11, ' ')} | ${a.width}x${a.height} | sha256=${a.fbHash.slice(0, 24)}...`);
  }

  console.log('\n[PASS] Two deterministic boots produced 100% identical framebuffers and CPU states at every instruction count.');
}

if (require.main === module) {
  main();
}