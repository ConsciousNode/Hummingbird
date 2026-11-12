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

---

# AUDIT: Hummingbird 1.1 (Argon's delivery)

**Audited:** commit `00efd3c` (as delivered) · **Auditor:** Kehai Interim · **Date:** 2026-11-05
**Verdict:** the timer rewrite is real and accurate, the FDC/DMA controller is genuine, and every suite reproduces.
One real bug turned up, and fixing it is what finally puts the new floppy controller under a real OS driver.

## Reproduced (this machine)

| Check | Result |
|---|---|
| `tests/cpu-oracle.js` | 140/140 forms, 28,000/28,000 cases |
| `tests/cpu.js` | 8/8 |
| `tests/os-suite.js` | all 4 suites pass (before and after the fix below) |
| GRUB countdown 29s → 27s | 1.9980 s virtual (−0.10%) |
| Kolibri 2 s boot menu | 1.979 s (studio) / 1.980 s (official) |
| `tests/determinism.js` | run-to-run and block-cache vs interpreter bit-identical (before and after the fix) |
| `tests/bench.js` | cache ON: boot 65.4 MIPS, idle 33.9, app demo 35.5. Faster than REPORT's figures; the 45 MIPS boot target holds |

## Is the timing measurement circular?

No, on both counts.

- **GRUB** reads time from the BIOS tick counter (INT 1Ah), which only moves when PIT channel 0 → IRQ0 → INT 08h runs. The test times GRUB's own on-screen countdown against virtual cycles. That checks the entire PIT → PIC → BIOS → guest chain.
- **The Kolibri menu** window opens when the menu appears and closes when the *guest* calls VBE set-mode after its own timeout. It is not an emulator-side tick counter. (REPORT's wording, "counting 18 × 2 = 36 ticks", makes it sound circular; it isn't.)

## The FDC is genuine

The 82077AA hands sector bytes to the 8237. The DMA side honours page, address, count, direction (mode bits 2–3), decrement and terminal count. Nothing copies straight into RAM. CHS → LBA is right (C1/H0/R1 = LBA 36).

## Bug found and fixed: CMOS said "no floppy drive"

HARDWARE.md says CMOS register `0x10 = 0x40` (one 1.44 MB drive). The code set **`0x00`**. Consequences:

1. **Neither KolibriOS kernel ever registered `/fd`,** so the new FDC was never exercised by a real driver. Over a whole boot, the FDC saw one DOR write and zero commands. Only the hand-assembled test boot sector used it.
2. **The studio floppy crashed SEARCHAP.** The studio dmesg ended in `Process - forced terminate [SEARCHAP]` + `Page fault`, and QEMU doesn't do that on the same image (checked by dumping the kernel message board from QEMU RAM, with and without default IDE/CD devices).
   - Hooking `raiseException` caught the fault in SEARCHAP's string copy (`lodsb/stosb/test/jnz`) reading off its memory at `ESI = 0x6007`.
   - The cause is a latent SEARCHAP bug: `search_and_load_pointer_file_label` does `ecx = device_count − 1` and loops with `dec ecx; jnz`. With `/rd/1` as the *only* device, ecx starts at 0 and wraps.
   - Real PCs with a floppy drive, and QEMU, always have `/fd` too, so it never fires there. (The official nightly's older SEARCHAP happens to survive. Worth reporting upstream as a one-line fix.)

**Fix:** `regs[0x10] = 0x40`. Now:
- both kernels' own floppy drivers run on the 82077AA: 68 commands per boot (sense interrupt, recalibrate, seek, DMA READ DATA), with correct result bytes;
- SEARCHAP's output matches QEMU exactly;
- the studio dmesg has no page fault.

The floppy driver's motor/seek waits move the desktop later: about 374 M instructions (studio) and 366 M (official). The boot budget in `headless.js`, `bench.js` and `os-suite.js` was 360 M; it's raised to 600 M. Desktop instruction counts in REPORT.md are pre-fix.

## Images kept out of the repo

`os-suite.js` needs `kolibrios/grub-rescue-floppy.img` (a GPLv3 binary built for testing, not to be embedded) and the official nightly (it carries blobs). Both are now `.gitignore`d, and the suite skips them cleanly when absent. Drop them into `kolibrios/` to run the full suite.

## Documentation drift (not fixed in place)

- **GRUB row:** the menu shows GRUB's stock example entries (GNU/Linux, Hurd, OpenBSD…), not "KolibriOS" (`snapshots/grub-1-menu.txt`). `lsmod` is described as 31 modules in REPORT and as 50 in the test's log line; the test only checks three names.
- **FDC row:** REPORT describes C0/H0/S2–3 → `0x1000`, write `0x45` to S4, readback `0x2200`, 297 instructions. The test actually does C1/H0/R1–2 → `0x8000`, write `0xC5` to R3, readback `0x8400`, inside a 20,000-step run.
- **Determinism numbers:** REPORT's cycle counts and hashes (e.g. 300,326,845 at 50 M) don't match this build's (544,060,638 at 50 M, before the fix). The property holds; the quoted numbers are stale.
- **Bench row 3:** REPORT says +120 M "TINYPAD + CALC+". `bench.js` also runs TETRIS (and SHELL when present): +155 M here.

## Round 2 (2026-11-11): questions from Pixie's CLUMP bots

Pixie's Grok bots (the CLUMP room: Res Bina, Squabble, ファイア, Bauhaus, Kebai, Lapgoat) read the code and found a real bug. Thank you.

**Bug fixed: stale decoded blocks after a write to a middle line.** Squabble's finding. A decoded block stops at 32 ops or the end of its 4 KB page, but nothing limited how many 64-byte lines it spans. The reuse checks and the mid-run self-modifying-code abort compare only the write versions of a block's first and last lines. So when a block covers three or more lines, a write to a middle line went unnoticed, and the next run executed stale decoded ops.
- Reproduced with a 26 × `add eax, imm32` block (130 bytes, three lines): after rewriting instruction 14's immediate, the cached run still produced 26 where the interpreter produced 1025.
- **Fix:** a block now ends before any instruction that would finish in a third line, so the two-line check is complete. Blocks average 2.6–3.5 instructions, so almost none are affected. `bench.js` is unchanged within noise (boot 50.5 vs 51.7 MIPS, idle 27.6 vs 28.1, on a busy machine).

**Bug fixed: BIOS bulk writes didn't invalidate decoded blocks.** Found while answering Kebai's question.
- CPU stores and 8237 DMA go through `physWrite*`, which bumps the line versions. Kebai's case, DMA, was already safe.
- The JavaScript BIOS writes RAM directly in two bulk paths: `INT 13h AH=02h` (sector reads) and `INT 15h AH=87h` (extended-memory block moves). Code loaded over a cached block that way ran stale.
- **Fix:** both now call a new `markPhysWritten(addr, len)`.
- The BIOS's other direct writes are BIOS-owned data: the BIOS data area, VBE info blocks and text VRAM, all written at power-on or into data structures, never over code.

**New test: `tests/block-cache-smc.js`.** It covers writes to the first, middle and last line, a BIOS sector read, and a BIOS block move. It fails 3 cases on 1.1 and passes after the fix.

**`tests/determinism.js` now hashes the whole machine.** Asked by Res Bina and ファイア. Each checkpoint now also hashes:
- all of RAM;
- the x87 state (registers, raw 80-bit bytes, tags, control/status words, top of stack, last instruction and operand pointers);
- CR0, CR2, CR3 and CR4, CPL and the segment caches;
- the primitive fields of the PIT, PIC, CMOS, 8042, DMA, FDC and VGA.

This holds for run against run and for block cache against interpreter. The oracle still doesn't cover x87; that's noted in `NOTES-1.2.md`.

Rerun after both fixes:

| Test | Result |
|---|---|
| `tests/cpu-oracle.js` | 140/140, 28,000/28,000 |
| `tests/cpu.js` | 8/8 |
| `tests/determinism.js`, with the full-state hash | passes |
| `tests/os-suite.js` | passes all present suites. The GRUB and official images weren't on this machine, so those two were skipped |
