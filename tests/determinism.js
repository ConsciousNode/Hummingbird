#!/usr/bin/env node
// ============================================================================
// Hummingbird x86 PC Emulator — Deterministic Boot & Block-Cache Parity Test
// 1. Boots the same floppy image twice in two independent HummingbirdPC
//    instances with Deterministic mode enabled and verifies that both runs
//    produce bit-for-bit identical framebuffer hashes, CPU states, and virtual
//    cycle counts at the exact same instruction counts all the way to the
//    1024x768x32 GUI desktop.
// 2. Verifies that the Basic-Block Cache (useBlockCache=true) is 100%
//    bit-exact with the reference interpreter (useBlockCache=false).
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
    path.join(__dirname, '..', 'kolibrios', 'kolibri-hummingbird.img'),
    'kolibri-0.7.7.0+8930.img',
    'kolibri.img'
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
  const cpuState = `${pc.cpu.eip >>> 0}:${pc.cpu.eflags >>> 0}:${pc.cpu.cycles}:${Array.from(pc.cpu.regs).map(r => r >>> 0).join(',')}`;
  return { width, height, fbHash, cpuState, cycles: pc.cpu.cycles };
}

function runDeterministicCheckpoints(core, imgBytes, checkpoints, useBlockCache = true) {
  const pc = new core.HummingbirdPC({ ramSizeMB: 64, deterministic: true });
  pc.cpu.useBlockCache = useBlockCache;
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
    250734,
    10000000,
    30589037,
    100000000,
    325000000
  ];

  console.log('=== Hummingbird Determinism & Block-Cache Parity Verification ===');
  console.log(`Image: ${imgPath}`);
  console.log(`Checkpoints: ${checkpoints.map(c => c.toLocaleString()).join(', ')} instructions\n`);

  const t1 = Date.now();
  const run1 = runDeterministicCheckpoints(core, imgBytes, checkpoints, true);
  console.log(`Run 1 (Block Cache ON) completed in ${((Date.now() - t1) / 1000).toFixed(2)}s`);

  const t2 = Date.now();
  const run2 = runDeterministicCheckpoints(core, imgBytes, checkpoints, true);
  console.log(`Run 2 (Block Cache ON) completed in ${((Date.now() - t2) / 1000).toFixed(2)}s\n`);

  for (let i = 0; i < checkpoints.length; i++) {
    const a = run1[i];
    const b = run2[i];
    assert.strictEqual(a.inst, b.inst, `Instruction count mismatch at checkpoint ${i}`);
    assert.strictEqual(a.cycles, b.cycles, `Virtual cycle count mismatch at inst=${a.inst}`);
    assert.strictEqual(a.fbHash, b.fbHash, `Framebuffer hash mismatch at inst=${a.inst}`);
    assert.strictEqual(a.cpuState, b.cpuState, `CPU register state mismatch at inst=${a.inst}`);
    console.log(`  [MATCH] inst=${a.inst.toLocaleString().padStart(11, ' ')} | cycles=${a.cycles.toLocaleString().padStart(11, ' ')} | ${a.width}x${a.height} | sha256=${a.fbHash.slice(0, 20)}...`);
  }

  // Verify Block Cache (useBlockCache=true) vs Pure Interpreter (useBlockCache=false)
  const parityCheckpoints = [250734, 10000000, 30589037, 50000000];
  console.log(`\nVerifying Block-Cache vs Interpreter bit-exactness up to ${parityCheckpoints[parityCheckpoints.length - 1].toLocaleString()} instructions...`);
  const rCache = runDeterministicCheckpoints(core, imgBytes, parityCheckpoints, true);
  const rInterp = runDeterministicCheckpoints(core, imgBytes, parityCheckpoints, false);
  for (let i = 0; i < parityCheckpoints.length; i++) {
    const a = rCache[i];
    const b = rInterp[i];
    assert.strictEqual(a.cycles, b.cycles, `Cache vs Interpreter cycle mismatch at inst=${a.inst}: ${a.cycles} vs ${b.cycles}`);
    assert.strictEqual(a.fbHash, b.fbHash, `Cache vs Interpreter framebuffer mismatch at inst=${a.inst}`);
    assert.strictEqual(a.cpuState, b.cpuState, `Cache vs Interpreter CPU state mismatch at inst=${a.inst}: ${a.cpuState} vs ${b.cpuState}`);
    console.log(`  [PARITY] inst=${a.inst.toLocaleString().padStart(10, ' ')} | cycles=${a.cycles.toLocaleString().padStart(11, ' ')} | sha256=${a.fbHash.slice(0, 20)}...`);
  }

  console.log('\n[PASS] Deterministic boots and Block-Cache vs Interpreter are 100% bit-identical.');
}

if (require.main === module) {
  main();
}