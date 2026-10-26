import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1280, 'height': 800}, color_scheme='dark')
        await pg.goto('http://localhost:8787/'); await pg.evaluate("localStorage.setItem('c2i-lang','ha')"); await pg.reload(); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='docs/screenshot-hausa-landing.png')
        await pg.click('[data-test=open-app]'); await pg.click('[data-test=sample]'); await pg.click('[data-test=extract]')
        await pg.wait_for_selector('[data-test=preview]', timeout=30000); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='docs/screenshot-hausa-dashboard.png')
        await pg.click('[data-test=ui-lang]'); await pg.wait_for_timeout(500); await pg.screenshot(path='docs/screenshot-language-switcher.png', clip={'x': 640, 'y': 0, 'width': 640, 'height': 520})
        await b.close()
asyncio.run(main())
