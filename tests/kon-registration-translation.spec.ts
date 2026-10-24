import { expect, test, type Locator } from "@playwright/test";

const baseUrl = "http://localhost:8080";
const signup = "/slow-friending-eng-oct-26/registro";

// Model Chrome Translate replacing text with nested font elements. Do not
// monkey-patch DOM methods: the real React/Radix updates must succeed unaided.
async function simulateTranslation(target: Locator) {
  await target.evaluate((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const texts: Node[] = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    for (const text of texts) {
      if (!text.textContent?.trim() || !text.parentNode) continue;
      const outer = document.createElement("font");
      const inner = document.createElement("font");
      inner.textContent = text.textContent;
      outer.appendChild(inner);
      text.parentNode.replaceChild(outer, text);
    }
  });
}

for (const viewport of [{ width: 1280, height: 1800 }, { width: 360, height: 627 }]) {
  test(`translated signup preserves canonical selection values at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // This flow deliberately never submits a registration or sends any email.
    await page.route("**/api/public/kon/register-participant", (route) => route.abort());
    await page.goto(`${baseUrl}${signup}`);
    const form = page.locator("form");
    const combos = form.getByRole("combobox");
    await expect(combos).toHaveCount(3, { timeout: 60_000 });
    const [gender, connection, dating] = [combos.nth(0), combos.nth(1), combos.nth(2)];
    await form.locator('input[type="text"]').fill("Prueba de selección");
    await form.locator('input[type="email"]').fill("selection-test@example.invalid");
    await form.locator('input[type="tel"]').fill("600000000");
    await form.locator('input[type="date"]').fill("1990-01-01");

    async function choose(combo: Locator, label: string) {
      await simulateTranslation(combo);
      await combo.click();
      await simulateTranslation(page.getByRole("listbox"));
      await page.getByRole("option", { name: label, exact: true }).click();
      await expect(page.getByText("Something went wrong", { exact: true })).toHaveCount(0);
      await expect(combo).toHaveAttribute("aria-expanded", "false");
    }

    await choose(gender, "Woman");
    await expect(form.locator("select").nth(0)).toHaveValue("Mujer");
    await choose(gender, "Man");
    await expect(form.locator("select").nth(0)).toHaveValue("Hombre");
    await choose(gender, "Woman");

    await choose(connection, "Friendship only");
    await expect(form.locator("select").nth(1)).toHaveValue("Solo amistad");
    await choose(connection, "Friendship & dating");
    await expect(form.locator("select").nth(1)).toHaveValue("Amistad y ligue");
    await choose(dating, "I'm a woman looking for a man");
    await expect(form.locator("select").nth(2)).toHaveValue("Soy una mujer y busco un hombre");
    await choose(dating, "Open to all");
    await expect(form.locator("select").nth(2)).toHaveValue("Estoy abierto a todo");
    await form.getByRole("checkbox").first().check();
    await expect(form.getByRole("checkbox").first()).toBeChecked();
    await expect(form.locator('input[type="text"]')).toHaveValue("Prueba de selección");
    await expect(form.locator('input[type="email"]')).toHaveValue("selection-test@example.invalid");
    expect(errors).toEqual([]);
    await page.screenshot({ path: `/tmp/browser/kon-form/verified-${viewport.width}.png`, fullPage: false });
  });
}