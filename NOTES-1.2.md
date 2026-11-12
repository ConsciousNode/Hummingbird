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
2. **The writes to ports `0x2F2–0x2F7`: identified (2026-11-11).** Lapgoat asked whether this was a COM2 probe or an emulator decode bug. It's neither. In `SYSINIT1.ASM` (MS-DOS 4.0, the "J.K. 9/29/86" block), IO.SYS's relocated SYSINIT issues a **global rearm for IBM shared-interrupt adapters** after loading each device driver: `mov al,0FFh / mov dx,2F2h / out dx,al / (inc dx / out dx,al) ×5`. Each port rearms one interrupt level, 2 to 7. It's write-only and any value works, so absent hardware simply ignores it. The trace matches the source byte for byte: six OUTs of `FF`, CS base `0x9BD20`, IP `0x1326`–`0x1330`, and no reads anywhere near COM2.
   - **Hummingbird is under-reporting here.** The same code then checks the BIOS model byte at `F000:FFFE` for `FCh` (AT class) or calls `INT 15h AH=C0h` (get system configuration). If a second 8259 is present, it also rearms levels 10–15 at `0x6F2–0x6F7`. Our model byte reads `00` and `C0h` isn't implemented, so DOS takes the "old ROM" path. A real Pentium BIOS would make DOS write `0x6F2`–`0x6F7` too.
   - **Fix:** set the model byte to `FCh` and implement `INT 15h AH=C0h` with a configuration table (feature byte 1 = second 8259 + RTC, `0x60`). Treat writes to `0x2F2–0x2F7` and `0x6F2–0x6F7` as the no-ops they are on a machine without shared-interrupt adapters. Rerun GRUB and both KolibriOS floppies afterwards, since the BIOS identity changes.

## Speed: a TLB per address space (Res Bina's idea, measured 2026-11-11)

The idle desktop runs at about half boot's MIPS. Measured on the studio floppy:
- 39.8 page walks per 1,000 instructions on the idle desktop, against 5.85 during boot (6.8× more);
- 1,156 walks per CR3 switch;
- only **2 distinct CR3 values** in 50 M idle instructions.

So almost every walk refills a TLB that was just thrown away. Proposal: on a CR3 switch, save the filled entries (the dirty list already records them) under the old CR3, and restore them when that CR3 comes back. Copying about 1k entries is far cheaper than 1k page walks.

The guest must never be able to tell. Invariants:
- **Page-table edits.** A write to any page-table or page-directory page used by a cached snapshot must invalidate it. OSes edit an inactive address space's PTEs without `INVLPG` and rely on the CR3 load to flush, which is architecturally guaranteed on the i586. Track it with a per-page "walked as a page table" flag and a generation counter, excluding the emulator's own A/D-bit updates.
- **Dirty bit.** Only cache write-enabled entries whose D bit is already set, as the TLB does now.
- **Global invalidation.** CR0.PG, CR0.WP or CR4.PSE changes drop every snapshot.
- **Reused CR3 values.** A freed page directory reused for a new process is covered by the page-table write tracking.
- **Proof.** `determinism.js`, now hashing full state, must stay bit-identical with this on and off.

## x87 coverage

The CPU oracle covers integer forms only. Add x87 forms (arithmetic, compare/`FSTSW`, `FIST`/`FLD` conversions, transcendentals with SDM tolerances, `FSAVE`/`FRSTOR` round trips), recorded on real hardware the same way. Exceptions and precision/rounding-control combinations too. Asked by ファイア and Res Bina.

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
