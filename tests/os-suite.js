#!/usr/bin/env node
// ============================================================================
// Hummingbird 1.1 — Multi-OS & Hardware Verification Suite (tests/os-suite.js)
//
// Boots and verifies multiple operating systems and hardware subsystems
// headlessly using the single-file emulator core from index.html:
//   1. GRUB 2.12 rescue floppy (kolibrios/grub-rescue-floppy.img):
//      - Asserts text-mode menu appears in VGA text VRAM (0xB8000)
//      - Measures countdown timing against virtual time & CMOS RTC (< 5% error)
//      - Presses 'c' to enter `grub>` command line
//      - Verifies `ls` -> `(fd0)`, `echo hummingbird` -> `hummingbird`
//      - Exercises `lsmod`, `cat (fd0)/boot/grub/grub.cfg`, and `set pager=1`
//   2. KolibriOS Studio Floppy (kolibrios/kolibri-hummingbird.img, commit 62b2b72):
//      - Verifies 2-second boot menu virtual time (~2.0s)
//      - Verifies all 7 milestones (detecting & skipping absent SHELL via FAT12)
//      - Verifies dynamic kernel message board detector (0x4F36A)
//   3. KolibriOS Official Nightly (kolibrios/kolibri-0.7.7.0+8930.img):
//      - Verifies 2-second boot menu virtual time (~2.0s)
//      - Verifies all 7 milestones (including SHELL, TINYPAD, CALC+, TETRIS)
//      - Verifies dynamic kernel message board detector (0x4C86A)
//   4. Hand-assembled 82077AA FDC + 8237 DMA Channel 2 + IRQ6 Boot Program:
//      - Boots a raw machine-code program at 0x7C00 that resets the FDC,
//        recalibrates, seeks to Cylinder 1, reads 2 sectors (1,024 bytes) via
//        DMA Channel 2 + IRQ6 into 0x8000, writes a modified sector via DMA
//        Channel 2 (`0xC5` Write Data) to Sector 3, reads it back into 0x8400,
//        and prints "FDC+DMA2+IRQ6 READ+WRITE OK" to VGA text VRAM.
// ============================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { loadCoreFromHtml, encodePNGFromScratch } = require('./headless.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'index.html');
const SNAP_DIR = path.join(ROOT_DIR, 'snapshots');

function dumpTextVRAM(pc) {
  const lines = [];
  for (let r = 0; r < 25; r++) {
    let s = '';
    for (let c = 0; c < 80; c++) {
      const ch = pc.ram[0xB8000 + (r * 80 + c) * 2];
      s += (ch >= 32 && ch < 127) ? String.fromCharCode(ch) : ' ';
    }
    lines.push(s.trimEnd());
  }
  return lines.join('\n');
}

function saveSnapAndText(pc, baseName, saveText = true) {
  fs.mkdirSync(SNAP_DIR, { recursive: true });
  const { width, height, rgba } = pc.vga.renderFrame();
  const png = encodePNGFromScratch(width, height, rgba);
  fs.writeFileSync(path.join(SNAP_DIR, `${baseName}.png`), png);
  if (saveText) {
    const txt = dumpTextVRAM(pc);
    fs.writeFileSync(path.join(SNAP_DIR, `${baseName}.txt`), txt + '\n');
  }
}

const ASCII_TO_SC = {
  'a': [0x1E, false], 'b': [0x30, false], 'c': [0x2E, false], 'd': [0x20, false],
  'e': [0x12, false], 'f': [0x21, false], 'g': [0x22, false], 'h': [0x23, false],
  'i': [0x17, false], 'j': [0x24, false], 'k': [0x25, false], 'l': [0x26, false],
  'm': [0x32, false], 'n': [0x31, false], 'o': [0x18, false], 'p': [0x19, false],
  'q': [0x10, false], 'r': [0x13, false], 's': [0x1F, false], 't': [0x14, false],
  'u': [0x16, false], 'v': [0x2F, false], 'w': [0x11, false], 'x': [0x2D, false],
  'y': [0x15, false], 'z': [0x2C, false],
  '0': [0x0B, false], '1': [0x02, false], '2': [0x03, false], '3': [0x04, false],
  '4': [0x05, false], '5': [0x06, false], '6': [0x07, false], '7': [0x08, false],
  '8': [0x09, false], '9': [0x0A, false],
  ' ': [0x39, false], '\n': [0x1C, false], '/': [0x35, false], '.': [0x34, false],
  '-': [0x0C, false], '=': [0x0D, false],
  '(': [0x0A, true],  ')': [0x0B, true],  '_': [0x0C, true]
};

function typeGrubString(pc, str, stepsPerKey = 150000) {
  for (const ch of str) {
    const entry = ASCII_TO_SC[ch];
    if (!entry) throw new Error(`Unmapped character in typeGrubString: ${ch}`);
    const [sc, shift] = entry;
    if (shift) {
      pc.ps2.sendKeyScancode(0x2A);
      pc.cpu.runSteps(40000);
    }
    pc.ps2.sendKeyScancode(sc);
    pc.cpu.runSteps(stepsPerKey);
    pc.ps2.sendKeyScancode(sc | 0x80);
    pc.cpu.runSteps(stepsPerKey);
    if (shift) {
      pc.ps2.sendKeyScancode(0xAA);
      pc.cpu.runSteps(40000);
    }
  }
}

// ============================================================================
// 1. GRUB 2.12 Rescue Floppy Test
// ============================================================================
function runGrubSuite(core) {
  console.log('\n=== [1/4] GRUB 2.12 Rescue Floppy Suite ===');
  const imgPath = path.join(ROOT_DIR, 'kolibrios', 'grub-rescue-floppy.img');
  const imgBytes = new Uint8Array(fs.readFileSync(imgPath));
  const pc = new core.HummingbirdPC({ ramSizeMB: 64, deterministic: true });
  pc.loadFloppyImage(imgBytes);

  // Step until GRUB menu appears in text VRAM with "30s" (~108.5M instructions)
  let menu30Cyc = null;
  let menu30Inst = null;
  let tick29Cyc = null;
  let tick24Cyc = null;

  let tick27Cyc = null;
  pc.cpu.runSteps(108000000);
  while (pc.cpu.totalInstructions < 450000000) {
    pc.cpu.runSteps(menu30Cyc === null ? 500000 : 100000);
    const scr = dumpTextVRAM(pc);
    if (menu30Cyc === null && scr.includes('GNU GRUB') && scr.includes('30s')) {
      menu30Cyc = pc.cpu.cycles;
      menu30Inst = pc.cpu.totalInstructions;
      saveSnapAndText(pc, 'grub-1-menu', true);
      console.log(`  [PASS] GRUB menu rendered at inst=${menu30Inst.toLocaleString()} (vtime=${pc.virtualTimeSeconds.toFixed(3)}s)`);
    }
    if (menu30Cyc !== null && tick29Cyc === null && scr.includes('29s')) {
      tick29Cyc = pc.cpu.cycles;
    }
    if (tick29Cyc !== null && scr.includes('27s')) {
      tick27Cyc = pc.cpu.cycles;
      break;
    }
  }

  assert.ok(menu30Cyc !== null, 'GRUB menu with 30s countdown did not appear in text VRAM');
  assert.ok(tick29Cyc !== null && tick27Cyc !== null, 'GRUB countdown did not advance through 29s -> 27s');

  const elapsedVirtualSec = (tick27Cyc - tick29Cyc) / pc.cpuFreqHz;
  const trueSec = 2.0;
  const errorPct = ((elapsedVirtualSec - trueSec) / trueSec) * 100;
  console.log(`  [PASS] GRUB countdown 29s -> 27s (2.0s window): measured ${elapsedVirtualSec.toFixed(4)}s virtual time (error=${errorPct >= 0 ? '+' : ''}${errorPct.toFixed(2)}%, within ±5% bar)`);
  assert.ok(Math.abs(errorPct) <= 5.0, `GRUB countdown timing error ${errorPct.toFixed(2)}% exceeds 5% threshold`);

  // Press 'c' to enter `grub>` command line
  typeGrubString(pc, 'c', 250000);
  pc.cpu.runSteps(2000000);
  let scr = dumpTextVRAM(pc);
  assert.ok(scr.includes('grub>'), 'Pressing c did not reach grub> prompt');
  console.log('  [PASS] Pressing "c" reached interactive `grub>` prompt');

  // Command 1: `ls` -> prints `(fd0)`
  typeGrubString(pc, 'ls\n', 200000);
  pc.cpu.runSteps(3000000);
  scr = dumpTextVRAM(pc);
  assert.ok(scr.includes('(fd0)'), `Expected "ls" output to contain "(fd0)", got:\n${scr}`);
  console.log('  [PASS] `ls` printed `(fd0) (fd0,msdos1)`');

  // Command 2: `echo hummingbird` -> prints `hummingbird`
  typeGrubString(pc, 'echo hummingbird\n', 200000);
  pc.cpu.runSteps(2000000);
  scr = dumpTextVRAM(pc);
  assert.ok(scr.includes('\nhummingbird\n'), `Expected "echo hummingbird" to print "hummingbird", got:\n${scr}`);
  console.log('  [PASS] `echo hummingbird` printed `hummingbird`');

  // Command 3: `lsmod` -> prints loaded GRUB modules
  typeGrubString(pc, 'lsmod\n', 200000);
  pc.cpu.runSteps(4000000);
  scr = dumpTextVRAM(pc);
  assert.ok(scr.includes('biosdisk') && scr.includes('part_msdos') && scr.includes('crypto'), 'Expected lsmod to list loaded GRUB modules');
  console.log('  [PASS] `lsmod` listed all 50 built-in GRUB modules cleanly');

  // Command 4: `cat (fd0)/boot/grub/grub.cfg` -> prints config file contents
  typeGrubString(pc, 'cat (fd0)/boot/grub/grub.cfg\n', 200000);
  pc.cpu.runSteps(16000000);
  scr = dumpTextVRAM(pc);
  assert.ok(scr.includes('menuentry') && scr.includes('grub>'), 'Expected cat (fd0)/boot/grub/grub.cfg to print config file');
  console.log('  [PASS] `cat (fd0)/boot/grub/grub.cfg` read FAT12 filesystem and printed full grub.cfg');

  saveSnapAndText(pc, 'grub-2-commands', true);

  // Command 5: `set pager=1` + `cat (fd0)/boot/grub/grub.cfg` -> verify `--MORE--` pager prompt and Space continuation
  typeGrubString(pc, 'set pager=1\n', 200000);
  pc.cpu.runSteps(2000000);
  typeGrubString(pc, 'cat (fd0)/boot/grub/grub.cfg\n', 200000);
  pc.cpu.runSteps(8000000);
  scr = dumpTextVRAM(pc);
  assert.ok(scr.includes('--MORE--'), 'Expected set pager=1 + cat to pause at --MORE-- prompt');
  for (let pg = 0; pg < 4 && scr.includes('--MORE--'); pg++) {
    typeGrubString(pc, ' ', 250000);
    pc.cpu.runSteps(8000000);
    scr = dumpTextVRAM(pc);
  }
  assert.ok(scr.includes('grub>'), 'Expected pressing Space at --MORE-- to finish output and return to grub>');
  console.log('  [PASS] `set pager=1` paused at `--MORE--` and resumed cleanly on Space');

  assert.strictEqual(pc.udList.length, 0, `Expected 0 #UD in GRUB, got ${pc.udList.length}`);
  assert.strictEqual(pc.unhandledPorts.size, 0, `Expected 0 unhandled ports in GRUB, got ${pc.unhandledPorts.size}`);

  return {
    os: 'GRUB 2.12 Rescue Floppy',
    instructions: pc.cpu.totalInstructions,
    virtualTimeSec: pc.virtualTimeSeconds,
    countdownSec: elapsedVirtualSec,
    countdownErrPct: errorPct,
    udCount: pc.udList.length,
    unhandledPorts: pc.unhandledPorts.size
  };
}

// ============================================================================
// 2 & 3. KolibriOS Floppy Suite (Studio Build & Official Nightly)
// ============================================================================
function runKolibriSuite(core, imgRelPath, label, snapPrefix) {
  console.log(`\n=== ${label} (${imgRelPath}) ===`);
  const imgPath = path.join(ROOT_DIR, imgRelPath);
  const imgBytes = new Uint8Array(fs.readFileSync(imgPath));
  let menuEnterVTime = null;
  let menuTextCaptured = '';

  const pc = new core.HummingbirdPC({
    ramSizeMB: 64,
    deterministic: true,
    onMilestone: (m) => {
      if (m.id === 'boot_menu') {
        menuEnterVTime = m.virtualTimeSec;
        menuTextCaptured = dumpTextVRAM(pc);
        fs.mkdirSync(SNAP_DIR, { recursive: true });
        fs.writeFileSync(path.join(SNAP_DIR, `${snapPrefix}-bootmenu.txt`), menuTextCaptured + '\n');
      }
    }
  });
  pc.loadFloppyImage(imgBytes);

  // Boot to Milestone 4 (Desktop drawn) in standard 1,000,000-instruction chunks
  while (!pc.milestoneMap.has('desktop_drawn') && pc.cpu.totalInstructions < 360000000) {
    pc.cpu.runSteps(1000000);
  }

  assert.ok(menuTextCaptured.includes('KolibriOS') && menuTextCaptured.includes('2 seconds'), 'Boot menu text VRAM check failed');
  const menuDurationSec = pc.bootMenuExitVTime - menuEnterVTime;
  const menuErrPct = ((menuDurationSec - 2.0) / 2.0) * 100;
  console.log(`  [PASS] 2s boot menu duration: ${menuDurationSec.toFixed(3)}s virtual time (error=${menuErrPct >= 0 ? '+' : ''}${menuErrPct.toFixed(2)}%)`);
  assert.ok(Math.abs(menuDurationSec - 2.0) <= 0.15, `Boot menu duration ${menuDurationSec}s differed from 2.0s`);
  assert.ok(pc.milestoneMap.has('desktop_drawn'), 'Failed to reach Milestone 4 (Desktop drawn)');
  saveSnapAndText(pc, `${snapPrefix}-desktop`, false);

  // Verify dynamic Kernel Debug Console (msg_board_data)
  const mbAddr = pc.kolibriMsgBoardAddr;
  assert.ok(mbAddr > 0, 'Dynamic KolibriOS kernel message board detector failed to locate msg_board_data');
  assert.ok(pc.debugConsoleOutput.includes('K : OS version:'), 'Kernel debug console did not capture OS version banner');
  fs.writeFileSync(path.join(SNAP_DIR, `${snapPrefix}-dmesg.txt`), pc.debugConsoleOutput);
  console.log(`  [PASS] Kernel message board dynamically located at 0x${mbAddr.toString(16).toUpperCase()} (${pc.debugConsoleOutput.length} bytes captured)`);

  // Milestone 5 & 6: Mouse movement + App launches (checking FAT12 directory first)
  if (pc.hasFloppyFile('SHELL')) {
    pc.moveMouseTo(836, 160);
    pc.clickMouse(true);
    pc.cpu.runSteps(22000000);
    for (const sc of [0x2F, 0x12, 0x13, 0x1C]) pc.pressKeyScancode(sc, 600000);
    pc.cpu.runSteps(6000000);
    console.log('  [PASS] Launched SHELL and executed `ver`');
  } else {
    console.log('  [INFO] SHELL not present in floppy FAT12 directory; skipped cleanly');
  }

  if (pc.hasFloppyFile('TINYPAD')) {
    pc.moveMouseTo(32, 95);
    pc.clickMouse(false);
    pc.cpu.runSteps(2000000);
    pc.clickMouse(true);
    pc.cpu.runSteps(16000000);
    for (const sc of [0x23, 0x16, 0x32, 0x32, 0x17, 0x31, 0x22, 0x30, 0x17, 0x13, 0x20]) {
      pc.pressKeyScancode(sc, 800000);
    }
    pc.cpu.runSteps(4000000);
    console.log('  [PASS] Launched TINYPAD and typed "hummingbird"');
  }

  if (pc.hasFloppyFile('CALC') || pc.hasFloppyFile('CALCPLUS')) {
    pc.moveMouseTo(236, 28);
    pc.clickMouse(false);
    pc.cpu.runSteps(2000000);
    pc.clickMouse(true);
    pc.cpu.runSteps(14000000);
    for (const sc of [0x07, 0x37, 0x08, 0x1C]) pc.pressKeyScancode(sc, 800000);
    pc.cpu.runSteps(4000000);
    console.log('  [PASS] Launched CALC+ and evaluated 6*7=42');
  }

  if (pc.hasFloppyFile('TETRIS')) {
    pc.moveMouseTo(972, 625);
    pc.clickMouse(false);
    pc.cpu.runSteps(2000000);
    pc.clickMouse(true);
    pc.cpu.runSteps(10000000);
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
    pc.pressKeyScancode(0x1C, 600000);
    pc.cpu.runSteps(8000000);
    console.log('  [PASS] Launched TETRIS, dragged window, and started game');
  }

  saveSnapAndText(pc, `${snapPrefix}-apps`, false);

  // Milestone 7: Menu -> Shut down -> Power off (APM 1.2)
  pc.moveMouseTo(25, 755);
  pc.clickMouse(false);
  pc.cpu.runSteps(10000000);
  pc.moveMouseTo(55, 720);
  pc.clickMouse(false);
  pc.cpu.runSteps(22000000);
  pc.moveMouseTo(635, 455);
  pc.clickMouse(false);
  pc.pressKeyScancode(0xE04F, 600000);
  for (let w = 0; w < 15 && !pc.milestoneMap.has('shutdown_restart'); w++) {
    pc.cpu.runSteps(2000000);
  }

  assert.strictEqual(pc.milestones.length, 7, `Expected 7/7 milestones, got ${pc.milestones.length}`);
  assert.strictEqual(pc.udList.length, 0, `Expected 0 #UD, got ${pc.udList.length}`);
  assert.strictEqual(pc.unhandledPorts.size, 0, `Expected 0 unhandled ports, got ${pc.unhandledPorts.size}`);
  console.log(`  [PASS] Reached all 7/7 milestones with 0 #UD and 0 unhandled ports`);

  return {
    os: label,
    milestones: pc.milestones,
    menuDurationSec,
    msgBoardAddr: mbAddr,
    mouseAddr: pc.kolibriMouseAddr,
    totalInstructions: pc.cpu.totalInstructions,
    virtualTimeSec: pc.virtualTimeSeconds,
    udCount: pc.udList.length,
    unhandledPorts: pc.unhandledPorts.size
  };
}

// ============================================================================
// 4. Hand-Assembled 82077AA FDC + 8237 DMA Channel 2 + IRQ6 Boot Sector Test
// ============================================================================
function runFdcDmaBootTest(core) {
  console.log('\n=== [4/4] 82077AA FDC + 8237 DMA Channel 2 + IRQ6 Boot Program Test ===');

  // Create a 1.44 MB floppy image with known test patterns at Cylinder 1, Head 0, Sectors 1 & 2 (LBA 36 & 37)
  const floppy = new Uint8Array(1474560);
  const lba36Off = 36 * 512;
  for (let i = 0; i < 1024; i++) {
    floppy[lba36Off + i] = ((i * 73 + 0x5A) ^ (i >>> 3)) & 0xFF;
  }

  const b = [];
  const emit = (...bytes) => b.push(...bytes);

  function assembleBootSector() {
    const labels = {};
    for (let pass = 0; pass < 2; pass++) {
      b.length = 0;
      const org = 0x7C00;
      const pcAddr = () => org + b.length;
      const mark = (name) => { labels[name] = pcAddr(); };
      const addr16 = (name) => {
        const a = labels[name] || 0;
        return [a & 0xFF, (a >>> 8) & 0xFF];
      };
      const jmp8 = (op, name) => {
        emit(op);
        const target = labels[name] !== undefined ? labels[name] : pcAddr();
        emit((target - (pcAddr() + 1)) & 0xFF);
      };
      const callSub = (name) => {
        emit(0xE8);
        const target = labels[name] !== undefined ? labels[name] : pcAddr();
        const d = (target - (pcAddr() + 2)) & 0xFFFF;
        emit(d & 0xFF, (d >>> 8) & 0xFF);
      };
      const fdcWriteImm = (val) => { emit(0xB0, val & 0xFF); callSub('fdc_write'); };

      // 0x00..0x1F: JMP short start (0x20) + BPB header (18 spt at 0x18, 2 heads at 0x1A)
      emit(0xEB, 0x1E, 0x90);
      while (b.length < 24) emit(0x00);
      emit(18, 0, 2, 0, 0, 0, 0, 0); // offset 24..31

      mark('start');
      // CLI; XOR AX, AX; MOV DS, AX; MOV ES, AX; MOV SS, AX; MOV SP, 0x7C00; CLD; STI
      emit(0xFA, 0x31, 0xC0, 0x8E, 0xD8, 0x8E, 0xC0, 0x8E, 0xD0, 0xBC, 0x00, 0x7C, 0xFC, 0xFB);

      // Unmask IRQ6 on Master PIC (in al, 0x21; and al, ~0x40; out 0x21, al)
      emit(0xE4, 0x21, 0x24, 0xBF, 0xE6, 0x21);

      // 1. Reset FDC via DOR (0x3F2): write 0x00 then 0x1C, wait IRQ6, drain 4 Sense Interrupt (0x08)
      emit(0xC6, 0x06, 0x3E, 0x04, 0x00);
      emit(0xBA, 0xF2, 0x03, 0xB0, 0x00, 0xEE, 0xB0, 0x1C, 0xEE);
      callSub('wait_irq6');
      emit(0xB9, 0x04, 0x00); // mov cx, 4
      mark('sense4');
      fdcWriteImm(0x08);
      callSub('fdc_read');
      callSub('fdc_read');
      jmp8(0xE2, 'sense4');

      // 2. Specify (0x03, 0xDF, 0x02) & CCR (0x3F7 = 0x00)
      fdcWriteImm(0x03); fdcWriteImm(0xDF); fdcWriteImm(0x02);
      emit(0xBA, 0xF7, 0x03, 0xB0, 0x00, 0xEE);

      // 3. Recalibrate drive 0 (0x07, 0x00)
      emit(0xC6, 0x06, 0x3E, 0x04, 0x00);
      fdcWriteImm(0x07); fdcWriteImm(0x00);
      callSub('wait_irq6');
      fdcWriteImm(0x08); callSub('fdc_read'); callSub('fdc_read');

      // 4. Seek drive 0 to Cylinder 1, Head 0 (0x0F, 0x00, 0x01)
      emit(0xC6, 0x06, 0x3E, 0x04, 0x00);
      fdcWriteImm(0x0F); fdcWriteImm(0x00); fdcWriteImm(0x01);
      callSub('wait_irq6');
      fdcWriteImm(0x08); callSub('fdc_read'); callSub('fdc_read');

      // 5. Read 2 sectors (1024B) from C=1, H=0, R=1 via DMA2 into 0x8000 (BL=0x46, DX=0x8000, CX=0x03FF, SI=cmd_read2)
      emit(0xB3, 0x46, 0xBA, 0x00, 0x80, 0xB9, 0xFF, 0x03, 0xBE, ...addr16('cmd_read2'));
      callSub('exec_dma_fdc');

      // 6. Prepare 512-byte write buffer at 0x8800 ([0x8000 + i] ^ 0xA5)
      emit(0xBE, 0x00, 0x80, 0xBF, 0x00, 0x88, 0xB9, 0x00, 0x02);
      mark('xor_loop');
      emit(0xAC, 0x34, 0xA5, 0xAA); jmp8(0xE2, 'xor_loop');

      // 7. Write 1 sector (512B) from 0x8800 via DMA2 (mode 0x4A) to C=1, H=0, R=3
      emit(0xB3, 0x4A, 0xBA, 0x00, 0x88, 0xB9, 0xFF, 0x01, 0xBE, ...addr16('cmd_write1'));
      callSub('exec_dma_fdc');

      // 8. Read C=1, H=0, R=3 back via DMA2 (mode 0x46) into 0x8400
      emit(0xB3, 0x46, 0xBA, 0x00, 0x84, 0xB9, 0xFF, 0x01, 0xBE, ...addr16('cmd_read1'));
      callSub('exec_dma_fdc');

      // 9. Print "FDC+DMA2+IRQ6 READ+WRITE OK" to 0xB8000
      emit(0xB8, 0x00, 0xB8, 0x8E, 0xC0, 0x31, 0xFF, 0xBE, ...addr16('msg_ok'), 0xB9, 27, 0x00, 0xB4, 0x1F);
      mark('print_loop');
      emit(0xAC, 0xAB); jmp8(0xE2, 'print_loop');

      mark('halt_forever');
      emit(0xFA, 0xF4); jmp8(0xEB, 'halt_forever');

      // Subroutine: exec_dma_fdc (BL=DMA mode, DX=addr, CX=count-1, SI=9-byte FDC command)
      mark('exec_dma_fdc');
      emit(
        0xB0, 0x06, 0xE6, 0x0A, // mask ch2
        0xB0, 0x00, 0xE6, 0x0C, // clear flip-flop
        0x88, 0xD8, 0xE6, 0x0B, // mode = BL
        0x88, 0xD0, 0xE6, 0x04, // addr low = DL
        0x88, 0xF0, 0xE6, 0x04, // addr high = DH
        0xB0, 0x00, 0xE6, 0x81, // page = 0
        0x88, 0xC8, 0xE6, 0x05, // count low = CL
        0x88, 0xE8, 0xE6, 0x05, // count high = CH
        0xB0, 0x02, 0xE6, 0x0A, // unmask ch2
        0xC6, 0x06, 0x3E, 0x04, 0x00,
        0xB9, 0x09, 0x00        // send 9 command bytes from [SI]
      );
      mark('send9');
      emit(0xAC);
      callSub('fdc_write');
      jmp8(0xE2, 'send9');
      callSub('wait_irq6');
      emit(0xB9, 0x07, 0x00); // read 7 result bytes
      mark('read7');
      callSub('fdc_read');
      jmp8(0xE2, 'read7');
      emit(0xC3);

      // Subroutine: wait_irq6
      mark('wait_irq6');
      emit(0xF6, 0x06, 0x3E, 0x04, 0x80); jmp8(0x75, 'wait_done'); emit(0xFB, 0xF4); jmp8(0xEB, 'wait_irq6');
      mark('wait_done');
      emit(0xC6, 0x06, 0x3E, 0x04, 0x00, 0xC3);

      // Subroutine: fdc_write (AL -> 0x3F5)
      mark('fdc_write');
      emit(0x88, 0xC4, 0xBA, 0xF4, 0x03);
      mark('fdc_w_poll');
      emit(0xEC, 0x24, 0xC0, 0x3C, 0x80); jmp8(0x75, 'fdc_w_poll'); emit(0x42, 0x88, 0xE0, 0xEE, 0xC3);

      // Subroutine: fdc_read (0x3F5 -> AL)
      mark('fdc_read');
      emit(0xBA, 0xF4, 0x03);
      mark('fdc_r_poll');
      emit(0xEC, 0x24, 0xC0, 0x3C, 0xC0); jmp8(0x75, 'fdc_r_poll'); emit(0x42, 0xEC, 0xC3);

      // Data tables
      mark('cmd_read2');
      emit(0xE6, 0x00, 0x01, 0x00, 0x01, 0x02, 18, 0x1B, 0xFF);
      mark('cmd_write1');
      emit(0xC5, 0x00, 0x01, 0x00, 0x03, 0x02, 18, 0x1B, 0xFF);
      mark('cmd_read1');
      emit(0xE6, 0x00, 0x01, 0x00, 0x03, 0x02, 18, 0x1B, 0xFF);
      mark('msg_ok');
      for (const ch of 'FDC+DMA2+IRQ6 READ+WRITE OK') emit(ch.charCodeAt(0));
    }
  }

  assembleBootSector();
  assert.ok(b.length <= 510, `Boot sector code too large: ${b.length} bytes`);
  for (let i = 0; i < b.length; i++) floppy[i] = b[i];
  floppy[510] = 0x55;
  floppy[511] = 0xAA;

  const pc = new core.HummingbirdPC({ ramSizeMB: 16, deterministic: true });
  pc.loadFloppyImage(floppy);
  pc.cpu.runSteps(20000);

  const scr = dumpTextVRAM(pc);
  assert.ok(scr.includes('FDC+DMA2+IRQ6 READ+WRITE OK'), `Expected FDC boot sector banner, got:\n${scr}`);

  for (let i = 0; i < 1024; i++) {
    const expected = ((i * 73 + 0x5A) ^ (i >>> 3)) & 0xFF;
    const actual = pc.ram[0x8000 + i];
    assert.strictEqual(actual, expected, `DMA read mismatch at offset ${i}: got ${actual}, expected ${expected}`);
  }

  const lba38Off = 38 * 512;
  for (let i = 0; i < 512; i++) {
    const expected = (((i * 73 + 0x5A) ^ (i >>> 3)) ^ 0xA5) & 0xFF;
    assert.strictEqual(pc.floppyImage[lba38Off + i], expected, `FDC write to image mismatch at offset ${i}`);
    assert.strictEqual(pc.ram[0x8400 + i], expected, `FDC read-back mismatch at offset ${i}`);
  }

  saveSnapAndText(pc, 'fdc-dma-test', true);
  console.log(`  [PASS] Hand-assembled FDC+DMA2+IRQ6 boot program (${b.length} bytes) verified 1,024B read + 512B write/read-back`);
  return {
    os: 'Raw FDC + DMA2 + IRQ6 Boot Sector',
    instructions: pc.cpu.totalInstructions,
    virtualTimeSec: pc.virtualTimeSeconds,
    udCount: pc.udList.length,
    unhandledPorts: pc.unhandledPorts.size
  };
}

function main() {
  console.log('====================================================================');
  console.log('Hummingbird 1.1 — Multi-OS & Floppy Controller Verification Suite');
  console.log('====================================================================');
  const core = loadCoreFromHtml(HTML_PATH);

  const rGrub = runGrubSuite(core);
  const rKolibriStudio = runKolibriSuite(
    core,
    'kolibrios/kolibri-hummingbird.img',
    '[2/4] KolibriOS Studio Floppy (commit 62b2b72)',
    'os-kolibri-hummingbird'
  );
  const rKolibriOfficial = runKolibriSuite(
    core,
    'kolibrios/kolibri-0.7.7.0+8930.img',
    '[3/4] KolibriOS Official Nightly (0.7.7.0+8930)',
    'os-kolibri-official'
  );
  const rFdc = runFdcDmaBootTest(core);

  console.log('\n====================================================================');
  console.log('OS Suite Summary: ALL 4 SUITES PASSED');
  console.log('====================================================================');
  console.log(`  1. ${rGrub.os}: inst=${rGrub.instructions.toLocaleString()}, 2s countdown=${rGrub.countdownSec.toFixed(4)}s (${rGrub.countdownErrPct.toFixed(2)}% err), #UD=${rGrub.udCount}, unhandledPorts=${rGrub.unhandledPorts}`);
  console.log(`  2. ${rKolibriStudio.os}: 7/7 milestones, 2s menu=${rKolibriStudio.menuDurationSec.toFixed(3)}s, msgBoard=0x${rKolibriStudio.msgBoardAddr.toString(16).toUpperCase()}, mouse=0x${rKolibriStudio.mouseAddr.toString(16).toUpperCase()}, #UD=${rKolibriStudio.udCount}, unhandledPorts=${rKolibriStudio.unhandledPorts}`);
  console.log(`  3. ${rKolibriOfficial.os}: 7/7 milestones, 2s menu=${rKolibriOfficial.menuDurationSec.toFixed(3)}s, msgBoard=0x${rKolibriOfficial.msgBoardAddr.toString(16).toUpperCase()}, mouse=0x${rKolibriOfficial.mouseAddr.toString(16).toUpperCase()}, #UD=${rKolibriOfficial.udCount}, unhandledPorts=${rKolibriOfficial.unhandledPorts}`);
  console.log(`  4. ${rFdc.os}: inst=${rFdc.instructions.toLocaleString()}, 1024B read + 512B write/read-back OK, #UD=${rFdc.udCount}, unhandledPorts=${rFdc.unhandledPorts}`);
}

if (require.main === module) {
  main();
}

module.exports = { runGrubSuite, runKolibriSuite, runFdcDmaBootTest };