# Hummingbird 1.3: the StudioNet card

**Date:** 2026-11-16 · **By:** Kehai Interim · **Why:** Kham ran SpiralOS in Hummingbird and got "no network".
SpiralOS was right: only SpiralOS's own patched copy of Hummingbird had a network card. Hummingbird proper never did.

## What changed

- **The StudioNet NIC.** Lifted verbatim from `ConsciousNode/SpiralOS` `hummingbird.html` lines 3729–4058
  (SpiralOS 1.5, commit f9d17f2), including the in-memory switch and the Sonder gateway node 0x00FE.
  The block in `index.html` is byte-identical to the source (sha256 of the block `b1989b32402b640e…`).
  - Ports 0x2A0–0x2AF, IRQ 10, PIO and bus-master DMA. Register map: SpiralOS `STUDIONET.md`.
  - Default node ID 0x0201. Change it with the Node ID box (bottom right) or `?node=0x0305` in the URL.
  - Between browser tabs of the same site it talks over `BroadcastChannel("studionet-v1")`, so a Hummingbird tab,
    a TabComp tab and CyberNetServerWeb on `consciousnode.github.io` can reach each other.
- **Wiring**, each line labelled `[Hummingbird 1.3]`: constructed with the other devices, reset with them
  (power-on and the reboot path), and the 16 ports added to `portRead`/`portWrite`.
  The SpiralOS copy gates the ports on its `strictBios` mode; Hummingbird has no such mode, so there's no gate.
- **Not lifted:** everything else that differs in SpiralOS's copy (its 1.2 realism switches, SpiralOS-specific
  milestones, its older CMOS floppy byte). Hummingbird proper keeps its own versions.

## Verified

| check | result |
|---|---|
| `tests/cpu.js` | 8/8 |
| `tests/cpu-oracle.js` | 28,000/28,000 |
| `tests/determinism.js` | pass; **same four state hashes as 1.2** |
| `tests/headless.js` (KolibriOS studio floppy) | 7/7 milestones at **the same instruction counts as 1.2**; snapshots byte-identical to a 1.2 run made the same day |
| `tests/block-cache-smc.js` | pass |
| `tests/os-suite.js` | all present suites pass, `unhandledPorts=0` |
| `tests/studionet.js` (new) | 13/13: probe, node IDs, PIO broadcast, unicast filtering, DMA RAM→RAM, IRQ 10 only when enabled, reset. **Control:** the same test on 1.2 fails at check 1 (`in ax,0x2A0 = 0xffff`) |
| SpiralOS's own `net.js`, `sonder.js`, `apps.js`, `spiralos-15.js`, run with this `index.html` swapped in | all pass (file transfer, SpiralWeb, Sonder gateway, multiplayer Snake) |
| `tests/browser-studionet.py`: two real Chromium tabs | both pages load with 0 console errors; a frame sent from tab A arrives byte-for-byte in tab B |

So KolibriOS can't tell the card is there: it never touches 0x2A0, and its boot is bit-identical.

## Known gaps

- SpiralOS's `tests/boot.js` fails on Hummingbird proper, **with or without this change**: its `desktop_drawn`
  milestone detector lives only in SpiralOS's copy. Not a networking issue; SpiralOS boots fine (its `net.js` boots it).
- The card has no snapshot/restore state (Hummingbird has no state snapshots yet).
- The DMA address isn't bounds-checked against guest RAM size (same as the source).
- Not yet done by hand: Kham's live run of SpiralOS-in-Hummingbird ↔ CyberNetServerWeb.
