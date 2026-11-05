# Hummingbird 1.1 Verification, Multi-OS & Benchmark Report (`REPORT.md`)

## 1. Timing Model (New in Hummingbird 1.1)

Hummingbird 1.0 used a mode-dependent instruction counter for `IRQ0` (`1,000` steps in real mode, `1,000,000` in protected mode). In **Hummingbird 1.1**, all timing is unified under a single virtual cycle clock (`cpu.cycles`) running at a configurable CPU frequency (`pc.cpuFreqHz`, default **`100 MHz`**):

1. **Retired Instructions vs. Virtual Cycles**: Every retired instruction increments `cpu.totalInstructions` by `1` and `cpu.cycles` by `1`.
2. **8254 PIT at `1.193182 MHz`**: `PIT8254` converts `cpu.cycles` into elapsed `1.193182 MHz` oscillator ticks (`Math.floor(cycles * 1193182 / cpuFreqHz)`). Channels 0 and 2 count their OS-programmed 16-bit reload values (`0` = `65,536`) across Modes `0..5`:
   - In real mode (`reload = 65536`), Channel 0 fires `IRQ0` (`INT 08h`) every `5,492,541` virtual cycles (`54.925 ms` = **`18.2065 Hz`**).
   - When KolibriOS's protected-mode kernel (`init_irqs`) reprograms Channel 0 to `reload = 11932` (`0x2E9C`), Channel 0 automatically switches to firing `IRQ0` (`INT 20h`) every `1,000,015` virtual cycles (`10.000 ms` = **`100.00 Hz`**).
   - Port `0x61` exposes Channel 2's gate (`bit 0`), speaker enable (`bit 1`), DRAM refresh toggle (`bit 4`, toggling every `18` PIT ticks = `15.085 µs`), and Channel 2 output (`bit 5`).
3. **`HLT` Deadline Skip-Ahead**: When `HLT` executes with `EFLAGS.IF = 1` and no interrupt or keyboard/mouse input is pending, `cpu.stepInstruction()` jumps `cpu.cycles` directly to `pc.getNextDeadlineCycle(cpu.cycles)` (the exact virtual cycle of the next `PIT` Channel 0 terminal count) while incrementing `cpu.totalInstructions` by `1`.
   - **Why Milestone Instruction Counts Moved**: Because `HLT` in real mode now jumps ~5.49M virtual cycles in **1 instruction** (instead of spinning 4 ticks × 250 steps = 1,000 steps per tick), real-mode idle waits (`INT 16h AH=00h`) execute in far fewer instructions while advancing the exact 2.0 seconds of virtual time. Conversely, during protected-mode boot and desktop rendering, `HLT` advances virtual cycles to the next 10 ms PIT deadline, and `delay_ms` (which polls port `0x61` bit 4 across `15.085 µs` toggles) executes the true number of port polls for a 100 MHz CPU (`~305.9M` instructions to protected mode and `~324.0M` instructions to desktop on the studio floppy).
4. **Everything Reads the Same Clock**: `RDTSC` returns `cpu.cycles`; `CMOSRTC` advances by `1 s` per `100,000,000` virtual cycles (`cpuFreqHz`); BDA `0040:006C` increments via `INT 08h` driven by PIT Channel 0; and VGA vertical/horizontal retrace at `0x3DA`/`0x3BA` runs at `60 Hz` (`1,666,667` virtual cycles per frame).
5. **Measured Countdown Accuracy**:
   - **GRUB 2.12 Rescue Floppy (`kolibrios/grub-rescue-floppy.img`)**: Measuring GRUB's menu countdown from `"The highlighted entry will be executed automatically in 29s."` to `"27s."` (a `2.000 s` interval) took **`199,795,213` virtual cycles = `1.9980 s` (`-0.10%` error, well within the 5% bar)** and `2` RTC seconds.
   - **KolibriOS Studio Floppy (`kolibrios/kolibri-hummingbird.img`)**: The 2-second real-mode boot menu (`boot_menu` hook on `INT 08h` counting `18 × 2 = 36` ticks) took **`197,913,932` virtual cycles = `1.9791 s` (`-1.04%` error)**.
   - **KolibriOS Official Nightly (`kolibrios/kolibri-0.7.7.0+8930.img`)**: The 2-second real-mode boot menu took **`197,953,279` virtual cycles = `1.9795 s` (`-1.02%` error)**.

## 2. Per-OS Verification Table (`tests/os-suite.js`)

All four operating system / bare-metal images in `tests/os-suite.js` boot and pass every assertion with **0 `#UD` exceptions** and **0 unhandled I/O ports**:

| OS / Floppy Image | Boot & Milestones Reached | Instructions Executed | Virtual Time (`cycles / 100M`) | Wall Time (Node) | Verified Capabilities & Text / Graphical Assertions |
| :--- | :--- | ---: | ---: | ---: | :--- |
| **1. GRUB 2.12 Rescue Floppy** (`kolibrios/grub-rescue-floppy.img`) | Menu, Countdown (`-0.10%` error), `grub>` CLI, `ls`, `echo`, `lsmod`, `cat grub.cfg`, `set pager=1` | `151,852,070` | `5.324 s` | `3.82 s` | Text VRAM (`0xB8000`) verified: menu shows `GNU GRUB version 2.12` + `KolibriOS`; countdown `29s -> 27s` in `1.9980s` virtual time; `c` enters `grub>`; `ls` prints `(fd0) (fd0,msdos1)`; `echo hummingbird` prints `hummingbird`; `lsmod` lists 31 loaded modules (`xzio`, `part_msdos`, `fat`, `biosdisk`, etc.); `cat (fd0)/boot/grub/grub.cfg` decompresses & prints full 65-line config; `set pager=1` pauses with `--MORE--` and pages cleanly on Space (`snapshots/grub-1-menu.txt`, `snapshots/grub-2-commands.txt`) |
| **2. KolibriOS Studio Floppy** (`kolibrios/kolibri-hummingbird.img`, commit `62b2b72`) | **7 / 7 Milestones** | `536,686,621` | `192.431 s` | `10.17 s` | M1 (`17` inst), M2 (`250,734` inst, `0.003s`), M3 (`305,890,377` inst, `6.143s`), M4 Desktop (`323,956,419` inst, `13.840s`), M5 Mouse (`324,016,743` inst, pointer probed dynamically at `0x4F32A`), M6 Apps (`TINYPAD` types `"hummingbird"`, `CALC+` computes `42`, `TETRIS` runs; `SHELL` detected absent in FAT12 `/SYSTREE.TXT` and skipped cleanly), M7 Shutdown via APM 1.2 (`536,686,621` inst); dynamic `msg_board_data` probed at `0x4F36A` (`36` kernel debug lines captured in `snapshots/os-kolibri-hummingbird-dmesg.txt`) |
| **3. KolibriOS Official Nightly** (`kolibri-0.7.7.0+8930.img`, commit `d50642ce`) | **7 / 7 Milestones** | `571,456,255` | `125.864 s` | `10.50 s` | M1 (`17` inst), M2 (`248,911` inst, `0.002s`), M3 (`304,358,434` inst, `6.127s`), M4 Desktop (`351,692,005` inst, `26.906s`), M5 Mouse (`351,750,829` inst, pointer probed at `0x4C82A`), M6 All 4 Apps (`SHELL 0.8.4` runs `ver`, `TINYPAD 4.1`, `CALC+`, `TETRIS`), M7 Shutdown via APM 1.2 (`571,456,255` inst); dynamic `msg_board_data` probed at `0x4C86A` (`29` kernel debug lines captured in `snapshots/os-kolibri-official-dmesg.txt`) |
| **4. 82077AA FDC + 8237 DMA2 + IRQ6 Test OS** (412-byte boot sector) | Boot, Recalibrate, Seek, Multi-Sector DMA Read, DMA Write + Readback | `297` | `0.000003 s` | `0.01 s` | Programs 8237 DMA Ch2 (`0x04..0x0C`, page `0x81`) and 82077AA FDC (`0x3F2..0x3F5`), handles `IRQ6` (`INT 0Eh`), reads 2 sectors (`1,024 B` from C0/H0/S2..3 to `0x1000`), writes 1 modified sector (`512 B` to C0/H0/S4 via `0x45` `WRITE DATA`), reads it back to `0x2200`, verifies all bytes, and prints `"FDC+DMA2+IRQ6 READ+WRITE OK"` to `0xB8000` (`snapshots/fdc-dma-test.txt`) |

## 3. Speed & Benchmark Results (`tests/bench.js`)

By removing V8 cross-realm `TypedArray` prototype interceptors in `loadCoreFromHtml`, keeping all `BlockOp` and `X86CPU` fields as V8 31-bit Small Integers (`Smi`), and inlining 77 opcode forms with intra-block backward loop chaining in `execBasicBlock`, Hummingbird 1.1 exceeds the **45 MIPS Chromium target**:

| Workload (`kolibri-hummingbird.img`) | Instructions | Block Cache ON (`useBlockCache = true`) | Block Cache OFF (`useBlockCache = false`) | Block Cache Speedup | Headless Chromium 156 (`useBlockCache = true`) |
| :--- | ---: | ---: | ---: | ---: | ---: |
| **1. Boot to Desktop** (`0 -> 325M` inst) | `325,000,000` | **`49.32 MIPS`** (`6.59 s`, `95.2%` block-cached) | `15.10 MIPS` (`21.52 s`) | **`3.27×`** | **`50.35 MIPS` (`6.45 s`)** |
| **2. Idle Desktop** (`+50M` inst on desktop) | `50,000,000` | **`33.42 MIPS`** (`1.50 s`, `70.1%` block-cached) | `16.29 MIPS` (`3.07 s`) | **`2.05×`** | **`36.80 MIPS` (`1.36 s`)** |
| **3. App Demo (`TINYPAD` + `CALC+`)** (`+120M` inst) | `120,000,000` | **`32.28 MIPS`** (`3.72 s`, `69.9%` block-cached) | `15.44 MIPS` (`7.77 s`) | **`2.09×`** | **`35.40 MIPS` (`3.39 s`)** |

## 4. CPU Oracle, Unit Tests & Determinism Verification

- **`tests/cpu-oracle.js` (`28,000` hardware vectors across `140` instruction forms)**: **`140 / 140` passed (`0` failures)**.
- **`tests/cpu.js` (8 architectural unit test suites)**: **`8 / 8` passed** (ALU/BCD flags, shifts/bit ops, string ops, protected mode GDT/CPL/TSS stack switch, 4 KB + 4 MB PSE paging & `#PF` error codes, fault restartability, x87 FPU `fnsave`/`frstor`, and `CPUID`/`RDTSC`/`CMPXCHG8B`).
- **`tests/determinism.js`**:
  1. **Run-to-Run Determinism (`325,000,000` instructions to desktop)**: Run A and Run B produce **100% identical** `cycles`, `fbHash` (`9889186e566202fc...`), and CPU register/CR0/CR3/EFLAGS snapshots at `250,734`, `10,000,000`, `30,589,037`, `100,000,000`, and `325,000,000` instructions.
  2. **Block Cache vs. Interpreter Equivalence (`50,000,000` instructions)**: `useBlockCache = true` and `useBlockCache = false` produce **100% identical** `cycles` (`300,326,845`), `fbHash` (`ab7d68d9b8e2e819...`), and `EAX..EDI`/`EIP`/`EFLAGS`/`CR0`/`CR3`.
- **`#UD` Exceptions & Unhandled Ports**: **`0` `#UD` exceptions** and **`0` unhandled I/O ports** across all OS boots and test suites.
