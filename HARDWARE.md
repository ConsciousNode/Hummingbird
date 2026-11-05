# Hummingbird Hardware Specification (`HARDWARE.md`)

This document specifies exactly what hardware, CPU features, I/O ports, and BIOS services are emulated in **Hummingbird** and what is intentionally absent.

## 1. Emulated Hardware Summary

| Component | Emulated Model / Specification | Details |
| :--- | :--- | :--- |
| **CPU** | Intel Pentium (i586), Family 5, Model 2, Stepping 12 (`0x052C`) | Vendor `"GenuineIntel"`, 32-bit integer unit + x87 FPU, `RDTSC`, `MSR`, `CMPXCHG8B`, 4 KB & 4 MB `PSE` paging, `PGE`. **No MMX, no SSE, no CMOV in CPUID, no APIC.** |
| **FPU** | Integrated i587 / x87 FPU | 80-bit extended precision (`ST(0)..ST(7)`), status/control/tag words, `FNSAVE`/`FRSTOR`/`FNSTENV`/`FLDENV`, `CR0.EM`/`CR0.TS` `#NM` (Vector 7) support |
| **RAM** | 64 MB default (configurable 16–256 MB) | Contiguous physical RAM with A20 gate mask (`0xFFEFFFFF` when disabled), VGA text/gfx window (`0xA0000..0xBFFFF`), write-protected BIOS ROM (`0xE0000..0xFFFFF`), and E820 memory map |
| **Video (VGA + VBE)** | Standard VGA Text + VBE 3.0 PCI Adapter (`00:02.0`, Vendor `1234:1111`) | 80×25 16-color text mode (`03h`) with CP437 8×16 font, Mode `12h`/`13h`, and Bochs/VBE 3.0 Linear Framebuffer (16 MB at `0xE0000000`) supporting `1024×768×32` (`0x118`), `800×600×32` (`0x115`), `640×480×32` (`0x112`), and 16-bpp modes (`0x117`, `0x114`, `0x111`) |
| **Interrupt Controller** | Dual 8259A PIC (Master `0x20..0x21`, Slave `0xA0..0xA1`) | ICW1–ICW4 initialization, OCW1–OCW3 (`IRR`/`ISR` reads, specific & non-specific EOI), slave cascade on IRQ2 |
| **System Timer** | Intel 8254 PIT (`0x40..0x43`) + System Control Port B (`0x61`) | 3 counter channels, latch/readback, Mode 2/3 reload, deterministic `IRQ0` generation, and Port `0x61` bit 4 refresh toggle |
| **Real-Time Clock** | Motorola MC146818 CMOS/RTC (`0x70..0x71`) | 128-byte NVRAM, BCD/binary time & date registers (`0x00..0x09`), status registers `A..D`, floppy drive type (`0x10 = 0x40` for 1.44 MB 3.5"), base/extended memory size registers (`0x15..0x18`, `0x30..0x35`) |
| **Keyboard & Mouse** | Intel 8042 PS/2 Controller (`0x60`, `0x64`) | AT Keyboard (Set 1 scancodes on `IRQ1`) + PS/2 Auxiliary Mouse (standard 3-byte and 4-byte IntelliMouse ID `0x03`/`0x04` packets on `IRQ12`, ISR-gated 1-byte-per-IRQ delivery), A20 & CPU reset commands (`0xD1`, `0xFE`) |
| **PCI Bus** | PCI Configuration Mechanism #1 (`0xCF8..0xCFF`) | Bus 0, Dev 0 (`8086:1237` Intel 440FX Host Bridge) and Bus 0, Dev 2 (`1234:1111` VBE VGA Controller with BAR0 `0xE0000008`). All other BDFs return `0xFFFFFFFF` |
| **Power Management** | APM 1.2 BIOS (`INT 15h AH=53h`) | Supports real-mode and 32-bit protected-mode installation check, connect (`5301h..5303h`), driver version `1.2` (`530Eh`), and power-off (`5307h BX=1 CX=3`) |
| **Debug Console** | Port `0xE9` + KolibriOS `msg_board_data` mirror | Captures `OUT 0xE9, AL` and mirrors kernel `DEBUGF` messages from physical `0x4C86A` |

## 2. Emulated BIOS Interrupt Services

| Vector | Functions Implemented | Behavior |
| :--- | :--- | :--- |
| **`INT 08h`** | System Timer ISR (`F000:E040`) | Increments 32-bit BDA tick counter at `0040:006C`, invokes `INT 1Ch`, and sends EOI (`0x20`) to Master PIC |
| **`INT 09h`** | Keyboard ISR (`F000:E048`) | Reads the scancode from port `0x60`, translates set-1 scancodes (Shift/Ctrl/Alt/Caps state in BDA `0040:0017`) into BIOS key words in the BDA buffer, and sends EOI. `INT 16h` first services keyboard bytes waiting in the 8042, as a BIOS running with interrupts enabled would |
| **`INT 10h`** | VGA & VBE 3.0 Video BIOS | `AH=00h` (set mode), `01h` (cursor shape), `02h` (set cursor pos), `03h` (get cursor pos), `06h/07h` (scroll up/down), `08h/09h/0Ah` (read/write char/attr), `0Eh` (teletype output), `0Fh` (get video mode), `11h` (font info), `12h` (EGA info), `13h` (write string), `4F00h` (VBE controller info `"VESA"` v3.0), `4F01h` (VBE mode info with LFB at `0xE0000000`), `4F02h` (set VBE mode), `4F03h` (get VBE mode), `4F05h/06h/07h` (window/scanline/display start) |
| **`INT 11h` / `12h`** | Equipment Word / Base Memory Size | Returns BDA `0x0410` (`0x0023`) and `0x0413` (`639` KB) |
| **`INT 13h`** | Floppy Disk Services (Drive `0x00`) | `AH=00h` (reset), `01h` (status), `02h` (read CHS sectors from 1.44 MB floppy image `80×2×18` with multi-track wrap), `03h` (write CHS sectors to in-memory floppy image), `08h` (get drive parameters: `BL=04h`, `CH=79`, `CL=18`, `DH=1`, `ES:DI=F000:EFC7`), `15h` (get disk type). Hard drives (`DL >= 0x80`) return `CF=1` |
| **`INT 15h`** | System Services | `AX=E820h` (SMAP memory map: `0..9FBFFh` usable, `9FC00h..9FFFFh` EBDA reserved, `E0000h..FFFFFh` ROM reserved, `100000h..ramSize` usable), `AX=E801h`, `AH=88h` (extended memory size), `AX=2400h..2403h` (A20 gate control), `AH=87h` (protected-mode block move used by KolibriOS bootloader to copy the floppy RAM disk to `0x100000`), `AH=53h` (APM 1.2), `AH=C0h` (system config), `AH=86h` (microsecond wait). All other subfunctions return `CF=1, AH=86h` |
| **`INT 16h`** | Keyboard Services | `AH=00h/10h` (blocking read key; yields via `STI; HLT` stub so `INT 08h` timer ticks fire), `AH=01h/11h` (non-blocking peek key with `ZF`), `AH=02h/12h` (shift flags), `AH=03h` (typematic rate) |
| **`INT 19h`** | Bootstrap Loader | Reloads sector 0 of floppy to `0000:7C00` and jumps to `0000:7C00` |
| **`INT 1Ah`** | Time-of-Day & PCI BIOS v2.10 | `AH=00h..05h` (tick counter & BCD RTC time/date), `AX=B101h` (PCI BIOS installation check returning `EDX="PCI "`, `AL=01h` mechanism #1), `B102h/B103h` (find PCI device/class), `B108h..B10Dh` (read/write PCI config byte/word/dword) |

## 3. What Is Intentionally Not Emulated

1. **MMX / SSE / AVX SIMD Extensions**: Omitted by requirement (Pentium i586 without MMX/SSE; `CPUID` leaf 1 reports `EDX` bits 23, 24, 25, 26 as `0`).
2. **APIC / IOAPIC / SMP**: `CPUID` reports `APIC=0` (bit 9 = 0), and no MP Floating Pointer structure is placed in memory, so KolibriOS cleanly uses the dual 8259A PIC (`irq0..irq15`).
3. **ACPI Tables (RSDP / RSDT / FADT / DSDT)**: Omitted as allowed by specification; when KolibriOS scans `0xE0000..0xFFFFF` for `"RSD PTR "` during `acpi_locate`, it finds it absent cleanly and uses APM 1.2 + PCI BIOS instead.
4. **Legacy 82077AA Floppy Controller (`0x3F0..0x3F7`) DMA Transfers**: KolibriOS loads the entire 1.44 MB floppy into a RAM disk (`/rd/1`) in real mode via `INT 13h AH=02h` and `INT 15h AH=87h`. After entering protected mode, ports `0x3F2..0x3F7` return ready/idle status cleanly without needing 8237 DMA channel 2 emulation.
5. **IDE / AHCI / USB / SDHCI Storage & Sound Blaster 16 / AC'97 Audio**: PCI config space only populates the host bridge and VBE VGA adapter, and legacy IDE (`0x1F0`, `0x170`) and SB16 (`0x210..0x280`) ports return absent (`0x00` / `0xFF`), allowing KolibriOS drivers (`SOUND.SYS`, `SB16.SYS`, `SDHCI.SYS`) to probe and exit gracefully.
