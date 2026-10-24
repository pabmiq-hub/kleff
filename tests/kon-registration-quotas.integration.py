"""Current-band quota regression on an isolated event; no email, cleanup in finally.
Run: python3 tests/kon-registration-quotas.integration.py
Requires the project's own APP_SUPABASE_* environment, never managed auth/data.
"""
import asyncio
import os
import uuid
from pathlib import Path
import requests
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"


async def main():
    url = os.environ["APP_SUPABASE_URL"].rstrip("/") + "/rest/v1"
    key = os.environ["APP_SUPABASE_SERVICE_ROLE_KEY"]
    headers = {"apikey": key, "Content-Type": "application/json", "Prefer": "return=minimal"}
    if not key.startswith("sb_"):
        headers["Authorization"] = "Bearer " + key
    event_id = str(uuid.uuid4())

    def write(table, method, body=None, query=""):
        response = requests.request(method, f"{url}/{table}{query}", headers=headers, json=body, timeout=30)
        assert response.ok, f"Temporary test setup/cleanup failed ({response.status_code})"

    try:
        write("kon_events", "POST", {
            "id": event_id, "name": "Prueba temporal de cuotas", "date": "2030-11-01T19:00:00Z",
            "language": "en", "module": "social", "custom_age_ranges": ["33-40", "41+"],
            "custom_genders": ["Hombre", "Mujer", "No binario", "Prefiero no decirlo"],
            "registration_requirements_enabled": True, "quota_waitlist_enabled": False,
            "code_send_mode": "manual", "slot_quotas": [{"gender": "Mujer", "ageRange": "33-40", "maxSlots": 1}],
        })
        write("kon_participants", "POST", {
            "event_id": event_id, "name": "Perfil histórico de prueba", "gender": "Woman",
            "birth_date": "1990-01-01", "age_range": "33-40", "preferred_age_range": "41+",
        })
        # Exactly the change reported: collapse bands while old participant values survive.
        write("kon_events", "PATCH", {
            "custom_age_ranges": ["18+"],
            "slot_quotas": [{"gender": "Mujer", "ageRange": "18+", "maxSlots": 1}],
            "custom_registration_form": {"formMode": "custom", "fields": [
                {"id": "name", "type": "text", "label": "Nombre y apellidos", "required": True, "system": True},
                {"id": "email", "type": "email", "label": "Email", "required": True, "system": True},
                {"id": "phone", "type": "phone", "label": "Teléfono", "required": True, "system": True},
                {"id": "birth_date", "type": "date", "label": "Fecha de nacimiento", "required": True, "system": True},
                {"id": "gender", "type": "select", "label": "Género", "required": True, "system": True, "options": ["Mujer", "Hombre"]},
                {"id": "preference", "type": "select", "label": "Tipo de conexión", "required": True, "system": True, "options": ["Solo amistad"]},
                {"id": "preferred_age_range", "type": "multiselect", "label": "Rango de edad preferido", "required": True, "system": True, "options": ["33-40", "41+"]},
            ]},
        }, f"?id=eq.{event_id}")
        payload = {
            "eventId": event_id, "name": "Nueva inscripción de prueba", "email": f"quota-{event_id}@example.invalid",
            "phone": "600000000", "gender": "Mujer", "birthDate": "1990-01-01",
            "preference": "Solo amistad", "preferredAgeRange": "33-40, 41+",
        }
        response = requests.post(f"{BASE}/api/public/kon/register-participant", json=payload, timeout=30)
        assert response.status_code == 400 and response.json().get("quotaFull") is True, "Historic Woman must consume Mujer quota"
        response = requests.post(f"{BASE}/api/public/kon/check-wrapped-eligibility", json=payload, timeout=30)
        assert response.ok and response.json().get("quotaFull") is True, "Eligibility must agree with registration"

        write("kon_events", "PATCH", {"slot_quotas": [{"gender": "Mujer", "ageRange": "18+", "maxSlots": 2}]}, f"?id=eq.{event_id}")
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=True)
            try:
                for width, height in ((1280, 1800), (360, 760)):
                    page = await browser.new_page(viewport={"width": width, "height": height})
                    errors = []
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    # No test emails: these are separate UI follow-up calls, not registration itself.
                    await page.route("**/api/public/kon/send-*", lambda route: route.fulfill(status=200, json={"success": True}))
                    await page.goto(f"{BASE}/event/{event_id}/join", wait_until="domcontentloaded")
                    await page.locator("form").wait_for(timeout=60000)
                    counts = await page.evaluate("""async id => {
                        const {getKonQuotaAvailability} = await import('/src/lib/kon-public.functions.ts');
                        return getKonQuotaAvailability({data:{eventId:id}});
                    }""", event_id)
                    expected = 1 if width == 1280 else 2
                    assert counts == [{"gender": "Mujer", "ageRange": "18+", "current": expected, "max": 2, "available": 2 - expected}]
                    assert await page.get_by_text("33-40", exact=True).count() == 0
                    assert await page.get_by_text("41+", exact=True).count() == 0
                    assert await page.get_by_text("Rango de edad preferido", exact=True).count() == 0
                    if width == 1280:
                        form = page.locator("form")
                        await form.locator('input[type="text"]').fill(payload["name"])
                        await form.locator('input[type="email"]').fill(payload["email"])
                        await form.locator('input[type="tel"]').fill(payload["phone"])
                        await form.locator('input[type="date"]').fill(payload["birthDate"])
                        await form.get_by_role("combobox").nth(0).click()
                        await page.get_by_role("option", name="Woman", exact=True).click()
                        await form.get_by_role("combobox").nth(1).click()
                        await page.get_by_role("option", name="Friendship only", exact=True).click()
                        await form.get_by_role("checkbox").first.check()
                        reject = page.get_by_role("button", name="Rechazar", exact=True)
                        if await reject.count():
                            await reject.click()
                        await form.get_by_role("button", name="Register", exact=True).click()
                        await page.get_by_text("Registration complete!", exact=True).wait_for(timeout=30000)
                        saved = requests.get(f"{url}/kon_participants", headers=headers, params={"event_id": f"eq.{event_id}", "select": "age_range,preferred_age_range", "email": f"eq.{payload['email']}"}, timeout=30)
                        assert saved.ok and saved.json() == [{"age_range": "18+", "preferred_age_range": "18+"}], "Single current band must read back as 18+ after UI registration"
                    assert not errors, errors
                    screenshots = Path("/tmp/browser/kon-quotas")
                    screenshots.mkdir(parents=True, exist_ok=True)
                    await page.screenshot(path=str(screenshots / f"isolated-{width}.png"))
                    await page.close()
            finally:
                await browser.close()
        print("PASS: historic translated profile fills current quota; registration/eligibility agree; one free place accepted; saved 18+ reads back; desktop/mobile show current form.")
    finally:
        write("kon_participants", "DELETE", query=f"?event_id=eq.{event_id}")
        write("kon_event_waitlist", "DELETE", query=f"?event_id=eq.{event_id}")
        write("kon_events", "DELETE", query=f"?id=eq.{event_id}")


if __name__ == "__main__":
    asyncio.run(main())