#!/usr/bin/env node
// ============================================================================
// Hummingbird — differential CPU test against a real x86 processor.
//
// tests/cpu-oracle.txt holds 28,000 cases (140 instruction forms x 200 inputs)
// recorded on real hardware by tests/oracle/ (Python generates one asm routine
// per form; a 32-bit C driver runs them with random and edge-case inputs and
// random incoming flags). This script replays every case in Hummingbird and
// compares EAX..EDX and the status flags. Flags and results that the Intel SDM
// calls undefined are masked per case (see tests/oracle/oracle.c).
//
// Usage: node tests/cpu-oracle.js [--verbose]
// Regenerate (x86 host with gcc-multilib):
//   python3 tests/oracle/gen.py && gcc -m32 -O1 -o /tmp/oracle tests/oracle/ops.S \
//     tests/oracle/oracle.c && /tmp/oracle > tests/cpu-oracle.txt
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');
const { loadCoreFromHtml } = require('./headless.js');

const core = loadCoreFromHtml(path.join(__dirname, '..', 'index.html'));
const lines = fs.readFileSync(path.join(__dirname, 'cpu-oracle.txt'), 'utf8').trim().split('\n');
const { ops } = JSON.parse(lines[0]);
const verbose = process.argv.includes('--verbose');

// 32-bit flat protected mode, ring 0 (same setup as tests/cpu.js)
const pc = new core.HummingbirdPC({ ramSizeMB: 16, deterministic: true });
const cpu = pc.cpu;
function gdt(sel, base, limit, access, gran) {
  const a = 0x1000 + (sel & ~7);
  pc.physWrite16(a, limit & 0xFFFF); pc.physWrite16(a + 2, base & 0xFFFF);
  pc.physWrite8(a + 4, (base >>> 16) & 0xFF); pc.physWrite8(a + 5, access);
  pc.physWrite8(a + 6, ((limit >>> 16) & 0x0F) | (gran << 4)); pc.physWrite8(a + 7, base >>> 24);
}
gdt(0x00, 0, 0, 0, 0); gdt(0x08, 0, 0xFFFFF, 0x9A, 0x0C); gdt(0x10, 0, 0xFFFFF, 0x92, 0x0C);
cpu.gdtrBase = 0x1000; cpu.gdtrLimit = 0x17;
cpu.cr0 |= 1;
cpu.loadSegment(1, 0x08); for (const s of [0, 2, 3, 4, 5]) cpu.loadSegment(s, 0x10);

const STATUS = 0x8D5;
const FLAG_NAMES = [[0x1, 'CF'], [0x4, 'PF'], [0x10, 'AF'], [0x40, 'ZF'], [0x80, 'SF'], [0x800, 'OF']];
const flagStr = f => FLAG_NAMES.filter(([b]) => f & b).map(([, n]) => n).join('|') || '-';
const imm32 = v => [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, v >>> 24];

const byOp = ops.map(o => ({ ...o, pass: 0, fail: 0, firstFail: null }));
let codeAddr = 0x10000;
for (let li = 1; li < lines.length; li++) {
  const f = lines[li].split(' ');
  const i = parseInt(f[0], 10);
  const v = f.slice(1).map(x => parseInt(x, 16) >>> 0);
  const [a, b, c, d, fl, A, B, C, D, F, fm, rm0] = v;
  const op = byOp[i];
  const body = Buffer.from(op.hex, 'hex');
  const code = [0xB8, ...imm32(a), 0xBB, ...imm32(b), 0xB9, ...imm32(c), 0xBA, ...imm32(d),
    0x68, ...imm32((fl & ~0x200) >>> 0), 0x9D, ...body, 0x9C, 0x5E];
  // rotate code addresses so a stale decode can't hide behind the same bytes
  codeAddr = codeAddr >= 0x30000 ? 0x10000 : codeAddr + 0x40;
  for (let k = 0; k < code.length; k++) pc.physWrite8(codeAddr + k, code[k]);
  cpu.eip = codeAddr; cpu.regs[4] = 0x80000; cpu.halted = false;
  const end = codeAddr + code.length;
  let steps = 0;
  while (cpu.eip !== end && steps < 32) { cpu.step(); steps++; }
  const got = [cpu.regs[0] >>> 0, cpu.regs[3] >>> 0, cpu.regs[1] >>> 0, cpu.regs[2] >>> 0, cpu.regs[6] >>> 0];
  const want = [A, B, C, D, F];
  const regOk = ((got[0] ^ want[0]) & rm0) === 0 && got[1] === want[1] && got[2] === want[2] && got[3] === want[3];
  const flOk = ((got[4] ^ want[4]) & fm & STATUS) === 0;
  if (cpu.eip === end && regOk && flOk) op.pass++;
  else {
    op.fail++;
    if (!op.firstFail) op.firstFail = { in: [a, b, c, d].map(x => x.toString(16)), flagsIn: flagStr(fl), want: want.slice(0, 4).map(x => x.toString(16)), got: got.slice(0, 4).map(x => x.toString(16)),
      wantFlags: flagStr(want[4] & fm), gotFlags: flagStr(got[4] & fm), comparedFlags: flagStr(fm), stuckAt: cpu.eip === end ? null : '0x' + cpu.eip.toString(16) };
  }
}

let pass = 0, fail = 0;
const failing = byOp.filter(o => o.fail);
for (const o of byOp) { pass += o.pass; fail += o.fail; }
console.log('=== Hummingbird vs real x86 (differential, ' + (lines.length - 1) + ' cases, ' + ops.length + ' instruction forms) ===');
for (const o of failing) {
  console.log(`  [FAIL] ${o.name.padEnd(12)} (${o.hex}) ${o.fail}/${o.pass + o.fail} cases differ`);
  if (verbose || failing.length <= 40) console.log('         first: ' + JSON.stringify(o.firstFail));
}
console.log(`\n${ops.length - failing.length}/${ops.length} instruction forms match on every case; ${pass}/${pass + fail} cases match.`);
if (fail) process.exit(1);