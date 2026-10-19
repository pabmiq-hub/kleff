"""Regression for ordered character imports through the application's database API."""
import os
import unittest
import uuid

import requests


class CharacterImportOrder(unittest.TestCase):
    def test_import_preserves_character_order(self):
        url = os.environ.get("APP_SUPABASE_URL")
        key = os.environ.get("APP_SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            self.skipTest("Own database connection is required")
        api = url.rstrip("/") + "/rest/v1"
        headers = {"apikey": key, "Authorization": "Bearer " + key, "Prefer": "return=representation"}
        game_id = str(uuid.uuid4())
        result = requests.post(api + "/mm_games", headers=headers, json={
            "id": game_id, "slug": "test-order-" + game_id,
            "title": "Prueba aislada del importador", "min_players": 2, "max_players": 3,
        }, timeout=30)
        self.assertEqual(result.status_code, 201, "Temporary game creation must succeed")
        try:
            result = requests.post(api + "/mm_characters", headers=headers, json=[
                {"game_id": game_id, "ref": ref, "name": ref, "is_killer": i == 0, "sort_order": i}
                for i, ref in enumerate(["essential-a", "essential-b", "optional-c"])
            ], timeout=30)
            self.assertEqual(result.status_code, 201, "Character API must accept sort_order")
            result = requests.get(api + "/mm_characters", headers=headers, params={
                "game_id": "eq." + game_id, "select": "ref,sort_order", "order": "sort_order.asc",
            }, timeout=30)
            self.assertEqual(result.status_code, 200)
            self.assertEqual(result.json(), [
                {"ref": "essential-a", "sort_order": 0},
                {"ref": "essential-b", "sort_order": 1},
                {"ref": "optional-c", "sort_order": 2},
            ])
        finally:
            result = requests.delete(api + "/mm_games", headers=headers, params={"id": "eq." + game_id}, timeout=30)
            self.assertIn(result.status_code, [200, 204], "Temporary game must be removed")


if __name__ == "__main__":
    unittest.main()