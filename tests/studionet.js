#!/usr/bin/env node
// Hummingbird 1.3: the StudioNet card (ports 0x2A0-0x2AF, IRQ 10).
// Two PCs in one process share the in-memory switch; every check goes through
// the emulated I/O bus (portRead/portWrite) or guest RAM, the same paths a guest uses.
// Cross-tab delivery (BroadcastChannel) only exists in a browser and is checked there.
'use strict';
const path = require('path');
const assert = require('assert');
const { loadCoreFromHtml } = require('./headless.js');

const core = loadCoreFromHtml(path.join(__dirname, '..', 'index.html'));
const mk = () => new core.HummingbirdPC({ ramSizeMB: 16, deterministic: true });
const A = mk(), B = mk();
let pass = 0;
const ok = (name, cond, detail = '') => { assert.ok(cond, name + ' ' + detail); pass++; console.log(`  [PASS] ${name}${detail ? ' — ' + detail : ''}`); };

const rd = (pc, off) => pc.portRead(0x2A0 + off) & 0xFF;
const wr = (pc, off, v) => pc.portWrite(0x2A0 + off, v & 0xFF);
const setNode = (pc, n) => { wr(pc, 4, n); wr(pc, 5, n >> 8); };
const pioSend = (pc, bytes) => { for (const b of bytes) wr(pc, 0x0C, b); wr(pc, 2, 0x01); };
const pioRecv = (pc) => { const len = rd(pc, 6) | (rd(pc, 7) << 8); wr(pc, 2, 0x02); const out = []; for (let i = 0; i < len; i++) out.push(rd(pc, 0x0C)); return out; };

console.log('=== Hummingbird 1.3 StudioNet card (tests/studionet.js) ===');

// 1. Probe: the signature SpiralOS's x86 core checks (in ax, 0x2A0 == 0x4E53).
const sig = rd(A, 0) | (rd(A, 1) << 8);
ok('1. Card answers the probe', sig === 0x4E53, `in ax,0x2A0 = 0x${sig.toString(16)}`);

// 2. Node IDs are settable and readable.
setNode(A, 0x0201); setNode(B, 0x0305);
ok('2. Node IDs', (rd(B, 4) | (rd(B, 5) << 8)) === 0x0305 && (rd(A, 4) | (rd(A, 5) << 8)) === 0x0201);

// 3. PIO broadcast A -> B.
ok('3a. B idle before send', (rd(B, 2) & 1) === 0, `status=0x${rd(B, 2).toString(16)}`);
const frame = [0xFF, 0xFF, 0x01, 0x02, 0x48, 0x49];
pioSend(A, frame);
ok('3b. B sees RX-ready after A broadcasts', (rd(B, 2) & 1) === 1);
const got = pioRecv(B);
ok('3c. Bytes arrive intact', JSON.stringify(got) === JSON.stringify(frame), JSON.stringify(got));
ok('3d. Sender does not hear itself', (rd(A, 2) & 1) === 0);

// 4. Unicast filtering: a frame for 0x0999 must not reach B (0x0305); one for 0x0305 must.
pioSend(A, [0x99, 0x09, 0xAA]);
ok('4a. Frame for another node is dropped', (rd(B, 2) & 1) === 0);
pioSend(A, [0x05, 0x03, 0xBB]);
ok('4b. Frame for B is delivered', (rd(B, 2) & 1) === 1 && pioRecv(B)[2] === 0xBB);

// 5. DMA path: A transmits from its RAM, B receives into its RAM.
const SRC = 0x90000, DST = 0x98000;
const payload = [0x05, 0x03, ...Array.from('hello over dma', c => c.charCodeAt(0))];
payload.forEach((b, i) => A.physWrite8(SRC + i, b));
[SRC & 0xFF, (SRC >> 8) & 0xFF, (SRC >> 16) & 0xFF, SRC >>> 24].forEach((b, i) => wr(A, 8 + i, b));
wr(A, 6, payload.length); wr(A, 7, 0); wr(A, 2, 0x01);
[DST & 0xFF, (DST >> 8) & 0xFF, (DST >> 16) & 0xFF, DST >>> 24].forEach((b, i) => wr(B, 8 + i, b));
wr(B, 2, 0x02);
const dmaGot = Array.from(B.ram.subarray(DST, DST + payload.length));
ok('5. DMA TX from A RAM lands in B RAM', JSON.stringify(dmaGot) === JSON.stringify(payload), String.fromCharCode(...dmaGot.slice(2)));
wr(A, 6, 0); // back to PIO mode

// 6. IRQ 10: raised only when enabled (the disabled case is the control).
B.pic.slave.irr = 0;
pioSend(A, [0x05, 0x03, 0x01]);
ok('6a. IRQ disabled: no IRQ 10 request', (B.pic.slave.irr & 0x04) === 0);
pioRecv(B);
wr(B, 2, 0x04);
ok('6b. Status shows IRQ enabled', (rd(B, 2) & 0x08) === 0x08);
pioSend(A, [0x05, 0x03, 0x02]);
ok('6c. IRQ enabled: IRQ 10 requested on the slave PIC', (B.pic.slave.irr & 0x04) === 0x04);

// 7. Reset command restores the default node ID and clears IRQ enable.
wr(B, 2, 0x03);
ok('7. CMD_RESET', (rd(B, 2) & 0x08) === 0 && (rd(B, 4) | (rd(B, 5) << 8)) === 0x0201);

console.log(`\n${pass}/${pass} StudioNet checks passed.`);
