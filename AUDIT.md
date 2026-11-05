# AUDIT: Hummingbird 1.0 (Argon's delivery)

**Audited:** commit `c0e823e` (as delivered) · **Auditor:** Kehai Interim · **Date:** 2026-11-04
**Verdict:** it's real. Hummingbird is a from-scratch i586 PC that boots KolibriOS to the same desktop QEMU draws,
runs its apps, shuts down cleanly, and boots a second, unrelated system (GRUB 2). I found four problems, all
fixed in this commit, and four limits that are documented below.

## What I checked, and what came out

| check | result |
|---|---|
| **CPU against a real x86** (new `tests/cpu-oracle.js`): 140 instruction forms × 200 inputs recorded on real hardware, replayed in Hummingbird | **138/140 forms** matched on every case as delivered. AAA and AAS were wrong (fixed below). Now **140/140 forms, 28,000/28,000 cases** |
| Argon's `tests/cpu.js` | 8/8 pass. The suite is thin, though: each "group" checks a few instructions, and several titles name instructions it never runs. The oracle test covers that ground |
| Boot the official nightly (`node tests/headless.js`) | 7/7 milestones, 0 `#UD`; desktop at 290M instructions, 9.5 s, ~31 MIPS on this machine |
| Boot **our blob-free floppy** (`kolibrios/`) | Desktop and apps work. As delivered, the scripted demo couldn't move the mouse on it (see bug 4). After the fix: 7/7 |
| Desktop vs QEMU (same floppy, 1024×768) | official image: **122 px** differ; our floppy: **54 px** differ; both only inside the taskbar clock |
| Apps (screenshots) | TINYPAD takes typed text, CALC+ computes 6*7 = 42, TETRIS plays, SHELL opens (official image), and the shutdown dialog powers off through APM |
| Determinism (`tests/determinism.js`) | pass: identical framebuffer and registers at 5 checkpoints up to 290M |
| Block cache vs interpreter | identical framebuffer, registers and EIP at 290M; 1.47× faster (9.2 s vs 13.5 s) |
| Are the MIPS figures inflated by HLT? | no: halted steps are 0.0% of the 290M (37,231) |
| Browsers (Playwright, our floppy) | **Chromium:** desktop in 14 s, peak 33.6 MIPS. **Firefox:** desktop in 41 s, peak 12.4 MIPS. No page errors; GPL notice shown |
| Make Cartridge | 2.3 MB single HTML; boots on its own in both browsers |
| No OS image in the HTML | confirmed |
| **Second OS: GRUB 2.12 rescue floppy** | boots to its menu with 0 `#UD` and 0 unhandled ports. As delivered, the keyboard was dead (bug 3). After the fix, GRUB's command line runs `ls` (finds `(fd0)` and `(fd0,msdos1)`) and `echo hummingbird` |
| Copied emulator code | none found: no v86/Bochs/QEMU/DOSBox/PCem names, structures or comments. The design (JS high-level BIOS behind trap stubs, a 4-array TLB, 64-byte-line SMC invalidation) doesn't resemble any of them. The only external data is the VGA font (see 6) |

## Bugs found and fixed

1. **AAA / AAS used 8086 semantics.** They adjusted AL and AH separately (AL+6, AH+1). The 80286 and later,
   Pentium included, add or subtract 0x106 on the whole of AX, so a carry out of AL ripples into AH. This only
   shows when AL ≥ 0xFA, so it took the hardware oracle to catch it.
2. **The BIOS keyboard interrupt threw keys away.** `INT 09h` read the scancode from the 8042 and discarded it.
   Keys reached the BIOS buffer through a side door in `sendKeyScancode`, and only if the CPU was in real mode
   at the moment the key was *sent*, with no ASCII attached. KolibriOS has its own PS/2 driver, so it never
   noticed. Anything that reads the keyboard through `INT 16h` from protected mode (GRUB, and most bootloaders)
   got nothing.
   **Fix:** `INT 09h` now translates set-1 scancodes into BIOS key words, keeping Shift/Ctrl/Alt/Caps state in the
   BDA at `0040:0017`. `INT 16h` first services any keyboard bytes waiting in the 8042, as a real BIOS does by
   running `INT 16h` with interrupts enabled. The side door is gone.
3. **Test scripts pointed at Argon's sandbox.** `headless.js` and `determinism.js` looked for the image under
   `user_uploaded_files/ttl=63d/…`, and `headless.js` wrote a second copy of every snapshot to
   `artifacts/file_generation/ttl=63d/output`. Both now default to `kolibrios/kolibri-hummingbird.img`. Snapshots
   go to `snapshots/` (or `--out=dir`).
4. **The headless mouse helper only worked on one kernel build.** `moveMouseTo` steered by reading KolibriOS's
   pointer variable at `0x4C82A`, which is where the official nightly's kernel keeps it. The studio's floppy is a
   newer kernel (`62b2b72`) that keeps it at `0x4F32A`, so the helper steered blind and the mouse milestone
   checked the wrong address. **Fix:** it now finds the variable: the pointer starts at screen centre, so it looks
   for (512, 384), nudges the mouse, and keeps the candidate that moved. The emulated mouse itself was always
   fine. This only affected the headless helper and the milestone detector.

## Known limits (documented, not fixed)

5. **The PIT ignores what the OS programs it to.** IRQ0 fires on a fixed schedule by CPU mode: every 1,000
   steps in real mode and every 1,000,000 in protected mode, with a halted step counting 250 or 10,000 steps.
   That reproduces KolibriOS's 100 Hz exactly (the RTC already assumes a 100 MIPS virtual clock). An OS that
   programs a different rate (DOS's 18.2 Hz, Linux's HZ, GRUB's timeout) gets the wrong time. GRUB's 30-second
   countdown ran at the mode-based rate, not 18.2 Hz. The principled fix: a 100 MIPS virtual clock, the PIT
   counting its programmed reload value (≈83.8 instructions per PIT tick), and HLT skipping ahead to the next
   timer deadline. KolibriOS would behave the same in protected mode (its 100 Hz reload works out to about 1M
   instructions), but every instruction-count reference would move. That's a good Hummingbird 1.1 job.
6. **Font provenance.** The built-in 8×16 font is drawn after the IBM VGA ROM font (code page 437). 47 of its
   140 glyphs are bit-identical to that font as Linux distributes it. US copyright doesn't cover typeface
   designs (37 CFR 202.1(e)), and this font is copied very widely, but it's now labelled in the code.
7. **The milestone detectors are KolibriOS-specific by design:**
   - boot-menu text on row 2;
   - the process table at `0x90000`;
   - the kernel message board at `0x4C86A`;
   - the mouse variable, now found rather than assumed.

   They only *observe*; nothing changes how the emulator runs, and there are no OS-specific execution hacks.
   But the "Kernel debug console" mirror only works on the official build's message-board address, so it stays
   empty on the studio floppy. "Apps open and work" fires when any target app's process exists; the screenshots
   are the real evidence.
8. **The scripted app demo is timing- and layout-specific.** On the studio floppy, SHELL doesn't open, because
   that floppy has no SHELL (see `kolibrios/README.md`). Its other clicks land.

## Reproduce

```sh
node tests/cpu.js                 # Argon's instruction tests
node tests/cpu-oracle.js          # 28,000 cases vs a real x86 (data: tests/cpu-oracle.txt)
node tests/determinism.js         # two boots, identical hashes
node tests/headless.js            # boot the studio floppy, 7 milestones, snapshots/
node tests/headless.js path/to/kolibri-0.7.7.0+8930.img --out=/tmp/official   # the official nightly
```
Regenerate the oracle on an x86 machine with `gcc-multilib`: see the header of `tests/cpu-oracle.js`.
