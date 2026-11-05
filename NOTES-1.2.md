# Notes toward Hummingbird 1.2

*Kehai Interim, 2026-11-05, written right after the 1.1 audit so nothing gets lost. Working notes, not a spec.*

## Where 1.1 stands

Real guests: **two KolibriOS floppies** (the studio's blob-free build and the official nightly), **GRUB 2.12**, and, as of tonight, **MS-DOS 4.0**. Plus a hand-written FDC/DMA boot sector. Details are in `AUDIT.md`.

### MS-DOS 4.0 smoke test (2026-11-05)

- **Image:** a community-built 1.44 MB boot floppy (the `tgies/MS-DOS` fork's release, built from Microsoft's MIT-licensed source). Testing only: it's not ours and it's **not committed**.
- **Results:**
  - boots to `A:\>` in about 1.2 s of virtual time, with zero emulator changes;
  - `ver` prints `MS-DOS Version 4.00`, and `dir` works;
  - `mem` sees 640 KB conventional and 15,728,640 bytes of extended memory (exactly right for a 16 MB machine);
  - `chkdsk` walks the full FAT12 volume;
  - 0 `#UD`.
- **Stack bug:** DOS 4.0's known IO.SYS stack bug, which stops it on QEMU, VMware and real PS/2s, did not trigger here.

## Small fixes (found by the DOS test)

1. **Seed the BIOS tick counter from the RTC at power-on.** DOS took the correct date (from INT 1Ah AH=04) but showed the time as 12:00:01 a.m. A real BIOS POST sets `0040:006C` from the CMOS time. In deterministic mode, use the deterministic epoch.
2. **Identify the writes to ports `0x2F2–0x2F7`.** DOS 4.0 makes one OUT to each during boot. It's the first guest to break the "0 unhandled ports" streak. Find what it's probing (it sits next to COM2 at `0x2F8`) and answer the way absent hardware really answers, rather than adding it to an ignore list.

## Bigger steps, in order

1. **IDE/ATA hard disk** (primary channel `0x1F0–0x1F7`, `0x3F6`, IRQ14), plus INT 13h for `DL ≥ 0x80` and EDD. This unlocks FreeDOS on a hard disk image, Freedoom (*we have Doom at home*: Freedoom only, never id's WAD), and properly installed DOS software.
2. **A sound card.** Either an AdLib/OPL2 FM synth in WebAudio (small and very Xinu; the classic DOS-game music chip), or a Sound Blaster 16 (bigger: DSP plus DMA channels 1/5, IRQ 5/7). The AdLib is the better first step.
3. **ATAPI CD-ROM** on the secondary channel, then ISO 9660 boot (El Torito). Needed for ReactOS and most later OSes.
4. **ReactOS.** The big boss: it needs IDE/CD and probably some ACPI-ish or MP-table fidelity, or a clean "Standard PC" path.

## Our own MS-DOS floppy (after the Tuesday usage reset)

Same rules as `kolibrios/`: built from source, reproducible, with full source alongside.

- **Source:** Microsoft's `MS-DOS/v4.0` (MIT).
- **Toolchain:** Microsoft's own 16-bit build tools ship in the same repo under the same licence. They're prebuilt DOS binaries, so they need a DOS environment to run (DOSBox, or, fittingly, Hummingbird itself once it has a hard disk). Kham OK'd going this way on 2026-11-05.
- **Patch:** apply the known one-line IO.SYS initial-stack fix in `msload.asm`.
- **Extras:** add a GPL mouse driver (CuteMouse) so DOS programs get the PS/2 mouse.
- **Test:** becomes **suite 5** in `tests/os-suite.js`, with the checks from the smoke test (boot, `ver`, `dir`, `mem` exact numbers, `chkdsk`, 0 #UD, 0 unhandled ports).

Sits alongside the parked floppy-compiler job (TCC → GCC → C--/Oberon for the Kolibri floppy's SHELL and friends).

## Upstream

- **KolibriOS SEARCHAP:** in `search_and_load_pointer_file_label`, `ecx = device_count − 1` followed by a `dec ecx; jnz` loop wraps when `/rd/1` is the only device, and the program walks off the end of its memory. One-line fix: test for zero before the loop. Found by Hummingbird (see `AUDIT.md`); worth reporting.

## Doc cleanups still owed

`REPORT.md` rows called out in `AUDIT.md`: the GRUB menu contents, the FDC test description, stale determinism numbers, and the bench app-demo description. Also refresh the desktop instruction counts (now about 374 M studio / 366 M official, with the floppy driver active).

## Prior art, for perspective

v86 (copy.sh) is the mature browser x86: an x86→WASM JIT, Pentium 4/SSE3, IDE/CD, NE2000, SB16, VirtIO, and it boots Windows 95–2000, ReactOS, Linux and more. Hummingbird isn't trying to out-v86 v86. Its niche is a single-file, blob-free, deterministic, oracle-verified PC that's small enough to audit and teach from.
