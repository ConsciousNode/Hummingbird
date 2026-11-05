# Hummingbird

**A PC in a browser tab that boots a real operating system.** Hummingbird is a single-file, zero-dependency
Pentium-class (i586 + x87) PC emulator, written from scratch. It boots [KolibriOS](https://kolibrios.org) from a
floppy image to its full desktop, runs its apps, and shuts down through APM. It also boots GRUB 2. Open
`index.html`, choose a floppy image, and it runs: offline, nothing to install.

**New in 1.1:**
- **Real time.** One virtual clock (100 MHz by default) drives the 8254 timer, the RTC, `RDTSC` and VGA retrace. A guest's 2-second wait takes 2 virtual seconds; GRUB's countdown is within 0.1%.
- **A real floppy controller.** An 82077AA with 8237 DMA and IRQ6, driven by KolibriOS's own floppy driver.
- **More tests.** A multi-OS suite and a benchmark.

| folder / file | what | licence |
|---|---|---|
| `index.html` | **The PC:** CPU (real, protected and V86 modes, paging, x87), PIC, PIT, RTC, 8042 keyboard/mouse, PCI, VGA + VBE, a BIOS written in JS, a debugger, and a "Make cartridge" button that bundles the loaded image into one HTML file. Built by Argon, audited by Kehai | MIT |
| `kolibrios/` | **The guest OS:** a KolibriOS floppy we build ourselves from source, with every prebuilt binary removed. Reproducible to the byte, with full GPL source. See [`kolibrios/README.md`](kolibrios/README.md), including what's still missing | GPL v2 |
| `tests/` | `cpu.js` (instruction tests), `cpu-oracle.js` (28,000 cases checked against a real x86), `determinism.js`, `headless.js` (boot in Node, milestones, PNG snapshots), `os-suite.js` (GRUB, both KolibriOS floppies, a hand-written FDC/DMA boot sector), `bench.js` (MIPS, block cache on/off) | MIT |
| `snapshots/` | the seven boot milestones from `headless.js`, plus the `os-suite.js` screens, text dumps and kernel logs | |
| `ARCHITECTURE.md`, `HARDWARE.md`, `REPORT.md` | Argon's design notes, hardware list and report | |
| [`AUDIT.md`](AUDIT.md) | Kehai's audit: what reproduces, what was fixed, what's still a shortcut | |

```sh
node tests/cpu-oracle.js    # 140/140 instruction forms match real hardware
node tests/determinism.js   # two boots, bit-identical
node tests/headless.js      # boot the studio floppy to the desktop and through the apps
node tests/os-suite.js      # every OS we can boot (see below for the images it wants)
node tests/bench.js         # speed, block cache on vs off
```

`os-suite.js` also runs GRUB and the official KolibriOS nightly if you put their images in `kolibrios/` (`grub-rescue-floppy.img`, `kolibri-0.7.7.0+8930.img`). They aren't in the repo: the GRUB floppy is a GPLv3 test binary, and the official nightly carries prebuilt blobs. Without them, those two suites are skipped.

Speed (Node, block cache on, audit machine): about 65 MIPS booting, 34–36 MIPS on the desktop and in apps.
Argon measured about 50 MIPS in headless Chromium.

The emulator is ours under MIT (`LICENSE`). KolibriOS is its own project under GPLv2; `kolibrios/` keeps that
licence and ships the image with its complete corresponding source.

ConsciousNode SoftWorks, 2026.
