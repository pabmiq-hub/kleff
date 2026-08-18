import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright
S=Path(__file__).parent/"shots"; S.mkdir(exist_ok=True)
async def main():
    with open(os.path.expanduser("~/.cache/lovable-auth/session.json")) as f: m=json.load(f)
    async with async_playwright() as p:
        b=await p.chromium.launch(headless=True)
        c=await b.new_context(viewport={"width":1280,"height":1800})
        pg=await c.new_page()
        errs=[]; pg.on("console", lambda x: errs.append(x.text) if x.type=="error" else None)
        cs=m["cookies"]
        for x in cs: x["url"]="http://localhost:8080"
        await c.add_cookies(cs)
        await pg.goto("http://localhost:8080")
        await pg.evaluate(f"window.localStorage.setItem({json.dumps(m['storage_key'])}, {json.dumps(json.dumps(m['session']))})")
        await pg.goto("http://localhost:8080/app", wait_until="networkidle"); await pg.wait_for_timeout(4000)
        await pg.screenshot(path=str(S/"home.png")); print("home", pg.url)
        await pg.goto("http://localhost:8080/app/insignias", wait_until="networkidle"); await pg.wait_for_timeout(4000)
        await pg.screenshot(path=str(S/"badges.png")); print("badges", pg.url)
        print("errors", errs[:6])
        await b.close()
asyncio.run(main())
