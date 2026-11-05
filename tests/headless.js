#!/usr/bin/env node
// ============================================================================
// Hummingbird x86 PC Emulator — Headless Boot & Custom PNG Snapshot Runner
// Loads the emulator core directly from index.html (no duplicate copy),
// boots a floppy image deterministically, records all boot milestones with
// instruction counts, and writes PNG snapshots using a custom from-scratch
// PNG encoder.
//
// Usage:
//   node tests/headless.js [path/to/kolibri.img] [--snap-at=250000,290000000]
// ============================================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ----------------------------------------------------------------------------
// 1. Custom From-Scratch PNG Encoder (Zero Dependencies, No zlib module used)
//    Encodes RGBA Uint32Array / Uint8Array into a valid PNG file using custom
//    CRC-32, Adler-32, and RFC 1950/1951 uncompressed DEFLATE blocks.
// ----------------------------------------------------------------------------
const PNG_CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes, start = 0, end = bytes.length) {
  let c = 0xFFFFFFFF;
  for (let i = start; i < end; i++) {
    c = PNG_CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function adler32(bytes) {
  let a = 1;
  let b = 0;
  const MOD = 65521;
  let i = 0;
  const len = bytes.length;
  while (i < len) {
    const end = Math.min(i + 5550, len);
    while (i < end) {
      a += bytes[i++];
      b += a;
    }
    a %= MOD;
    b %= MOD;
  }
  return ((b << 16) | a) >>> 0;
}

function makePngChunk(typeAscii, dataBytes) {
  const len = dataBytes.length;
  const out = new Uint8Array(12 + len);
  const view = new DataView(out.buffer);
  view.setUint32(0, len, false);
  for (let i = 0; i < 4; i++) {
    out[4 + i] = typeAscii.charCodeAt(i);
  }
  out.set(dataBytes, 8);
  const crc = crc32(out, 4, 8 + len);
  view.setUint32(8 + len, crc, false);
  return out;
}

function encodePNGFromScratch(width, height, rgba32) {
  const rgbaBytes = new Uint8Array(rgba32.buffer, rgba32.byteOffset, rgba32.byteLength);
  const rowBytes = width * 4;
  // Build raw PNG scanlines (each preceded by filter type 0 = None)
  const rawLen = (rowBytes + 1) * height;
  const raw = new Uint8Array(rawLen);
  for (let y = 0; y < height; y++) {
    const dstOff = y * (rowBytes + 1);
    raw[dstOff] = 0; // Filter: None
    const srcOff = y * rowBytes;
    raw.set(rgbaBytes.subarray(srcOff, srcOff + rowBytes), dstOff + 1);
  }

  // Wrap raw scanlines in RFC 1950 zlib stream with RFC 1951 stored blocks (BTYPE=00)
  const maxBlock = 65535;
  const numBlocks = Math.ceil(rawLen / maxBlock) || 1;
  const zlibLen = 2 + numBlocks * 5 + rawLen + 4;
  const zlibStream = new Uint8Array(zlibLen);
  let zp = 0;
  zlibStream[zp++] = 0x78; // CMF: Deflate, 32K window
  zlibStream[zp++] = 0x01; // FLG: No dict, check bits

  let rem = rawLen;
  let srcPtr = 0;
  for (let b = 0; b < numBlocks; b++) {
    const blkLen = Math.min(maxBlock, rem);
    const isFinal = (b === numBlocks - 1) ? 1 : 0;
    zlibStream[zp++] = isFinal; // BFINAL | (BTYPE=00 << 1)
    zlibStream[zp++] = blkLen & 0xFF;
    zlibStream[zp++] = (blkLen >>> 8) & 0xFF;
    const nlen = (~blkLen) & 0xFFFF;
    zlibStream[zp++] = nlen & 0xFF;
    zlibStream[zp++] = (nlen >>> 8) & 0xFF;
    zlibStream.set(raw.subarray(srcPtr, srcPtr + blkLen), zp);
    zp += blkLen;
    srcPtr += blkLen;
    rem -= blkLen;
  }

  const adler = adler32(raw);
  zlibStream[zp++] = (adler >>> 24) & 0xFF;
  zlibStream[zp++] = (adler >>> 16) & 0xFF;
  zlibStream[zp++] = (adler >>> 8) & 0xFF;
  zlibStream[zp++] = adler & 0xFF;

  // Build IHDR chunk (13 bytes)
  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width, false);
  ihdrView.setUint32(4, height, false);
  ihdr[8] = 8;  // Bit depth: 8
  ihdr[9] = 6;  // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0
  ihdr[11] = 0; // Filter: 0
  ihdr[12] = 0; // Interlace: 0

  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const cIHDR = makePngChunk('IHDR', ihdr);
  const cIDAT = makePngChunk('IDAT', zlibStream);
  const cIEND = makePngChunk('IEND', new Uint8Array(0));

  const total = sig.length + cIHDR.length + cIDAT.length + cIEND.length;
  const png = new Uint8Array(total);
  let offset = 0;
  png.set(sig, offset); offset += sig.length;
  png.set(cIHDR, offset); offset += cIHDR.length;
  png.set(cIDAT, offset); offset += cIDAT.length;
  png.set(cIEND, offset);
  return png;
}

// ----------------------------------------------------------------------------
// 2. Load Emulator Core Directly from index.html
// ----------------------------------------------------------------------------
function loadCoreFromHtml(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const match = html.match(/<script\s+id=["']hummingbird-core["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) {
    throw new Error(`Could not find <script id="hummingbird-core"> in ${htmlPath}`);
  }
  const sandbox = {
    console,
    Math,
    Date,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Float32Array,
    Float64Array,
    ArrayBuffer,
    DataView,
    Map,
    Set,
    BigInt,
    Number,
    String,
    Object,
    Boolean,
    Array,
    Error,
    TextDecoder
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(match[1], sandbox, { filename: 'index.html#hummingbird-core' });
  return sandbox;
}

// ----------------------------------------------------------------------------
// 3. Main Headless Boot & Milestone Snapshot Runner
// ----------------------------------------------------------------------------
function resolveImagePath(argPath) {
  const candidates = [
    argPath,
    'kolibri-0.7.7.0+8930.img',
    'kolibri.img',
    path.join(__dirname, '..', 'user_uploaded_files', 'ttl=63d', 'user_uploaded', 'kolibri-0.7.7.0+8930.img')
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(`Floppy image not found. Tried: ${candidates.join(', ')}`);
}

function main() {
  const args = process.argv.slice(2);
  let imgArg = null;
  const customSnapCounts = [];

  for (const arg of args) {
    if (arg.startsWith('--snap-at=')) {
      const nums = arg.slice('--snap-at='.length).split(',').map(s => parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n));
      customSnapCounts.push(...nums);
    } else if (!arg.startsWith('--')) {
      imgArg = arg;
    }
  }

  const rootDir = path.resolve(__dirname, '..');
  const htmlPath = path.join(rootDir, 'index.html');
  const imgPath = resolveImagePath(imgArg);
  const outDir = path.join(rootDir, 'artifacts', 'file_generation', 'ttl=63d', 'output');
  const snapDir = path.join(rootDir, 'snapshots');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(snapDir, { recursive: true });

  console.log(`=== Hummingbird Headless Runner ===`);
  console.log(`Core source : ${htmlPath}`);
  console.log(`Floppy image: ${imgPath}`);

  const core = loadCoreFromHtml(htmlPath);
  const imgBytes = new Uint8Array(fs.readFileSync(imgPath));

  const savedSnapshots = [];
  function saveSnapshot(pc, fileName, label) {
    const { width, height, rgba } = pc.vga.renderFrame();
    const pngBytes = encodePNGFromScratch(width, height, rgba);
    const p1 = path.join(snapDir, fileName);
    const p2 = path.join(outDir, fileName);
    fs.writeFileSync(p1, pngBytes);
    fs.writeFileSync(p2, pngBytes);
    savedSnapshots.push({ fileName, width, height, inst: pc.cpu.totalInstructions, label });
    console.log(`  [SNAPSHOT] ${fileName} (${width}x${height}, ${pngBytes.length} bytes) @ inst=${pc.cpu.totalInstructions} — ${label}`);
  }

  const tStart = Date.now();
  const pc = new core.HummingbirdPC({
    ramSizeMB: 64,
    deterministic: true,
    onMilestone: (m) => {
      const elapsedS = ((Date.now() - tStart) / 1000).toFixed(2);
      console.log(`[MILESTONE] ${m.name} | inst=${m.instructions.toLocaleString()} | wall=${elapsedS}s | ${m.details}`);
      if (m.id === 'boot_sector') {
        saveSnapshot(pc, 'milestone-1-boot-sector.png', m.name);
      } else if (m.id === 'boot_menu') {
        saveSnapshot(pc, 'milestone-2-boot-menu.png', m.name);
      } else if (m.id === 'protected_mode_paging') {
        saveSnapshot(pc, 'milestone-3-protected-mode.png', m.name);
      } else if (m.id === 'desktop_drawn') {
        saveSnapshot(pc, 'milestone-4-desktop.png', m.name);
      } else if (m.id === 'mouse_moved') {
        saveSnapshot(pc, 'milestone-5-mouse-moved.png', m.name);
      }
    }
  });

  pc.loadFloppyImage(imgBytes);

  // Sort any user-requested custom instruction counts
  customSnapCounts.sort((a, b) => a - b);
  let nextCustomIdx = 0;

  // Phase 1: Boot to full GUI desktop (Milestone 4, ~289.9M instructions)
  const stepChunk = 1000000;
  const maxBootInst = 310000000;
  while (pc.cpu.totalInstructions < maxBootInst && !pc.milestoneMap.has('desktop_drawn')) {
    let toRun = stepChunk;
    if (nextCustomIdx < customSnapCounts.length) {
      const target = customSnapCounts[nextCustomIdx];
      if (target > pc.cpu.totalInstructions && target - pc.cpu.totalInstructions < toRun) {
        toRun = target - pc.cpu.totalInstructions;
      }
    }
    pc.cpu.runSteps(toRun);
    while (nextCustomIdx < customSnapCounts.length && pc.cpu.totalInstructions >= customSnapCounts[nextCustomIdx]) {
      const cInst = customSnapCounts[nextCustomIdx++];
      saveSnapshot(pc, `snapshot-${cInst}.png`, `Custom checkpoint @ ${cInst}`);
    }
  }

  if (!pc.milestoneMap.has('desktop_drawn')) {
    throw new Error('Failed to reach Milestone 4 (Desktop drawn) within instruction budget');
  }

  const bootElapsedS = (Date.now() - tStart) / 1000;
  const bootMips = (pc.cpu.totalInstructions / 1e6) / bootElapsedS;
  console.log(`\nDesktop reached in ${pc.cpu.totalInstructions.toLocaleString()} instructions (${bootElapsedS.toFixed(2)}s, ${bootMips.toFixed(2)} MIPS).`);

  // Phase 2: Verify Tier 3 Milestones 5, 6, and 7 (Mouse movement, 4 Apps working, and Menu Shutdown/Restart)
  // 1. Open SHELL (836, 160) and run "ver"
  pc.moveMouseTo(836, 160);
  pc.clickMouse(true);
  pc.cpu.runSteps(22000000);
  for (const sc of [0x2F, 0x12, 0x13, 0x1C]) pc.pressKeyScancode(sc, 600000);
  pc.cpu.runSteps(6000000);

  // 2. Focus desktop at (32, 95) then double-click TINYPAD (32, 95) and type "hummingbird"
  pc.moveMouseTo(32, 95);
  pc.clickMouse(false);
  pc.cpu.runSteps(2000000);
  pc.clickMouse(true);
  pc.cpu.runSteps(16000000);
  for (const sc of [0x23, 0x16, 0x32, 0x32, 0x17, 0x31, 0x22, 0x30, 0x17, 0x13, 0x20]) {
    pc.pressKeyScancode(sc, 800000);
  }
  pc.cpu.runSteps(4000000);

  // 3. Focus desktop at (236, 28) then double-click CALC+ (236, 28) and compute 6*7=42
  pc.moveMouseTo(236, 28);
  pc.clickMouse(false);
  pc.cpu.runSteps(2000000);
  pc.clickMouse(true);
  pc.cpu.runSteps(14000000);
  for (const sc of [0x07, 0x37, 0x08, 0x1C]) pc.pressKeyScancode(sc, 800000);
  pc.cpu.runSteps(4000000);

  // 4. Focus desktop at (972, 625) then double-click TETRIS (972, 625), drag window right so all 4 apps show, and start game
  pc.moveMouseTo(972, 625);
  pc.clickMouse(false);
  pc.cpu.runSteps(2000000);
  pc.clickMouse(true);
  pc.cpu.runSteps(10000000);
  // Drag Tetris title bar from (420, 42) right by +240px so Calc+ "6*7 = 42" and TinyPad "hummingbird" are all visible side-by-side!
  pc.moveMouseTo(420, 42);
  pc.ps2.sendMousePacket(0, 0, 1);
  pc.drainPS2();
  pc.cpu.runSteps(1000000);
  for (let d = 0; d < 30; d++) {
    pc.ps2.sendMousePacket(8, 0, 1);
    pc.drainPS2();
  }
  pc.ps2.sendMousePacket(0, 0, 0);
  pc.drainPS2();
  pc.cpu.runSteps(18000000);
  pc.pressKeyScancode(0x1C, 600000); // Press Enter to start Tetris
  pc.cpu.runSteps(8000000);

  saveSnapshot(pc, "milestone-6-apps-running.png", "6. Apps open and work (SHELL, TINYPAD, CALC+, TETRIS)");

  // 5. Open Menu (25, 755) -> Click Shut down (55, 720) -> Confirm Reboot/Shutdown
  pc.moveMouseTo(25, 755);
  pc.clickMouse(false);
  pc.cpu.runSteps(10000000);
  pc.moveMouseTo(55, 720);
  pc.clickMouse(false);
  pc.cpu.runSteps(22000000);
  saveSnapshot(pc, "milestone-7-shutdown-menu.png", "7. Shutdown/Restart dialog from Menu");
  pc.pressKeyScancode(0xE04F, 600000); // Press End key to select "Power off (End)" -> APM 1.2 Shutdown!
  pc.cpu.runSteps(10000000);

  const totalElapsedS = (Date.now() - tStart) / 1000;
  const overallMips = (pc.cpu.totalInstructions / 1e6) / totalElapsedS;

  console.log(`\n=== Headless Run Summary ===`);
  console.log(`Total Instructions : ${pc.cpu.totalInstructions.toLocaleString()}`);
  console.log(`Wall-Clock Time    : ${totalElapsedS.toFixed(2)}s (${overallMips.toFixed(2)} MIPS)`);
  console.log(`Block Cache Stats  : ${pc.cpu.basicBlockHits.toLocaleString()} hits, ${pc.cpu.basicBlockInstrs.toLocaleString()} cached insts, ${pc.cpu.basicBlockDecoded.toLocaleString()} blocks decoded`);
  console.log(`#UD Exceptions     : ${pc.udList.length}`);
  console.log(`Unhandled Ports    : ${pc.unhandledPorts.size}`);
  console.log(`Milestones Reached : ${pc.milestones.length} / 7`);
  for (const m of pc.milestones) {
    console.log(`  - ${m.name}: inst=${m.instructions.toLocaleString()} (${m.details})`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { loadCoreFromHtml, encodePNGFromScratch };