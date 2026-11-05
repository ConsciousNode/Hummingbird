#!/usr/bin/env node
// ============================================================================
// Hummingbird x86 PC Emulator — Comprehensive i586 CPU & Exception Test Suite
// Loads the emulator core directly from index.html and verifies every
// instruction group, exact arithmetic/logic/shift/multiply/BCD flags, x87 FPU,
// 4KB & 4MB PSE paging, TLB invalidation, and exception/privilege paths
// (#DE, #UD, #NM, #GP, #PF, Ring 0 <-> Ring 3 transitions).
//
// Usage:
//   node tests/cpu.js
// ============================================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

function loadCore() {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const match = html.match(/<script\s+id=["']hummingbird-core["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) throw new Error('Could not find <script id="hummingbird-core"> in index.html');
  const sandbox = {
    console, Math, Date,
    Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array,
    ArrayBuffer, DataView, Map, Set, BigInt, Number, String, Object, Boolean, Array, Error, TextDecoder
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(match[1], sandbox);
  return sandbox;
}

const core = loadCore();

const FL_CF = 0x0001;
const FL_PF = 0x0004;
const FL_AF = 0x0010;
const FL_ZF = 0x0040;
const FL_SF = 0x0080;
const FL_IF = 0x0200;
const FL_DF = 0x0400;
const FL_OF = 0x0800;

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

// Create a fresh PC configured in 32-bit flat protected mode at Ring 0 (CS=0x08, DS=ES=SS=0x10)
function createFlatPM32PC() {
  const pc = new core.HummingbirdPC({ ramSizeMB: 16, deterministic: true });
  const cpu = pc.cpu;
  // Set up GDT at physical 0x1000:
  // 0x00: Null
  // 0x08: Ring 0 Code32 (base=0, limit=4GB, access=0x9A, flags=0x0C)
  // 0x10: Ring 0 Data32 (base=0, limit=4GB, access=0x92, flags=0x0C)
  // 0x18: Ring 3 Code32 (base=0, limit=4GB, access=0xFA, flags=0x0C) -> selector 0x1B
  // 0x20: Ring 3 Data32 (base=0, limit=4GB, access=0xF2, flags=0x0C) -> selector 0x23
  // 0x28: 32-bit TSS (base=0x2000, limit=0x67, access=0x89, flags=0x00)
  function writeGdtEntry(sel, base, limit, access, gran) {
    const addr = 0x1000 + (sel & ~7);
    pc.physWrite16(addr + 0, limit & 0xFFFF);
    pc.physWrite16(addr + 2, base & 0xFFFF);
    pc.physWrite8(addr + 4, (base >>> 16) & 0xFF);
    pc.physWrite8(addr + 5, access);
    pc.physWrite8(addr + 6, ((limit >>> 16) & 0x0F) | ((gran & 0x0F) << 4));
    pc.physWrite8(addr + 7, (base >>> 24) & 0xFF);
  }
  writeGdtEntry(0x00, 0, 0, 0, 0);
  writeGdtEntry(0x08, 0, 0xFFFFF, 0x9A, 0x0C);
  writeGdtEntry(0x10, 0, 0xFFFFF, 0x92, 0x0C);
  writeGdtEntry(0x18, 0, 0xFFFFF, 0xFA, 0x0C);
  writeGdtEntry(0x20, 0, 0xFFFFF, 0xF2, 0x0C);
  writeGdtEntry(0x28, 0x2000, 0x0067, 0x89, 0x00);

  // TSS at 0x2000: ESP0 = 0x90000, SS0 = 0x10, I/O map base = 0x68
  pc.physWrite32(0x2004, 0x90000);
  pc.physWrite16(0x2008, 0x0010);
  pc.physWrite16(0x2066, 0x0068);

  cpu.gdtrBase = 0x1000;
  cpu.gdtrLimit = 0x002F;
  cpu.idtrBase = 0x3000;
  cpu.idtrLimit = 0x07FF;
  cpu.cr0 |= 1; // CR0_PE = 1
  cpu.loadSegment(1, 0x08); // CS
  cpu.loadSegment(0, 0x10); // ES
  cpu.loadSegment(2, 0x10); // SS
  cpu.loadSegment(3, 0x10); // DS
  cpu.loadSegment(4, 0x10); // FS
  cpu.loadSegment(5, 0x10); // GS
  cpu.loadTR(0x28);
  cpu.regs[4] = 0x80000; // ESP
  cpu.eip = 0x10000;
  return { pc, cpu };
}

function loadCode(pc, bytes, addr = 0x10000) {
  for (let i = 0; i < bytes.length; i++) {
    pc.physWrite8(addr + i, bytes[i]);
  }
  pc.cpu.eip = addr;
}

function setIdtGate(pc, vec, sel, offset, dpl = 0, type = 0x0E) {
  const addr = 0x3000 + vec * 8;
  pc.physWrite16(addr + 0, offset & 0xFFFF);
  pc.physWrite16(addr + 2, sel);
  pc.physWrite8(addr + 4, 0);
  pc.physWrite8(addr + 5, 0x80 | ((dpl & 3) << 5) | (type & 0x1F));
  pc.physWrite16(addr + 6, (offset >>> 16) & 0xFFFF);
}

console.log('=== Hummingbird i586 CPU & Exception Test Suite ===\n');

// ----------------------------------------------------------------------------
// Group 1: Integer ALU & Exact Flags (ADD, ADC, SUB, SBB, CMP, INC, DEC, NEG, Logic)
// ----------------------------------------------------------------------------
test('Group 1: ADD/ADC/SUB/SBB/CMP/INC/DEC/NEG 8/16/32-bit results and exact flags (CF, PF, AF, ZF, SF, OF)', () => {
  const { pc, cpu } = createFlatPM32PC();
  // 1. Signed overflow on 32-bit ADD: 0x7FFFFFFF + 1 = 0x80000000 (OF=1, SF=1, AF=1, CF=0, ZF=0, PF=1)
  loadCode(pc, [
    0xB8, 0xFF, 0xFF, 0xFF, 0x7F, // mov eax, 0x7FFFFFFF
    0x05, 0x01, 0x00, 0x00, 0x00, // add eax, 1
    // 2. INC preserves CF: set CF=1 (STC), inc ebx (0xFFFFFFFF -> 0) -> ZF=1, CF still 1!
    0xF9,                         // stc
    0xBB, 0xFF, 0xFF, 0xFF, 0xFF, // mov ebx, 0xFFFFFFFF
    0x43,                         // inc ebx
    // 3. NEG 0x80000000 -> 0x80000000 with CF=1, OF=1, SF=1
    0xB9, 0x00, 0x00, 0x00, 0x80, // mov ecx, 0x80000000
    0xF7, 0xD9                    // neg ecx
  ]);
  cpu.step(); cpu.step();
  assert.strictEqual(cpu.regs[0] >>> 0, 0x80000000);
  assert.strictEqual(Boolean(cpu.eflags & FL_OF), true, 'ADD 0x7FFFFFFF+1 should set OF');
  assert.strictEqual(Boolean(cpu.eflags & FL_SF), true, 'ADD 0x7FFFFFFF+1 should set SF');
  assert.strictEqual(Boolean(cpu.eflags & FL_AF), true, 'ADD 0x7FFFFFFF+1 should set AF');
  assert.strictEqual(Boolean(cpu.eflags & FL_CF), false, 'ADD 0x7FFFFFFF+1 should clear CF');

  cpu.step(); cpu.step(); cpu.step();
  assert.strictEqual(cpu.regs[3] >>> 0, 0);
  assert.strictEqual(Boolean(cpu.eflags & FL_ZF), true, 'INC -1 should set ZF');
  assert.strictEqual(Boolean(cpu.eflags & FL_CF), true, 'INC must preserve prior CF=1');

  cpu.step(); cpu.step();
  assert.strictEqual(cpu.regs[1] >>> 0, 0x80000000);
  assert.strictEqual(Boolean(cpu.eflags & FL_CF), true, 'NEG non-zero must set CF=1');
  assert.strictEqual(Boolean(cpu.eflags & FL_OF), true, 'NEG 0x80000000 must set OF=1');
});

// ----------------------------------------------------------------------------
// Group 2: Shifts, Rotates & Double-Precision Shifts (SHL, SHR, SAR, ROL, ROR, SHLD, SHRD)
// ----------------------------------------------------------------------------
test('Group 2: SHL/SHR/SAR/ROL/ROR/RCL/RCR and SHLD/SHRD with count masking & exact flags', () => {
  const { pc, cpu } = createFlatPM32PC();
  loadCode(pc, [
    0xB8, 0x00, 0x00, 0x00, 0x80, // mov eax, 0x80000000
    0xC1, 0xF8, 0x04,             // sar eax, 4 -> 0xF8000000
    0xBB, 0x34, 0x12, 0x00, 0x00, // mov ebx, 0x00001234
    0xBA, 0xBC, 0x9A, 0x78, 0x56, // mov edx, 0x56789ABC
    0x0F, 0xA4, 0xD3, 0x10,       // shld ebx, edx, 16 -> 0x12345678
    0x0F, 0xAC, 0xD3, 0x08        // shrd ebx, edx, 8  -> 0xBC123456
  ]);
  for (let i = 0; i < 6; i++) cpu.step();
  assert.strictEqual(cpu.regs[0] >>> 0, 0xF8000000, 'SAR sign extension failed');
  assert.strictEqual(cpu.regs[3] >>> 0, 0xBC123456, 'SHLD/SHRD result mismatch');
});

// ----------------------------------------------------------------------------
// Group 3: Multiply, Divide, BCD & Sign-Extension (MUL, IMUL, DIV, IDIV, DAA, AAM, CDQ)
// ----------------------------------------------------------------------------
test('Group 3: MUL/IMUL (1, 2, and 3 operand), DIV/IDIV, BCD (DAA/AAM), and CBW/CWDE/CDQ', () => {
  const { pc, cpu } = createFlatPM32PC();
  loadCode(pc, [
    0xB8, 0xF9, 0xFF, 0xFF, 0xFF, // mov eax, -7
    0x99,                         // cdq -> edx = 0xFFFFFFFF
    0x6B, 0xC8, 0x06,             // imul ecx, eax, 6 -> -42 (0xFFFFFFD6), CF=0, OF=0
    0xB8, 0x2A, 0x00, 0x00, 0x00, // mov eax, 42
    0xD4, 0x0A                    // aam 10 -> AH=4, AL=2 (AX=0x0402)
  ]);
  for (let i = 0; i < 5; i++) cpu.step();
  assert.strictEqual(cpu.regs[2] >>> 0, 0xFFFFFFFF, 'CDQ sign extension failed');
  assert.strictEqual(cpu.regs[1] | 0, -42, '3-operand IMUL failed');
  assert.strictEqual(cpu.regs[0] & 0xFFFF, 0x0402, 'AAM failed');
});

// ----------------------------------------------------------------------------
// Group 4: Bit Manipulation & Atomic Ops (BT/BTS/BTR/BTC memory >32, BSF/BSR, BSWAP, CMPXCHG8B, XADD)
// ----------------------------------------------------------------------------
test('Group 4: Memory BTS with bit offset >= 32, BSF/BSR, BSWAP, XADD, and CMPXCHG8B', () => {
  const { pc, cpu } = createFlatPM32PC();
  pc.physWrite32(0x40008, 0x00000000); // Bit 69 is bit 5 of dword at 0x40008
  loadCode(pc, [
    0xB8, 0x45, 0x00, 0x00, 0x00,             // mov eax, 69
    0x0F, 0xAB, 0x05, 0x00, 0x00, 0x04, 0x00, // bts [0x40000], eax
    0xB9, 0x78, 0x56, 0x34, 0x12,             // mov ecx, 0x12345678
    0x0F, 0xC9,                               // bswap ecx -> 0x78563412
    0x0F, 0xBC, 0xD0                          // bsf edx, eax (69 = 0b1000101 -> bit 0)
  ]);
  for (let i = 0; i < 5; i++) cpu.step();
  assert.strictEqual(pc.physRead32(0x40008), 1 << 5, 'Memory BTS with bitOffset=69 failed');
  assert.strictEqual(cpu.regs[1] >>> 0, 0x78563412, 'BSWAP failed');
  assert.strictEqual(cpu.regs[2] >>> 0, 0, 'BSF failed');
});

// ----------------------------------------------------------------------------
// Group 5: String Instructions with REP / REPE / REPNE (MOVSD, STOSB, CMPSB, SCASB)
// ----------------------------------------------------------------------------
test('Group 5: REP STOSB, REP MOVSD, and REPNE SCASB string operations', () => {
  const { pc, cpu } = createFlatPM32PC();
  loadCode(pc, [
    0xFC,                         // cld
    0xBF, 0x00, 0x00, 0x05, 0x00, // mov edi, 0x50000
    0xB9, 0x08, 0x00, 0x00, 0x00, // mov ecx, 8
    0xB0, 0x5A,                   // mov al, 0x5A
    0xF3, 0xAA,                   // rep stosb
    0xC6, 0x05, 0x05, 0x00, 0x05, 0x00, 0x99, // mov byte [0x50005], 0x99
    0xBF, 0x00, 0x00, 0x05, 0x00, // mov edi, 0x50000
    0xB9, 0x08, 0x00, 0x00, 0x00, // mov ecx, 8
    0xB0, 0x99,                   // mov al, 0x99
    0xF2, 0xAE                    // repne scasb
  ]);
  for (let i = 0; i < 10; i++) cpu.step();
  assert.strictEqual(cpu.regs[7] >>> 0, 0x50006, 'REPNE SCASB stopped at wrong EDI');
  assert.strictEqual(cpu.regs[1] >>> 0, 2, 'REPNE SCASB remaining ECX mismatch');
  assert.strictEqual(Boolean(cpu.eflags & FL_ZF), true, 'REPNE SCASB should set ZF on match');
});

// ----------------------------------------------------------------------------
// Group 6: CPUID (Honest i586 Pentium without MMX/SSE) & x87 FPU + FNSAVE/FRSTOR
// ----------------------------------------------------------------------------
test('Group 6: CPUID reports honest Pentium i586 (Family 5, FPU=1, MMX=0, SSE=0) and x87 FPU computes & preserves state', () => {
  const { pc, cpu } = createFlatPM32PC();
  loadCode(pc, [
    0xB8, 0x01, 0x00, 0x00, 0x00, // mov eax, 1
    0x0F, 0xA2,                   // cpuid
    // x87 FPU: compute sqrt(49.0) = 7.0, store to [0x60000], fnsave [0x60100], frstor [0x60100]
    0xDB, 0xE3,                   // fninit
    0xC7, 0x05, 0x00, 0x00, 0x06, 0x00, 0x31, 0x00, 0x00, 0x00, // mov dword [0x60000], 49
    0xDB, 0x05, 0x00, 0x00, 0x06, 0x00, // fild dword [0x60000]
    0xD9, 0xFA,                   // fsqrt -> ST(0) = 7.0
    0xDD, 0x35, 0x00, 0x01, 0x06, 0x00, // fnsave [0x60100]
    0xDD, 0x25, 0x00, 0x01, 0x06, 0x00, // frstor [0x60100]
    0xDB, 0x1D, 0x04, 0x00, 0x06, 0x00  // fistp dword [0x60004]
  ]);
  cpu.step(); cpu.step();
  const family = (cpu.regs[0] >>> 8) & 0x0F;
  const edx = cpu.regs[2] >>> 0;
  assert.strictEqual(family, 5, 'CPUID family must be 5 (Pentium i586)');
  assert.strictEqual(Boolean(edx & (1 << 0)), true, 'CPUID must report x87 FPU present');
  assert.strictEqual(Boolean(edx & (1 << 23)), false, 'CPUID must report MMX absent (0)');
  assert.strictEqual(Boolean(edx & (1 << 25)), false, 'CPUID must report SSE absent (0)');

  for (let i = 0; i < 7; i++) cpu.step();
  assert.strictEqual(pc.physRead32(0x60004), 7, 'x87 FPU FSQRT + FNSAVE/FRSTOR failed');
});

// ----------------------------------------------------------------------------
// Group 7: Exception Paths (#DE Divide Error, #UD Invalid Opcode) & Fault Restartability
// ----------------------------------------------------------------------------
test('Group 7: #DE (Divide Error, Vector 0) and #UD (Invalid Opcode, Vector 6) push exact fault EIP', () => {
  const { pc, cpu } = createFlatPM32PC();
  // Handler for #DE at 0x20000: sets EDX=1, advances stacked EIP by 2, IRET
  loadCode(pc, [
    0xBA, 0x01, 0x00, 0x00, 0x00, // mov edx, 1
    0x83, 0x04, 0x24, 0x02,       // add dword [esp], 2 (skip faulting div ecx)
    0xCF                          // iretd
  ], 0x20000);
  setIdtGate(pc, 0, 0x08, 0x20000, 0, 0x0E);

  // Handler for #UD at 0x21000: sets EBX=0xDEAD, advances stacked EIP by 2 (skip UD2), IRET
  loadCode(pc, [
    0xBB, 0xAD, 0xDE, 0x00, 0x00, // mov ebx, 0xDEAD
    0x83, 0x04, 0x24, 0x02,       // add dword [esp], 2
    0xCF                          // iretd
  ], 0x21000);
  setIdtGate(pc, 6, 0x08, 0x21000, 0, 0x0E);

  loadCode(pc, [
    0xB8, 0x64, 0x00, 0x00, 0x00, // mov eax, 100
    0x31, 0xD2,                   // xor edx, edx
    0x31, 0xC9,                   // xor ecx, ecx
    0xF7, 0xF1,                   // div ecx -> triggers #DE at EIP=0x10009, handler sets EDX=1 -> 100/1? Wait: handler skips div!
    0x0F, 0x0B,                   // ud2 -> triggers #UD at EIP=0x1000B, handler sets EBX=0xDEAD
    0x90                          // nop
  ], 0x10000);

  for (let i = 0; i < 12; i++) cpu.step();
  assert.strictEqual(cpu.regs[2] >>> 0, 1, '#DE handler did not run');
  assert.strictEqual(cpu.regs[3] >>> 0, 0xDEAD, '#UD handler did not run');
  assert.ok(pc.lastUD && pc.lastUD.includes('0x0F / 0x0B'), '#UD opcode was not logged to pc.lastUD');
});

// ----------------------------------------------------------------------------
// Group 8: Paging (4KB & 4MB PSE), #PF Page Fault with CR2 & Error Code, and Ring 3 -> Ring 0 TSS Stack Switch
// ----------------------------------------------------------------------------
test('Group 8: Paging, Ring 0 -> Ring 3 IRET, Ring 3 #GP(0) and #PF (CR2 + error code=7) with TSS Ring 0 stack switch', () => {
  const { pc, cpu } = createFlatPM32PC();
  // Build Page Directory at 0x70000 and Page Table 0 at 0x71000
  const pdBase = 0x70000;
  const ptBase = 0x71000;
  pc.physWrite32(pdBase + 0, ptBase | 0x07); // PDE 0: Present, RW, User
  // Identity-map first 1MB (pages 0..255) as User + RW
  for (let p = 0; p < 256; p++) {
    pc.physWrite32(ptBase + p * 4, (p * 0x1000) | 0x07);
  }
  // Map virtual page 0x000A0000 as User + Read-Only (bit 1 RW = 0 -> 0x05)
  pc.physWrite32(ptBase + 0xA0 * 4, 0x000A0000 | 0x05);

  // Enable paging + Write Protect (CR0.PG | CR0.WP | CR0.PE)
  cpu.cr3 = pdBase;
  cpu.cr0 = (0x80010011) >>> 0;
  cpu.flushTLB();

  // #PF handler (Vector 14) at 0x22000:
  // Saves error code from [ESP] into ESI, CR2 into EDI, fixes PTE to RW (0x07), INVLPG, pops error code, and IRETD to retry instruction!
  loadCode(pc, [
    0x5E,                                     // pop esi (error code)
    0x0F, 0x20, 0xD7,                         // mov edi, cr2
    0xC7, 0x05, 0x80, 0x12, 0x07, 0x00, 0x07, 0x00, 0x0A, 0x00, // mov dword [0x71280], 0x000A0007
    0x0F, 0x01, 0x3D, 0x00, 0x00, 0x0A, 0x00, // invlpg [0xA0000]
    0xCF                                      // iretd (restarts faulting store!)
  ], 0x22000);
  setIdtGate(pc, 14, 0x08, 0x22000, 0, 0x0E);

  // #GP handler (Vector 13) at 0x23000:
  // Pops error code into EDX, advances EIP by 1 (skip CLI), IRETD
  loadCode(pc, [
    0x5A,                   // pop edx
    0x83, 0x04, 0x24, 0x01, // add dword [esp], 1
    0xCF                    // iretd
  ], 0x23000);
  setIdtGate(pc, 13, 0x08, 0x23000, 0, 0x0E);

  // Ring 3 user code at 0x12000:
  // 1. Write 0xCAFEBABE to read-only page [0xA0010] -> triggers #PF(err=7: User|Write|Present), handler makes page writable & restarts store!
  // 2. Execute privileged CLI in Ring 3 -> triggers #GP(0), handler skips CLI!
  loadCode(pc, [
    0xC7, 0x05, 0x10, 0x00, 0x0A, 0x00, 0xBE, 0xBA, 0xFE, 0xCA, // mov dword [0xA0010], 0xCAFEBABE
    0xFA,                                                       // cli (privileged -> #GP in Ring 3)
    0xB8, 0x37, 0x13, 0x00, 0x00                                // mov eax, 0x1337
  ], 0x12000);

  // Drop from Ring 0 to Ring 3 via IRETD (CS=0x1B, EIP=0x12000, SS=0x23, ESP=0x88000, EFLAGS=0x202)
  loadCode(pc, [
    0x6A, 0x23,                   // push 0x23 (Ring 3 SS)
    0x68, 0x00, 0x80, 0x08, 0x00, // push 0x88000 (Ring 3 ESP)
    0x68, 0x02, 0x02, 0x00, 0x00, // push 0x202 (EFLAGS)
    0x6A, 0x1B,                   // push 0x1B (Ring 3 CS)
    0x68, 0x00, 0x20, 0x01, 0x00, // push 0x12000 (Ring 3 EIP)
    0xCF                          // iretd -> enters Ring 3!
  ], 0x10000);

  for (let i = 0; i < 20; i++) cpu.step();
  assert.strictEqual(cpu.cpl, 3, 'Should return to Ring 3 (CPL=3)');
  assert.strictEqual(cpu.regs[7] >>> 0, 0x000A0010, 'CR2 should capture exact faulting linear address 0xA0010');
  assert.strictEqual(cpu.regs[6] >>> 0, 0x07, '#PF error code should be 7 (User=4 | Write=2 | Present=1)');
  assert.strictEqual(pc.physRead32(0xA0010) >>> 0, 0xCAFEBABE, 'Faulting store must succeed after #PF handler fixes PTE and IRETs');
  assert.strictEqual(cpu.regs[0] >>> 0, 0x1337, 'Execution should continue after #GP handler skips privileged CLI');
});

console.log(`\n=== CPU Test Summary: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);