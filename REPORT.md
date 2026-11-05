# Hummingbird Verification & Benchmark Report (`REPORT.md`)

## 1. Executive Summary & Milestones Reached

All **7 required Tier 3 milestones** were reached booting the official KolibriOS nightly floppy image (`kolibri-0.7.7.0+8930.img`, 29 Sep 2025, commit `d50642ce`) deterministically from `index.html`:

| Milestone | Status | Instruction Count | Headless Wall Time (Node) | Details & Snapshot |
| :--- | :--- | ---: | ---: | :--- |
| **1. Boot sector runs** | **Reached** | `17` | `0.10 s` | BIOS loads FAT12 boot sector to `0000:7C00` and begins execution (`snapshots/milestone-1-boot-sector.png`) |
| **2. Boot menu shows** | **Reached** | `248,911` | `0.40 s` | `KERNEL.MNT` real-mode setup displays the blue VESA 3.0 / APM 1.2 boot menu (`snapshots/milestone-2-boot-menu.png`) |
| **3. Kernel enters protected mode with paging** | **Reached** | `29,133,913` | `3.11 s` | Kernel unpacks LZMA payload at `0x280000`, builds page tables (`CR3=0x8F000`), and enables paging (`CR0=0x80050011`, `snapshots/milestone-3-protected-mode.png`) |
| **4. Desktop draws** | **Reached** | `289,898,496` | `20.83 s` | `1024×768×32` VBE LFB desktop rendered with planet wallpaper, 36 desktop icons (`@ICON`), taskbar (`@TASKBAR`), `23:24` clock, and mouse cursor (`snapshots/milestone-4-desktop.png`) |
| **5. Mouse moves the pointer** | **Reached** | `290,013,184` | `20.96 s` | PS/2 IntelliMouse packets delivered over `IRQ12` (`PS2MOUSE.SYS`) move cursor from `(512, 384)` to target coordinates (`snapshots/milestone-5-mouse-moved.png`) |
| **6. Apps open and work** | **Reached** | `297,861,120` (first app) / `486,780,000` (all 4) | `21.64 s` / `32.10 s` | `SHELL 0.8.4` runs `ver`, `TINYPAD 4.1` types `"hummingbird"`, `CALC+` (`CALCPLUS`) computes `6*7 = 42`, and `TETRIS 1.62` plays (`snapshots/milestone-6-apps-running.png`) |
| **7. Restart or shutdown from menu** | **Reached** | `535,790,505` | `36.99 s` | Clicking `Menu -> Shut down` opens `end` (`snapshots/milestone-7-shutdown-menu.png`); selecting `Power off (End)` or `Reboot (Enter)` cleanly executes `boot/shutdown.inc` real-mode transition and APM 1.2 power-off (`INT 15h AX=5307h CX=0003h`) or warm reset |

## 2. Speed & Basic-Block Cache Benchmark

We first built a clean, exact instruction-by-instruction interpreter, and then added a **64-byte cache-line-invalidated Basic-Block Cache** (`decodeBasicBlock` / `execBasicBlock`) for 32-bit flat mode. Both modes execute the exact same 290,000,000 instructions to reach the KolibriOS desktop and produce the **exact same SHA-256 framebuffer hash** (`551d7986891d207090e6c75c...`) and CPU register state:

| Execution Engine | Instructions to Desktop | Wall-Clock Boot Time (Node v18) | Sustained Speed (Node) | Sustained Speed (Browser V8) | Block Cache Coverage |
| :--- | ---: | ---: | ---: | ---: | :--- |
| **Pure Interpreter (`useBlockCache = false`)** | `289,898,496` | `31.84 s` | `9.11 MIPS` | `11.5 – 14.0 MIPS` | `0%` (`0` blocks) |
| **With Basic-Block Cache (`useBlockCache = true`)** | `289,898,496` | `19.40 s` | **`14.94 MIPS` (1.64× speedup)** | **`18.0 – 22.5 MIPS`** | **`86.7%`** (`251.3M` of `290.0M` insts from `13,893` decoded blocks) |

## 3. `#UD` Exceptions & Unhandled Ports Log

### 3.1 `#UD` (Invalid Opcode, Vector 6) Exceptions Seen
- **Total `#UD` exceptions during boot, desktop rendering, app execution (`SHELL`, `TINYPAD`, `CALC+`, `TETRIS`), and shutdown**: **`0` (Zero)**.
- Because `CPUID` honestly reports a Pentium-class i586 CPU (`Family 5, Model 2`) with `MMX=0`, `SSE=0`, `FXSR=0`, `CMOV=0`, and `SEP=0`, KolibriOS and its user-space libraries (`box_lib.obj`, `libimg.obj`, `archiver.obj`, `cnv_png.obj`, `console.obj`) use pure i586 integer and x87 FPU instructions throughout.

### 3.2 Unhandled I/O Ports Seen
During the entire 535.8M-instruction boot and application run, **only 32 port/direction pairs** were logged as unhandled—all originating from a single driver probe (`/SYS/DRIVERS/SB16.SYS`, invoked when `@VOLUME` starts `SOUND.SYS`):

| Port Range | Access Pattern | Origin | Explanation |
| :--- | :--- | :--- | :--- |
| **`0x0216`, `0x0226`, `0x0236`, `0x0246`, `0x0256`, `0x0266`, `0x0276`, `0x0286`** | `OUT` (2× each), `IN` (40× each) | `SB16.SYS` | Sound Blaster 16 DSP Reset port (`base + 0x06`) across candidate ISA bases `0x210..0x280` |
| **`0x021A`, `0x022A`, `0x023A`, `0x024A`, `0x025A`, `0x026A`, `0x027A`, `0x028A`** | `IN` (100× each) | `SB16.SYS` | Sound Blaster 16 DSP Read Data port (`base + 0x0A`) waiting for `0xAA` ready signature |
| **`0x021E`, `0x022E`, `0x023E`, `0x024E`, `0x025E`, `0x026E`, `0x027E`, `0x028E`** | `IN` (100× each) | `SB16.SYS` | Sound Blaster 16 DSP Read Buffer Status port (`base + 0x0E`) |

Returning `0xFF` on those ports causes `SB16.SYS` to conclude no ISA Sound Blaster is installed and exit cleanly.

## 4. What Is Implemented vs. What Is Not

### 4.1 Implemented
- **Full i586 Integer ISA**: All standard ALU, bit (`BT`/`BTS`/`BTR`/`BTC` with arbitrary memory bit offsets, `BSF`/`BSR`), shift/rotate (`SHL`/`SHR`/`SAR`/`ROL`/`ROR`/`RCL`/`RCR`/`SHLD`/`SHRD`), multiply/divide (`MUL`/`IMUL`/`DIV`/`IDIV`), BCD (`DAA`/`DAS`/`AAA`/`AAS`/`AAM`/`AAD`), string (`MOVS`/`STOS`/`LODS`/`CMPS`/`SCAS`/`INS`/`OUTS` with `REP`/`REPE`/`REPNE`), atomic (`CMPXCHG`, `CMPXCHG8B`, `XADD`), segment (`LDS`/`LES`/`LFS`/`LGS`/`LSS`, `LAR`/`LSL`/`VERR`/`VERW`, `ARPL`), system (`LGDT`/`SGDT`/`LIDT`/`SIDT`/`LLDT`/`SLDT`/`LTR`/`STR`, `LMSW`/`SMSW`, `CLTS`, `INVLPG`, `CPUID`, `RDTSC`, `RDMSR`/`WRMSR`), and control transfer (`CALL`/`RET`/`RETF`/`JMP`/`Jcc`/`LOOPcc`/`ENTER`/`LEAVE`/`INT`/`INTO`/`IRET`) instructions.
- **Full x87 FPU**: 80-bit `tbyte` load/store, 16/32/64-bit integer and 32/64-bit IEEE-754 float load/store, arithmetic, comparisons (`FCOM`/`FUCOM`/`FCOMI`), transcendentals (`FSIN`/`FCOS`/`FSINCOS`/`FPTAN`/`FPATAN`/`F2XM1`/`FYL2X`/`FYL2XP1`/`FSCALE`/`FSQRT`), and lossless 108-byte `FNSAVE`/`FRSTOR` state blocks.
- **Segmentation, Paging & Exceptions**: Real mode, 16/32-bit Protected Mode, Virtual-8086 mode, Ring 0 and Ring 3 privilege checks, TSS `ESP0`/`SS0` stack switching, TSS I/O permission bitmap checks, 4 KB and 4 MB PSE paging, and fault-restartable `#DE`, `#UD`, `#NM`, `#GP`, and `#PF` exceptions.
- **PC Chipset & High-Level BIOS**: Dual 8259A PIC, 8254 PIT, MC146818 CMOS/RTC, 8042 PS/2 keyboard & IntelliMouse controller, PCI Config Mechanism #1, VGA text + VBE 3.0 LFB, and BIOS interrupts `08h`, `09h`, `10h`, `11h`, `12h`, `13h`, `15h`, `16h`, `19h`, `1Ah`.

### 4.2 Not Implemented & Honest List of Shortcuts
1. **High-Level Trap BIOS Instead of x86 ROM Assembly**: Our BIOS is implemented in JavaScript and hooked via 5-byte real-mode stubs (`IRET; STI; HLT; JMP -5`) at `F000:E000..E7F8` rather than executing a 64 KB x86 BIOS ROM binary. This is explicitly permitted by the specification (*"Our own BIOS, high-level (implemented in JS, not x86 code)"*) and avoids any external BIOS blob.
2. **Hardware Task Switching via Task Gates**: While `LTR`/`STR` and TSS Ring 0 stack switching (`ESP0`/`SS0`) and TSS I/O permission bitmaps are fully implemented, `JMP`/`CALL`/`INT` through a TSS Task Gate is not implemented because KolibriOS uses software context switching (`do_change_task` in `core/sched.inc`) with a single shared TSS.
3. **Instruction-Count-Driven PIT & Port `0x61` Calibration**: In deterministic mode, PIT `IRQ0` fires every `1,000` accum steps in real mode (so the 2-second boot menu countdown completes in ~250k instructions rather than 200M instructions of idle `HLT` spinning) and every `1,000,000` instructions in protected mode (modeling a 100 MIPS Pentium at 100 Hz, with `HLT` advancing the accumulator faster when all threads are sleeping in `IDLE`). Port `0x61` bit 4 toggles every 4 instructions so `delay_ms` completes deterministically without wall-clock jitter.
4. **ISR-Gated 8042 Mouse Byte Delivery**: Disassembly of KolibriOS's `/DRIVERS/PS2MOUSE.SYS` revealed that its `IRQ12` handler reads exactly **one byte per `IRQ12`** (`in al, 0x60`) without looping on port `0x64`. Our 8042 controller holds subsequent queued mouse packet bytes while `pic.isInService(12)` is true and refills the output buffer immediately when the Slave/Master PIC receives EOI, whereas polled initialization responses (`0xFA` ACK) refill immediately on `in al, 0x60`.
