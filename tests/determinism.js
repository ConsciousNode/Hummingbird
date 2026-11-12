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

function primFields(o, depth = 0) {
  if (!o || typeof o !== 'object' || depth > 2) return '';
  const out = [];
  for (const k of Object.keys(o).sort()) {
    const v = o[k];
    if (k === 'pc' || k === 'cpu' || k === 'ram') continue;
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') out.push(k + '=' + v);
    else if (ArrayBuffer.isView(v) && v.length <= 65536) out.push(k + '=' + crypto.createHash('sha1').update(Buffer.from(v.buffer, v.byteOffset, v.byteLength)).digest('hex'));
    else if (Array.isArray(v) && v.length <= 4096 && v.every(x => typeof x !== 'object' || x === null)) out.push(k + '=' + JSON.stringify(v));
    else if (v && typeof v === 'object' && !ArrayBuffer.isView(v) && !Array.isArray(v) && typeof v !== 'function' && depth < 2) out.push(k + '{' + primFields(v, depth + 1) + '}');
  }
  return out.join(';');
}

function hashFramebufferAndCPU(pc) {
  const { width, height, rgba } = pc.vga.renderFrame();
  const fbBytes = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength);
  const fbHash = crypto.createHash('sha256').update(fbBytes).digest('hex');
  const cpuState = `${pc.cpu.eip >>> 0}:${pc.cpu.eflags >>> 0}:${pc.cpu.cycles}:${Array.from(pc.cpu.regs).map(r => r >>> 0).join(',')}`;
  // [Kehai audit 2026-11-11, asked by Pixie's CLUMP bots] hash the rest of the machine too: all of RAM, the x87
  // state, control and segment registers, and the primitive fields of every timed/IO device.
  const c = pc.cpu, f = c.fpu, h = crypto.createHash('sha256');
  h.update(Buffer.from(pc.ram.buffer, pc.ram.byteOffset, pc.ram.byteLength));
  h.update(Buffer.from(f.regs.buffer.slice(0))); h.update(Buffer.from(f.rawBytes)); h.update(Buffer.from(f.rawValid)); h.update(Buffer.from(f.tags));
  h.update(`fpu:${f.cw}:${f.sw}:${f.top}:${f.fpuIP}:${f.fpuCS}:${f.fpuDP}:${f.fpuDS}:${f.fpuOpcode}`);
  h.update(`cr:${c.cr0 >>> 0}:${c.cr2 >>> 0}:${c.cr3 >>> 0}:${c.cr4 >>> 0}:${c.cpl}:${Array.from(c.segBase || [])}:${Array.from(c.segIs32 || [])}`);
  for (const name of ['pit', 'pic', 'rtc', 'cmos', 'ps2', 'dma', 'fdc', 'vga']) h.update(name + ':' + primFields(pc[name]));
  return { width, height, fbHash, cpuState, stateHash: h.digest('hex'), cycles: pc.cpu.cycles };
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
    assert.strictEqual(a.stateHash, b.stateHash, `Full machine state (RAM/x87/CRs/devices) mismatch at inst=${a.inst}`);
    console.log(`  [MATCH] inst=${a.inst.toLocaleString().padStart(11, ' ')} | cycles=${a.cycles.toLocaleString().padStart(11, ' ')} | ${a.width}x${a.height} | fb ${a.fbHash.slice(0, 12)} | state ${a.stateHash.slice(0, 12)}`);
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
    assert.strictEqual(a.stateHash, b.stateHash, `Cache vs Interpreter full machine state mismatch at inst=${a.inst}`);
    console.log(`  [PARITY] inst=${a.inst.toLocaleString().padStart(10, ' ')} | cycles=${a.cycles.toLocaleString().padStart(11, ' ')} | sha256=${a.fbHash.slice(0, 20)}...`);
  }

  console.log('\n[PASS] Deterministic boots and Block-Cache vs Interpreter are 100% bit-identical.');
}

if (require.main === module) {
  main();
}