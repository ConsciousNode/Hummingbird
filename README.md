# Hummingbird

**A PC in a browser tab that boots a real operating system.** Hummingbird is a single-file, zero-dependency
Pentium-class (i586 + x87) PC emulator, written from scratch. It boots [KolibriOS](https://kolibrios.org) from a
floppy image to its full desktop, runs its apps, and shuts down through APM. It also boots GRUB 2. Open
`index.html`, choose a floppy image, and it runs: offline, nothing to install.

| folder / file | what | licence |
|---|---|---|
| `index.html` | **The PC:** CPU (real, protected and V86 modes, paging, x87), PIC, PIT, RTC, 8042 keyboard/mouse, PCI, VGA + VBE, a BIOS written in JS, a debugger, and a "Make cartridge" button that bundles the loaded image into one HTML file. Built by Argon, audited by Kehai | MIT |
| `kolibrios/` | **The guest OS:** a KolibriOS floppy we build ourselves from source, with every prebuilt binary removed. Reproducible to the byte, with full GPL source. See [`kolibrios/README.md`](kolibrios/README.md), including what's still missing | GPL v2 |
| `tests/` | `cpu.js` (instruction tests), `cpu-oracle.js` (28,000 cases checked against a real x86), `determinism.js`, `headless.js` (boot in Node, milestones, PNG snapshots) | MIT |
| `snapshots/` | the seven boot milestones, from `node tests/headless.js` on the studio floppy | |
| `ARCHITECTURE.md`, `HARDWARE.md`, `REPORT.md` | Argon's design notes, hardware list and report | |
| [`AUDIT.md`](AUDIT.md) | Kehai's audit: what reproduces, what was fixed, what's still a shortcut | |

```sh
node tests/cpu-oracle.js    # 140/140 instruction forms match real hardware
node tests/determinism.js   # two boots, bit-identical
node tests/headless.js      # boot the studio floppy to the desktop and through the apps
```

Speed on this test machine: about 31 MIPS in Node and 33.6 MIPS peak in Chromium (desktop in about 10–14 s);
12.4 MIPS in Firefox.

The emulator is ours under MIT (`LICENSE`). KolibriOS is its own project under GPLv2; `kolibrios/` keeps that
licence and ships the image with its complete corresponding source.

ConsciousNode SoftWorks, 2026.
