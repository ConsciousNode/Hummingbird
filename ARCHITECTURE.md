# Hummingbird Architecture (`ARCHITECTURE.md`)

**Hummingbird** is a single-file, zero-dependency x86 PC emulator (`index.html`) written from scratch in vanilla JavaScript under the MIT License. Its exact same core (`<script id="hummingbird-core">`) executes both inside a browser tab and headlessly in Node.js (`tests/headless.js`, `tests/cpu.js`, `tests/determinism.js`).

## 1. System Topology

Hummingbird is organized into five cohesive subsystems inside `index.html`:

| Subsystem | Class / Module | Role |
| :--- | :--- | :--- |
| **Constants & Font** | `createVgaFont8x16`, `PARITY_TABLE` | x86 architectural flags (`EFLAGS`, `CR0`, `CR4`), 256-entry parity lookup table, 16-color CGA/VGA text palette, and built-in 256-glyph CP437 8×16 bitmap font |
| **x87 Floating-Point Unit** | `X87FPU` | 8-register circular stack (`ST(0)..ST(7)`), IEEE-754 80-bit extended-precision (`tbyte`) reader/writer with lossless raw 10-byte preservation across `fnsave`/`frstor`, transcendental and arithmetic ops (`D8..DF`) |
| **PC Platform, Chipset & High-Level BIOS** | `HummingbirdPC`, `PIC8259Dual`, `PIT8254`, `CMOSRTC`, `PS2Controller8042`, `PCIBus`, `VGADisplay` | Physical address routing (RAM, A20 gate, VGA window `0xA0000..0xBFFFF`, BIOS ROM `0xE0000..0xFFFFF`, VBE LFB at `0xE0000000`), I/O port bus, hardware devices, and high-level BIOS interrupt handlers |
| **i586 CPU Core, MMU & Block Cache** | `X86CPU` | Real mode, 16/32-bit Protected Mode, Virtual-8086 mode, GDT/LDT/IDT/TSS segmentation, 2-level paging (4 KB + 4 MB PSE) with 4-array TLB and dirty-list flush, fault-restartable exceptions, and 64-byte cache-line-invalidated Basic-Block Cache |
| **Browser UI & Debugger** | DOM controller | Canvas renderer, Pointer-Lock PS/2 mouse bridge, DOM `KeyboardEvent.code` to AT Set 1 scancode translator, live register/flag/task debugger, Port `0xE9` + Kernel Debug Console, and standalone Cartridge exporter |

## 2. i586 CPU Core (`X86CPU`)

### 2.1 Execution Modes & Segmentation
`X86CPU` implements the complete x86 operating mode state machine:
- **Real Mode (`CR0.PE = 0`)**: 16-bit default operand/address size (overridable to 32-bit via `0x66`/`0x67` prefixes; supports Unreal Mode descriptor limits when returning from protected mode). Segment loads set `base = selector << 4`.
- **Protected Mode (`CR0.PE = 1, EFLAGS.VM = 0`)**: 16-bit and 32-bit code/stack segments (`D/B` bit in descriptor flags), GDT (`GDTR`) and LDT (`LDTR`) descriptor lookups, CPL (`CS & 3`), DPL/RPL privilege checks, conforming/non-conforming code segments, and 32-bit Task State Segment (`TSS`, `TR`) stack switching (`ESP0`/`SS0`) on Ring 3 to Ring 0 interrupts and exceptions.
- **Virtual-8086 Mode (`CR0.PE = 1, EFLAGS.VM = 1`)**: Real-mode segment base semantics under protected-mode paging with `CPL = 3`, `IOPL`-sensitive instructions (`CLI`, `STI`, `PUSHF`, `POPF`, `INT n`, `IRET`), and full segment-register (`ES`, `DS`, `FS`, `GS`) stack frame save/restore on interrupt entry and `IRETD`.

### 2.2 Paging & 4-Way Permission TLB
When `CR0.PG = 1`, linear addresses pass through a 2-level page table walk (`CR3` Page Directory -> Page Table -> 4 KB page, or 4 MB Large Page when `CR4.PSE = 1` and `PDE.PS = 1`):
- **Permission Enforcement**: Evaluates combined `U/S` (User/Supervisor) and `R/W` (Read/Write) bits across PDE and PTE, including `CR0.WP` (Write Protect in Ring 0). On violation or non-present page (`P = 0`), sets `CR2` to the exact faulting linear address and raises `#PF` (Vector 14) with the architectural error code (`bit 0 = P`, `bit 1 = W/R`, `bit 2 = U/S`).
- **Accessed & Dirty Bits**: Automatically sets `A` (`0x20`) on PDE/PTE reads and `D` (`0x40`) on writes in physical RAM.
- **4-Array Smi-Tagged TLB**: Maintains four 1M-entry `Uint32Array` tables (`tlbReadSys`, `tlbWriteSys`, `tlbReadUser`, `tlbWriteUser`) indexed by virtual page (`linAddr >>> 12`). Entries encode the physical page frame in bits `31..12` plus fast-path classification flags in bits `2..0`:
  - `bit 0 (1)`: Valid translation
  - `bit 1 (2)`: Direct physical RAM page (`physPage < ramSize`, outside read-only BIOS ROM `0xE0000..0xFFFFF`, with A20 enabled)
  - `bit 2 (4)`: Direct VBE Linear Framebuffer page (`0xE0000000..0xE0FFFFFF`), allowing `readMem32`/`writeMem32` to index `vbeLfb32[(entry & 0x00FFF000 | offset) >>> 2]` using 31-bit V8 Small Integers (`Smi`) without allocating 64-bit heap numbers for addresses `>= 0x80000000`.
- **O(1) Dirty-List TLB Flush**: Context switches in KolibriOS (`do_change_task`) reload `CR3` thousands of times per second. Rather than zeroing 16 MB of TLB arrays on every `mov cr3, eax`, `X86CPU` records populated virtual page indices in `tlbDirtyList` (`Uint32Array(65536)`) and `tlbDirtyMask`, clearing only the ~20–150 pages touched during the quantum.

### 2.3 Fault-Restartable Exceptions
Every instruction records `startEIP = eip` and `startESP = regs[ESP]` prior to decoding. Cross-page 16-bit and 32-bit writes (`(linAddr & 0xFFF) > 0xFFC`) translate both pages before writing any byte. When an exception (`#DE`, `#UD`, `#NM`, `#TS`, `#NP`, `#SS`, `#GP`, `#PF`) occurs, `raiseException` restores `eip = startEIP` and `esp = startESP` (unless inside a `REP` string loop, which preserves partial progress in `ECX`/`ESI`/`EDI`), pushes the trap frame onto the target ring stack, and throws `CPU_FAULT_SIGNAL` to unwind cleanly to the top-level loop.

### 2.4 Basic-Block Cache (Decode Once, Run Many Times)
To accelerate tight inner loops (such as KolibriOS's LZMA kernel/icon unpackers and `Vesa20_drawbackground_tiled`), `X86CPU` includes a direct-mapped 65,536-entry Basic-Block Cache (`blockCache`) active in 32-bit flat mode:
- **Decoding**: Decodes sequences of up to 16 instructions (ALU, `MOV`, `MOVZX`, `LEA`, `TEST`, `INC`/`DEC`, `PUSH`/`POP`, `SHIFT`, `IMUL`, `XCHG`, 16-bit `0x66` `MOV`/`ALU`, and block terminators `Jcc`, `JMP`, `CALL`, `RET`) into pre-decoded micro-ops with flat integer fields (`type, mod, reg, rm, base, index, scale, disp, imm, aluOp`).
- **64-Byte Cache-Line Self-Modifying Code Invalidation**: Physical RAM is partitioned into 64-byte cache lines (`physAddr >>> 6`, tracked in `pageWriteVersion`). Any write to physical RAM increments the corresponding 64-byte line version. Each cached block stores the versions of its start and end 64-byte lines (`ver`, `ver1`) and checks them before and during execution, ensuring immediate invalidation on self-modifying code while preventing false invalidation when data variables share a 4 KB page with code (as in `KERNEL.MNT`'s unpacker at `0x280000`).
- **Bit-Exact Equivalence**: Every micro-op in `execBasicBlock` updates `startEIP`, `startESP`, `eip`, `totalInstructions`, and `pit.instAccum` identically to single-instruction stepping.

## 3. High-Level BIOS & PC Devices (`HummingbirdPC`)

### 3.1 High-Level BIOS Architecture
Rather than executing an external third-party BIOS ROM binary, Hummingbird installs 5-byte real-mode trap stubs at `F000:(0xE000 + vec * 8)` for all 256 IVT vectors (`0x00..0xFF`):
```
stub+0: CF       IRET
stub+1: FB       STI
stub+2: F4       HLT
stub+3: EB FB    JMP stub+0
```
When real-mode code executes `INT vec` (or when `stepInstruction` fetches `CS=0xF000, IP=0xE000 + vec*8`), `HummingbirdPC.handleBiosInterrupt(vec)` runs in JavaScript, updates CPU registers and flags on the stacked `FLAGS` word, and lets the CPU execute the `IRET` at `stub+0`. For blocking `INT 16h AH=00h/10h` (Wait for Keystroke) when no key is queued, the BIOS handler advances `IP` to `stub+1` (`STI; HLT; JMP stub+0`), allowing hardware `IRQ0` (`INT 08h`, which KolibriOS's boot menu hooks to `.newtimer` for its 2-second countdown) and `IRQ1` (`INT 09h`) to fire naturally in real mode.

### 3.2 Deterministic Timing Model
When `deterministic` mode is enabled (default):
- All timers (`PIT8254`, `RDTSC`, port `0x61` refresh toggle, and VGA `0x3DA` vertical retrace) advance strictly as pure functions of `cpu.totalInstructions`.
- `CMOSRTC` starts at a fixed epoch (`2025-09-29 23:24:00`, matching the reference screenshot `ref-2-desktop.png`) and increments 1 second per 100,000,000 instructions.
- Two runs of the same floppy image are guaranteed to produce identical framebuffers and register states at every instruction count.
