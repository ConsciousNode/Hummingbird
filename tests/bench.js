#!/usr/bin/env node
// ============================================================================
// Hummingbird 1.1 — Performance Benchmark Suite (tests/bench.js)
//
// Measures instruction throughput (MIPS = millions of instructions retired per
// wall-clock second) across three workloads on KolibriOS:
//   1. Boot to desktop (0 -> Milestone 4 `desktop_drawn`, 325.00M instructions)
//   2. Idle desktop (50.00M instructions of desktop event loop / scheduler)
//   3. App demo (launching TINYPAD, CALC+, TETRIS, typing/computing/dragging,
//      and opening the Shutdown menu, ~200M instructions)
// Each workload is measured with Basic-Block Cache ON (`useBlockCache = true`)
// and Basic-Block Cache OFF (`useBlockCache = false`).
//
// Usage:
//   node tests/bench.js [path/to/kolibri.img]
// ============================================================================

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { loadCoreFromHtml } = require('./headless.js');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'index.html');

function resolveImagePath(argPath) {
  const candidates = [
    argPath,
    path.join(ROOT_DIR, 'kolibrios', 'kolibri-hummingbird.img'),
    path.join(ROOT_DIR, 'kolibrios', 'kolibri-0.7.7.0+8930.img')
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(`Floppy image not found. Tried: ${candidates.join(', ')}`);
}

function runAppDemoSequence(pc) {
  if (pc.hasFloppyFile('SHELL')) {
    pc.moveMouseTo(836, 160);
    pc.clickMouse(true);
    pc.cpu.runSteps(22000000);
    for (const sc of [0x2F, 0x12, 0x13, 0x1C]) pc.pressKeyScancode(sc, 600000);
    pc.cpu.runSteps(6000000);
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
  }
  if (pc.hasFloppyFile('CALC') || pc.hasFloppyFile('CALCPLUS')) {
    pc.moveMouseTo(236, 28);
    pc.clickMouse(false);
    pc.cpu.runSteps(2000000);
    pc.clickMouse(true);
    pc.cpu.runSteps(14000000);
    for (const sc of [0x07, 0x37, 0x08, 0x1C]) pc.pressKeyScancode(sc, 800000);
    pc.cpu.runSteps(4000000);
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
  }
}

function benchmarkSuite(core, imgBytes) {
  // Warm up V8 JIT with a quick boot pass so both Cache ON and Cache OFF are measured in steady state
  {
    const warmPC = new core.HummingbirdPC({ ramSizeMB: 64, deterministic: true });
    warmPC.cpu.useBlockCache = true;
    warmPC.loadFloppyImage(imgBytes);
    while (!warmPC.milestoneMap.has('desktop_drawn')) {
      warmPC.cpu.runSteps(1000000);
    }
  }

  const results = {};

  for (const useCache of [true, false]) {
    const modeKey = useCache ? 'cacheOn' : 'cacheOff';
    const pc = new core.HummingbirdPC({ ramSizeMB: 64, deterministic: true });
    pc.cpu.useBlockCache = useCache;
    pc.loadFloppyImage(imgBytes);

    // 1. Boot to desktop
    const tBoot0 = performance.now();
    while (!pc.milestoneMap.has('desktop_drawn') && pc.cpu.totalInstructions < 360000000) {
      pc.cpu.runSteps(1000000);
    }
    const bootSec = (performance.now() - tBoot0) / 1000;
    const bootInst = pc.cpu.totalInstructions;
    const bootMips = (bootInst / 1e6) / bootSec;
    const bootHitPct = bootInst > 0 ? ((pc.cpu.basicBlockInstrs / bootInst) * 100) : 0;

    // 2. Idle desktop (50,000,000 instructions)
    // Discover mouse address once before timing idle vs app demo if needed
    const idleInst = 50000000;
    const bbBeforeIdle = pc.cpu.basicBlockInstrs;
    const tIdle0 = performance.now();
    pc.cpu.runSteps(idleInst);
    const idleSec = (performance.now() - tIdle0) / 1000;
    const idleMips = (idleInst / 1e6) / idleSec;
    const idleHitPct = ((pc.cpu.basicBlockInstrs - bbBeforeIdle) / idleInst) * 100;

    // 3. App demo (TINYPAD, CALC+, TETRIS)
    const instBeforeApp = pc.cpu.totalInstructions;
    const bbBeforeApp = pc.cpu.basicBlockInstrs;
    const tApp0 = performance.now();
    runAppDemoSequence(pc);
    const appSec = (performance.now() - tApp0) / 1000;
    const appInst = pc.cpu.totalInstructions - instBeforeApp;
    const appMips = (appInst / 1e6) / appSec;
    const appHitPct = ((pc.cpu.basicBlockInstrs - bbBeforeApp) / appInst) * 100;

    results[modeKey] = {
      boot: { inst: bootInst, sec: bootSec, mips: bootMips, hitPct: bootHitPct },
      idle: { inst: idleInst, sec: idleSec, mips: idleMips, hitPct: idleHitPct },
      app:  { inst: appInst,  sec: appSec,  mips: appMips,  hitPct: appHitPct }
    };
  }

  return results;
}

function formatRow(name, onObj, offObj) {
  const speedup = onObj.mips / offObj.mips;
  return `| ${name.padEnd(20, ' ')} | ${(onObj.inst / 1e6).toFixed(2).padStart(7, ' ')}M | ${onObj.mips.toFixed(2).padStart(9, ' ')} MIPS (${onObj.sec.toFixed(2)}s, ${onObj.hitPct.toFixed(1)}% BB) | ${offObj.mips.toFixed(2).padStart(9, ' ')} MIPS (${offObj.sec.toFixed(2)}s) | ${speedup.toFixed(2)}x |`;
}

function main() {
  const imgPath = resolveImagePath(process.argv[2]);
  const imgBytes = new Uint8Array(fs.readFileSync(imgPath));
  const core = loadCoreFromHtml(HTML_PATH);

  console.log('==========================================================================================');
  console.log('Hummingbird 1.1 — Emulation Throughput Benchmark (tests/bench.js)');
  console.log(`Image   : ${imgPath}`);
  console.log(`Runtime : Node.js ${process.version} (V8 ${process.versions.v8})`);
  console.log('==========================================================================================\n');

  const res = benchmarkSuite(core, imgBytes);

  console.log('| Workload             |   Instrs | Block Cache ON                   | Block Cache OFF          | Speedup |');
  console.log('|----------------------|----------|----------------------------------|--------------------------|---------|');
  console.log(formatRow('1. Boot to desktop', res.cacheOn.boot, res.cacheOff.boot));
  console.log(formatRow('2. Idle desktop',    res.cacheOn.idle, res.cacheOff.idle));
  console.log(formatRow('3. App demo',        res.cacheOn.app,  res.cacheOff.app));
  console.log('');
}

if (require.main === module) {
  main();
}

module.exports = { benchmarkSuite };