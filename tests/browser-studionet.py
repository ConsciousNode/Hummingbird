# Hummingbird 1.3: two real Chromium tabs exchange a StudioNet frame over BroadcastChannel.
# Needs: pip install playwright && python3 -m playwright install chromium. Serves a copy of index.html from /tmp/srv as hb.html.
import asyncio, subprocess, time, sys
from playwright.async_api import async_playwright
srv = subprocess.Popen([sys.executable,'-m','http.server','8765','-d','/tmp/srv'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context()
        errs={'A':[],'B':[]}
        pages={}
        for n in 'AB':
            pg = await ctx.new_page()
            pg.on('pageerror', lambda e,n=n: errs[n].append(str(e)))
            pg.on('console', lambda m,n=n: m.type=='error' and errs[n].append(m.text))
            await pg.goto('http://localhost:8765/hb.html' + ('?node=0x0305' if n=='B' else ''))
            pages[n]=pg
        await asyncio.sleep(4)
        info = {}
        for n,pg in pages.items():
            info[n] = await pg.evaluate("""() => { const s=globalThis.__STUDIONET_SWITCH; const nic=s?[...s.nics][0]:null;
              if(!nic) return {nic:false};
              const h=nic.host; const sig=h.portRead(0x2A0)|(h.portRead(0x2A1)<<8);
              return {nic:true, nics:s.nics.size, sig:sig.toString(16), node:nic.nodeId.toString(16), bc:!!nic.bc, bar:!!document.getElementById('studionet-node-id-bar')}; }""")
        # A broadcasts a frame via guest-visible PIO path
        await pages['A'].evaluate("""() => { const h=[...globalThis.__STUDIONET_SWITCH.nics][0].host;
          for (const v of [0xFF,0xFF,0x01,0x02,0x48,0x49]) h.portWrite(0x2AC, v); h.portWrite(0x2A2, 0x01); }""")
        await asyncio.sleep(0.5)
        rx = await pages['B'].evaluate("""() => { const h=[...globalThis.__STUDIONET_SWITCH.nics][0].host;
          const st=h.portRead(0x2A2); const len=h.portRead(0x2A6); h.portWrite(0x2A2,0x02); const out=[]; for(let i=0;i<len;i++) out.push(h.portRead(0x2AC)); return {status:st, len, bytes:out}; }""")
        print('info', info); print('B received', rx); print('errors', errs)
        await b.close()
asyncio.run(main()); srv.terminate()
