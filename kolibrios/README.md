# kolibrios/ — the Hummingbird floppy

`kolibri-hummingbird.img` is a 1.44 MB KolibriOS boot floppy that we built
ourselves from the KolibriOS source, with every prebuilt binary that has no
buildable source in the tree taken out. It is the guest OS the Hummingbird
emulator ships with.

| | |
|---|---|
| Image | `kolibri-hummingbird.img` (1,474,560 bytes, FAT12) |
| SHA-256 | `0df1a2e9a6791fab16063ff5845edb0e4407fd2b92bc0408a25b2d9cd5e7ef5f` |
| KolibriOS source | [`62b2b72`](https://git.kolibrios.org/KolibriOS/kolibrios/commit/62b2b72cb39e509a2e5e2a72d7a40af98d43db74) (1 Nov 2026), language `en_US` |
| Licence | GPL version 2 (`COPYING.TXT`). This folder is GPLv2; the rest of the Hummingbird repo is MIT. |
| Contents | 230 files, listed with origin and SHA-256 in `MANIFEST.md` / `manifest.json` |

## What's on it

- **193 files built from source by us**: the kernel, the boot loader, the
  drivers, the shell, the libraries and every program, assembled with FASM
  (and NASM for a few) and packed with `kpack`/`kerpack`, which are
  themselves built from source during the build.
- **27 data files** from the KolibriOS tree's `data/` folder: fonts, the
  default skin, icons, wallpaper, config `.ini` files, and the en_US
  language data.
- **10 text files** copied straight from the source tree (docs and
  settings).

## What we took out, and why

The official image carries a few files that are checked into the tree as
binaries, with no source that builds them. We removed them so that
everything executable on the floppy comes from source that is in the
archive next to it.

| file | why it's gone |
|---|---|
| `ALLGAMES` | prebuilt binary in `data/common/`, no source in the tree |
| `LIB/KMENU.OBJ` | prebuilt library, no source in the tree. The Animage paint program loads it for its menus, so Animage may lose them |
| `LIB/PIXLIB.OBJ` | prebuilt library, no source in the tree; nothing on the floppy loads it |
| `MEDIA/AC97SND` | prebuilt player, source is MSVC-only and isn't built by the KolibriOS build. (The AC97 *driver*, `DRIVERS/AC97.SYS`, is built from source and stays.) |
| `NETWORK/KNMAP` | prebuilt binary, no source in the tree |
| `GAMES/DESCENT` | prebuilt binary, no source in the tree |
| `FONTS/TAHOMA.KF` | font with no licence or provenance in the tree, and no program references it. (Every other font has a licence file in the tree.) |
| `KUZKINA.MID` | MIDI file with no licence or provenance in the tree, and no program references it |

It boots to the same desktop as the official nightly: `reference/` has QEMU
screenshots of the boot menu and desktop for both. **But it is not
feature-complete; see the next section.**

## What's missing: programs that need other compilers

*(Correction, 2026-11-04: an earlier version of this README said everything
else "behaves as in the official nightly". It doesn't.)*

This build turns on only the FASM and NASM toolchains. KolibriOS also builds
programs with **C--, TCC, GCC, MSVC and Oberon-07**, and those groups were
switched off (`patches/tup.config`), so their programs aren't on the floppy.
Their desktop icons are still there and do nothing. Compared with the official
nightly, these 58 files are absent (a few are renames in the newer source tree,
such as `ICONS16.PNG` → `ICONS18.PNG`):

`APP_PLUS`, `BARSCFG`, `DEVELOP/CEDIT`, `DEVELOP/CLIPVIEW`, `DEVELOP/DIFF`, `DEVELOP/EXAMPLES/CIRCLE`, `DEVELOP/EXAMPLES/COLORREF`, `DEVELOP/EXAMPLES/CONGET`, `DEVELOP/EXAMPLES/CSLIDE`, `DEVELOP/EXAMPLES/TESTCON2`, `DEVELOP/EXAMPLES/THREAD`, `DEVELOP/MENU`, `EASYSHOT`, `FB2READ`, `FSPEED`, `File Managers/EOLITE`, `File Managers/ICONS.INI`, `File Managers/KFM2`, `GAMES/CLICKS`, `GAMES/DINO`, `GAMES/FLOOD-IT`, `GAMES/FLPYBIRD`, `GAMES/KOSILKA`, `GAMES/MBLOCKS`, `GAMES/MINE`, `GAMES/NUMBERS`, `GAMES/REVERSI`, `GAMES/RFORCES`, `GAMES/XONIX`, `GRAPH`, `ICONS16.PNG`, `LIB/BASE64.OBJ`, `LIB/ICONV.OBJ`, `LIB/INPUTBOX.OBJ`, `LIB/LIBC.OBJ`, `MEDIA/ICONEDIT`, `MEDIA/IMGF/CEDG.OBJ`, `MEDIA/IMGF/DITHER.OBJ`, `MEDIA/IMGF/IMGF`, `MEDIA/IMGF/INVSOL.OBJ`, `MEDIA/PIXIE`, `MEDIA/PIXIESKN.PNG`, `MGB`, `MOUSECFG`, `NETWORK/DL`, `NETWORK/DOWNLOADER`, `NETWORK/NSINST`, `NETWORK/WEBVIEW`, `NETWORK/WHOIS`, `RUN`, `SEARCH`, `SETTINGS/KOLIBRI.LBL`, `SHELL`, `SYSMON`, `SYSPANEL`, `TABLE`, `TMPDISK`, `UNIMG`

The ones people will notice: **SHELL**, both file managers (**EOLITE**,
**KFM2**), **WEBVIEW**, **SYSPANEL**, **CEDIT**, and games like **XONIX**,
**MINE**, **FLOOD-IT** and **REVERSI**. Getting them back means building those
toolchains from source too (TCC and GCC first; C-- and Oberon-07 need a look at
their own sources and licences), with the same blob-free, reproducible rules.
That's the next step for this floppy.

## The source (GPL)

`kolibrios-source-62b2b72.tar.xz` is the complete corresponding source for
the image: the 926 source files that feed it, the `kpack`/`kerpack`
sources, our build script and tools, and `COPYING.TXT`. It's the subset of
the KolibriOS tree at commit `62b2b72` that the floppy depends on, taken
from tup's own dependency graph, with our two small changes:

- `patches/data-Tupfile.lua.diff`: comments out the removed files above,
  the tree's references to folders that don't exist in it, and (behind
  `CONFIG_HUMMINGBIRD_IMG_ONLY`) the ISO and extras targets.
- `patches/tup.config`: the build configuration (en_US; FASM/NASM only,
  no GCC/MSVC/JWasm/C--/TCC/Oberon toolchains).

## Rebuilding it

```sh
tar xf kolibrios-source-62b2b72.tar.xz
cd kolibrios-62b2b72
./build-floppy.sh
sha256sum build-en_US/data/kolibri.img
# 0df1a2e9a6791fab16063ff5845edb0e4407fd2b92bc0408a25b2d9cd5e7ef5f
```

Needs `fasm`, `nasm`, `mtools`, `gcc` + `make` (for kpack/kerpack) and
`python3`. `faketime` is optional. No tup needed: `build-floppy.sh` is
the 249 build commands from tup's graph for `kolibri.img`, in order.

The build is reproducible: two clean extractions built on their own give
the hash above byte for byte. Three things make that hold:

- `hummingbird-tools/fasm` wraps FASM and zeroes the timestamps it stamps
  into PE and COFF headers (recomputing the PE checksum, which covers the
  timestamp). Otherwise `kpack` compression spreads one changed timestamp
  across a whole file.
- every build output is touched to `2026-11-01 00:00:00` before the image
  is assembled.
- `hummingbird-tools/fat12-fix-times.py` sets every date and time in the
  floppy's directory entries to the same moment.

## Try it

```sh
qemu-system-i386 -cpu pentium -m 64 -vga std -fda kolibri-hummingbird.img -boot a
```

Press Enter at the boot menu (or wait) and it comes up to a 1024×768
desktop.
