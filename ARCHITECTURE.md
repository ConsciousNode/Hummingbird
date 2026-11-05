# Hummingbird 1.1 Architecture (`ARCHITECTURE.md`)

**Hummingbird 1.1** is a single-file, zero-dependency x86 PC emulator (`index.html`) written from scratch in vanilla JavaScript under the MIT License. Its exact same core (`<script id="hummingbird-core">`) executes both inside a browser tab and headlessly in Node.js (`tests/os-suite.js`, `tests/bench.js`, `tests/headless.js`, `tests/cpu.js`, `tests/cpu-oracle.js`, `tests/determinism.js`).

## 1. System Topology

Hummingbird 1.1 is organized into five cohesive subsystems inside `index.html`:

| Subsystem | Class / Module | Role |
| :--- | :--- | :--- |
| **Constants & Font** | `createVgaFont8x16`, `PARITY_TABLE` | x86 architectural flags (`EFLAGS`, `CR0`, `CR4`), 256-entry parity lookup table, 16-color CGA/VGA text palette, and built-in 256-glyph CP437 8×16 bitmap font |
| **x87 Floating-Point Unit** | `X87FPU` | 8-register circular stack (`ST(0)..ST(7)`), IEEE-754 80-bit extended-precision (`tbyte`) reader/writer with lossless raw 10-byte preservation across `fnsave`/`frstor`, transcendental and arithmetic ops (`D8..DF`) |
| **PC Platform, Chipset & High-Level BIOS** | `HummingbirdPC`, `PIC8259Dual`, `PIT8254`, `CMOSRTC`, `PS2Controller8042`, `DMA8237`, `FDC82077AA`, `PCIBus`, `VGADisplay` | Unified virtual clock (`cpu.cycles` at configurable `cpuFreqHz`, default `100 MHz`), physical address routing (RAM, A20 gate, VGA window `0xA0000..0xBFFFF`, BIOS ROM `0xE0000..0xFFFFF`, VBE LFB at `0xE0000000`), I/O port bus, hardware devices, and high-level BIOS interrupt handlers |
| **i586 CPU Core, MMU & Block Cache** | `X86CPU` | Real mode, 16/32-bit Protected Mode, Virtual-8086 mode, GDT/LDT/IDT/TSS segmentation, 2-level paging (4 KB + 4 MB PSE) with 4-array TLB and dirty-list flush, fault-restartable exceptions, `HLT` deadline skip-ahead, and 64-byte cache-line-invalidated Basic-Block Cache |
| **Browser UI, WebAudio & Debugger** | DOM controller, `PCSpeakerAudio` | Canvas renderer, Deterministic vs. Real-Time scheduler, WebAudio PC Speaker synthesizer (`PIT` Ch2 + port `0x61`), Pointer-Lock PS/2 mouse bridge, DOM `KeyboardEvent.code` to AT Set 1 scancode translator, live register/flag/task debugger, Port `0xE9` + dynamic Kernel Debug Console, and standalone Cartridge exporter |

## 2. Unified Virtual Clock & Timing Architecture (New in 1.1)

### 2.1 Virtual Cycle Clock (`cpu.cycles`) vs. Instruction Count (`cpu.totalInstructions`)
Hummingbird 1.1 separates retired instructions (`cpu.totalInstructions`) from virtual time (`cpu.cycles`):
- Every retired instruction in both the single-step interpreter and `execBasicBlock` advances `cpu.totalInstructions += 1` and `cpu.cycles += 1` (at a configurable virtual CPU frequency `pc.cpuFreqHz`, defaulting to `100,000,000` Hz / `100 MHz`).
- All timed hardware devices derive their state strictly from `cpu.cycles`:
  - **`PIT8254` (`1.193182 MHz`)**: Converts virtual cycles to PIT oscillator ticks via `Math.floor(cycles * 1193182 / cpuFreqHz)`. Channels 0 and 2 count their OS-programmed 16-bit reload values (`reload === 0 ? 65536 : reload`) across Modes `0..5` (including BCD, counter latch, read-back command `0xC0..0xDF`, and lobyte/hibyte access). Channel 0's output drives `IRQ0` (`INT 08h` in real mode, or the OS-remapped vector in protected mode). Channel 2's gate (`port 0x61 bit 0`) and output (`port 0x61 bit 5`) drive PC speaker tone generation and calibration loops. Port `0x61 bit 4` (DRAM refresh detect) toggles every `18` PIT ticks (`15.085 µs`).
  - **`RDTSC`**: Returns the 64-bit virtual cycle counter `cpu.cycles` in `EDX:EAX`.
  - **`CMOSRTC`**: Advances its calendar clock by `Math.floor(cycles / cpuFreqHz)` seconds from the base epoch (`2025-09-29T23:24:00Z` in Deterministic mode, or `Date.now()` in Real-time mode) and sets Update-Ended Status (`Reg C bit 4`) on each second boundary.
  - **VGA Vertical Retrace (`0x3DA` / `0x3BA`)**: Derives a 60 Hz frame period (`1,666,667` cycles at 100 MHz) with a `700 µs` (`70,000`-cycle) vertical retrace pulse (`bit 3` + `bit 0`) and scanline horizontal retrace (`bit 0`).

### 2.2 `HLT` Deadline Skip-Ahead (`getNextDeadlineCycle`)
When the guest OS executes `HLT` (`0xF4`) with interrupts enabled (`EFLAGS.IF = 1`) and no unmasked PIC interrupt or queued 8042 scancode/mouse byte is immediately ready:
1. `HummingbirdPC.getNextDeadlineCycle(cpu.cycles)` queries `PIT8254.getNextIrq0Cycle(cpu.cycles)` for the exact virtual cycle at which PIT Channel 0 will next reach terminal count / reload boundary.
2. Instead of spinning through millions of idle `HLT` steps, `X86CPU.stepInstruction()` jumps `cpu.cycles` directly to `nextDeadlineCycle` in a single step while incrementing `cpu.totalInstructions` by `1`.
3. This makes real-mode BIOS wait loops (`INT 16h AH=00h/10h` waiting on `INT 08h` during KolibriOS's 2-second boot menu or GRUB's countdown) and protected-mode `HLT` idle loops (`osloop` / `IDLE` thread) both fast and 100% deterministic.

### 2.3 Deterministic Mode vs. Real-Time Mode
- **Deterministic Mode (`pc.deterministic = true`)**: Virtual time advances purely by instruction execution and `HLT` deadline skip-ahead. Two runs of the same image produce bit-identical framebuffers, cycle counts, and CPU states at every instruction count, and `useBlockCache = true` vs. `useBlockCache = false` remain 100% bit-identical.
- **Real-Time Mode (`pc.deterministic = false`)**: The browser frame loop (`requestAnimationFrame`) computes a wall-clock cycle budget `Math.floor((dtMs / 1000) * pc.cpuFreqHz)` per frame and caps execution to that budget, so a 2-second boot menu takes 2 wall-clock seconds and a 30-second GRUB countdown takes 30 wall-clock seconds.

## 3. i586 CPU Core (`X86CPU`)

### 3.1 Execution Modes, 286+ BCD Semantics & Segmentation
- **Real Mode, 16/32-bit Protected Mode & Virtual-8086 Mode**: Full segment descriptor caching, GDT/LDT/IDT/TSS lookup, Ring 0/3 privilege validation, and TSS `ESP0`/`SS0` stack switching.
- **Verified against Real Hardware (`tests/cpu-oracle.js`)**: Passes `140/140` instruction forms (`28,000/28,000` test vectors recorded on real x86 silicon), including 286+ `AAA`/`AAS` semantics (`AX ± 0x106` with `AF`/`CF` and high-byte propagation), `DAA`/`DAS`, `SHLD`/`SHRD`, `BT`/`BTS`/`BTR`/`BTC`, `BSF`/`BSR`, `MUL`/`IMUL`/`DIV`/`IDIV`, and `ADC`/`SBB`.

### 3.2 Paging & 4-Way Permission TLB
- **4 KB & 4 MB (PSE) Pages**: Evaluates `U/S`, `R/W`, and `CR0.WP` permissions across PDE and PTE, sets `A` and `D` bits in physical RAM, and raises fault-restartable `#PF` (Vector 14) with architectural error codes and `CR2`.
- **4-Array Smi-Tagged TLB (`tlbReadSys`, `tlbWriteSys`, `tlbReadUser`, `tlbWriteUser`)**: Direct-maps RAM and VBE Linear Framebuffer (`0xE0000000`) pages with O(1) dirty-list invalidation (`tlbDirtyList`) on `CR3` reloads.

### 3.3 High-Speed Basic-Block Cache (`decodeBasicBlock` / `execBasicBlock`)
- **77 Inlined Micro-Op Cases**: Covers 32-bit and 16-bit (`0x66`) ALU, `MOV`, `MOVZX`/`MOVSX`, `LEA`, `TEST`, `CMP`, `INC`/`DEC`, `PUSH`/`POP`, `SHL`/`SHR`/`SAR`/`ROL`/`ROR`, `SHLD`/`SHRD`, `IMUL`, `XCHG`, `BSSWAP`, `SETcc`, `BT*`, `LOOPcc`, `Jcc` (with intra-block backward loop chaining up to 64 iterations), `JMP`, `CALL`, and `RET`.
- **Same-Realm Lexical Execution (`loadCoreFromHtml`)**: Running the core in Node via same-realm `Function` evaluation (avoiding V8 cross-realm `TypedArray` prototype interceptors) combined with the extended block cache reaches **50.35 MIPS in Headless Chromium** and **49.32 MIPS in Node.js**.

## 4. Storage, Input & Observational Guest Detectors

### 4.1 82077AA Floppy Disk Controller & 8237 DMA Channel 2
In addition to BIOS `INT 13h`, Hummingbird 1.1 emulates the hardware **Intel 82077AA FDC (`0x3F0–0x3F7`)** paired with **Intel 8237A DMA Channel 2 (`0x00–0x0F`, Page `0x81`)** and **PIC `IRQ6` (`INT 0Eh`)**, supporting DMA-driven multi-sector `READ DATA` (`0x06`), `WRITE DATA` (`0x05`), `RECALIBRATE` (`0x07`), `SEEK` (`0x0F`), `SENSE INTERRUPT STATUS` (`0x08`), `SPECIFY` (`0x03`), `READ ID` (`0x0A`), and `CONFIGURE` (`0x13`).

### 4.2 Observational KolibriOS Detectors
All guest inspection helpers (`findKolibriMouseAddr`, `findKolibriMsgBoardAddr`, `getKolibriWindowTitles`, `hasFloppyFile`) are strictly observational (never mutating guest RAM during detection):
- **`findKolibriMsgBoardAddr`**: Dynamically locates KolibriOS's `msg_board_data` ring buffer in physical RAM by scanning for the `"K : Kernel v"` / `"K : "` signature with a valid byte count header, supporting both the studio floppy (`0x4F36A`) and the official nightly (`0x4C86A`).
- **`findKolibriMouseAddr`**: Probes for the `MOUSE_X`/`MOUSE_Y` coordinate pair (`(512, 384)`) adjacent to `Screen_Max_X`/`Screen_Max_Y` (`(1023, 767)`), supporting both `0x4F32A` (studio) and `0x4C82A` (official).
