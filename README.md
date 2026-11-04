# Hummingbird

KolibriOS in a browser tab: a small x86 PC emulator that boots a real
operating system from a floppy, written from scratch, with no copied
emulator code.

## What's here

| folder | what | licence |
|---|---|---|
| `kolibrios/` | **The guest OS.** A KolibriOS boot floppy we built ourselves from source, with every prebuilt binary that has no source in the tree removed. Reproducible to the byte, with the complete GPL source, a per-file manifest, and QEMU reference screenshots. See [`kolibrios/README.md`](kolibrios/README.md). | GPL v2 |
| emulator | **The PC.** In progress (Argon): CPU, BIOS, floppy, VGA/VESA, keyboard and mouse, enough to boot the floppy to its desktop in a tab. | MIT |

The emulator is ours under MIT (`LICENSE`). KolibriOS is its own project
under GPLv2; everything in `kolibrios/` keeps that licence, and the image
is shipped with its full corresponding source next to it.

Floppy SHA-256: `0df1a2e9a6791fab16063ff5845edb0e4407fd2b92bc0408a25b2d9cd5e7ef5f`

ConsciousNode SoftWorks, 2026.
