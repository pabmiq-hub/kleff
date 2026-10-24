"""Public signup regression: translator DOM mutations must not break selections.

Run: python3 tests/kon-registration-translation.integration.py
Uses the real public event, but never submits registrations or sends email.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright


TRANSLATE_TEXT = """el => {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const texts = []; while (walker.nextNode()) texts.push(walker.currentNode);
  for (const text of texts) {
    if (!text.textContent.trim() || !text.parentNode) continue;
    const outer = document.createElement('font');
    const inner = document.createElement('font');
    inner.textContent = text.textContent;
    outer.appendChild(inner);
    text.parentNode.replaceChild(outer, text);
  }
}"""


async def check_viewport(browser, viewport):
    page = await browser.new_page(viewport=viewport)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    await page.route("**/api/public/kon/register-participant", lambda route: route.abort())
    await page.goto("http://localhost:8080/slow-friending-eng-oct-26/registro", wait_until="domcontentloaded")
    form = page.locator("form")
    combos = form.get_by_role("combobox")
    await combos.nth(2).wait_for(timeout=60000)
    assert await combos.count() == 3
    await form.locator('input[type="text"]').fill("Prueba de selección")
    await form.locator('input[type="email"]').fill("selection-test@example.invalid")
    await form.locator('input[type="tel"]').fill("600000000")
    await form.locator('input[type="date"]').fill("1990-01-01")

    async def choose(index, label, canonical):
        combo = combos.nth(index)
        # Translate the current placeholder/selection, and the opened options.
        # No DOM-method patches: React/Radix must handle this themselves.
        await combo.evaluate(TRANSLATE_TEXT)
        await combo.click()
        await page.get_by_role("listbox").evaluate(TRANSLATE_TEXT)
        await page.get_by_role("option", name=label, exact=True).click()
        assert await page.get_by_text("Something went wrong", exact=True).count() == 0
        assert await combo.get_attribute("aria-expanded") == "false"
        assert await form.locator("select").nth(index).input_value() == canonical

    await choose(0, "Woman", "Mujer")
    await choose(0, "Man", "Hombre")
    await choose(0, "Woman", "Mujer")
    await choose(1, "Friendship only", "Solo amistad")
    await choose(1, "Friendship & dating", "Amistad y ligue")
    await choose(2, "I'm a woman looking for a man", "Soy una mujer y busco un hombre")
    await choose(2, "Open to all", "Estoy abierto a todo")
    await form.get_by_role("checkbox").first.check()
    assert await form.get_by_role("checkbox").first.is_checked()
    assert await form.locator('input[type="text"]').input_value() == "Prueba de selección"
    assert await form.locator('input[type="email"]').input_value() == "selection-test@example.invalid"
    assert not errors, errors
    screenshot_dir = Path("/tmp/browser/kon-form")
    screenshot_dir.mkdir(parents=True, exist_ok=True)
    await page.screenshot(path=str(screenshot_dir / f"verified-{viewport['width']}.png"))
    print(f"PASS {viewport['width']}px: translated selections, original values and entered fields preserved")
    await page.close()


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        try:
            for viewport in ({"width": 1280, "height": 1800}, {"width": 360, "height": 627}):
                await check_viewport(browser, viewport)
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(main())