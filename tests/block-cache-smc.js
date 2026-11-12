#!/usr/bin/env node
// ============================================================================
// Hummingbird: decoded-block invalidation test (tests/block-cache-smc.js)
//
// A 26-instruction block spanning three 64-byte lines is decoded and run, then one immediate is rewritten
// and the block is run again, with the block cache on and off. The two must agree. Writers: a guest/DMA-path
// store to the first, middle and last line, a BIOS INT 13h AH=02h sector read, and an INT 15h AH=87h block move.
// Round-2 question from Pixie's CLUMP bots (Squabble found the middle-line hole in the code, Kebai asked about
// DMA). As of 1.1 both the middle-line write and the two BIOS paths ran stale decoded code; fixed 2026-11-11.
// ============================================================================
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
pc.a20Enabled = true;
// Kehai, round-2 check of the bots' finding: a block spanning 3+ cache lines, middle line rewritten.
const imm32 = v => [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, v >>> 24];
function trial(useCache, writer, idx = 14) {
  pc.cpu.useBlockCache = useCache; if (cpu.blockCache) cpu.blockCache.fill(null);
  const base = 0x10000, N = 26;                     // 26 x "add eax, imm32" = 130 bytes -> lines 0,1,2
  const code = []; for (let i = 0; i < N; i++) code.push(0x05, ...imm32(1)); code.push(0xF4);
  for (let k = 0; k < code.length; k++) pc.physWrite8(base + k, code[k]);
  const run = () => { cpu.eip = base; cpu.regs[0] = 0; cpu.halted = false; cpu.runSteps(N); return cpu.regs[0] >>> 0; };
  const first = run();                               // decode + run once (expect 26)
  writer(base + idx * 5 + 1, 1000);                   // instruction 14's immediate: byte 71 = middle line
  const second = run();                              // expect 26 - 1 + 1000 = 1025
  return { first, second };
}
const viaCpuWrite = (a, v) => pc.physWrite32(a, v);  // same path as a guest store or DMA
// Real BIOS path: build a floppy whose sector 0 is the block with instruction 14's immediate changed, and
// INT 13h AH=02h it over the cached block (the BIOS writes RAM itself, not through the CPU or DMA).
const viaInt13 = (a, v) => {
  const base = 0x10000, img = new Uint8Array(1474560); img.set(pc.ram.subarray(base, base + 512));
  imm32(v).forEach((b, i) => img[a - base + i] = b);
  pc.floppyImage = img; cpu.regs[4] = 0x80000;
  pc.handleBiosInt13(0x0201, 0x02, 0x01, base, 0x0001, 0x0000, 0);   // ES base 0 (flat), BX = 0x10000
};
// INT 15h AH=87h block move: copy a patched 4-byte immediate from 0x20000 over the cached block (needs a GDT descriptor pair)
const viaInt15 = (a, v) => {
  imm32(v).forEach((b, i) => pc.ram[0x20000 + i] = b);
  const g = 0x8000; for (let i = 0; i < 48; i++) pc.ram[g + i] = 0;
  const desc = (o, addr) => { pc.ram[g + o] = 0xFF; pc.ram[g + o + 1] = 0xFF; pc.ram[g + o + 2] = addr & 0xFF; pc.ram[g + o + 3] = (addr >>> 8) & 0xFF; pc.ram[g + o + 4] = (addr >>> 16) & 0xFF; pc.ram[g + o + 5] = 0x93; pc.ram[g + o + 7] = addr >>> 24; };
  desc(0x10, 0x20000); desc(0x18, a);
  cpu.regs[4] = 0x80000; cpu.loadSegment(0, 0x10);
  pc.handleBiosInt15(0x8700, 0, 2, 0, g, 0);   // CX = 2 words, ES:SI = GDT
};
const results = [];
for (const [name, w, idx] of [['control: line 0 (instr 0), guest write', viaCpuWrite, 0], ['control: last line (instr 25), guest write', viaCpuWrite, 25], ['MIDDLE line (instr 14), guest/DMA write', viaCpuWrite, 14], ['BIOS INT 13h AH=02h sector read', viaInt13, 14], ['BIOS INT 15h AH=87h block move', viaInt15, 14]]) {
  const c = trial(true, w, idx), i = trial(false, w, idx);
  results.push(c.second === i.second);
  console.log(`${name.padEnd(44)} cache ON: ${c.first} -> ${c.second}   interpreter: ${i.first} -> ${i.second}   ${c.second === i.second ? 'agree' : 'STALE BLOCK'}`);
}

const bad = results.filter(r => !r).length;
console.log(bad ? `FAIL: ${bad} stale-block case(s)` : 'PASS: every write invalidated the decoded block');
process.exit(bad ? 1 : 0);
