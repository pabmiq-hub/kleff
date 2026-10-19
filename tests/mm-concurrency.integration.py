"""Opt-in tests against the own database; isolated fixtures are always removed."""
import concurrent.futures
import json
import os
import subprocess
import unittest
import urllib.parse
import uuid


class AssignmentConcurrency(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        value = os.environ.get("APP_SUPABASE_DATABASE_URL")
        if not value:
            raise unittest.SkipTest("Own database connection is required")
        cls.url = urllib.parse.urlunsplit(urllib.parse.urlsplit(value)._replace(query="sslmode=require"))
        cls.game, cls.session, cls.act, cls.action = [str(uuid.uuid4()) for _ in range(4)]
        cls.players = [str(uuid.uuid4()) for _ in range(2)]
        cls.chars = [str(uuid.uuid4()) for _ in range(2)]
        cls.sql(f"""
          insert into mm_games(id,slug,title,min_players,max_players) values('{cls.game}','test-{cls.game}','Prueba aislada',2,2);
          insert into mm_characters(id,game_id,ref,name,is_killer) values
            ('{cls.chars[0]}','{cls.game}','a','Personaje A',true),('{cls.chars[1]}','{cls.game}','b','Personaje B',false);
          insert into mm_acts(id,game_id,key,name,position,duration_minutes) values('{cls.act}','{cls.game}','act1','Acto de prueba',1,60);
          insert into mm_sessions(id,game_id,name) values('{cls.session}','{cls.game}','Prueba aislada');
          insert into mm_session_players(id,session_id,display_name,access_code) values
            ('{cls.players[0]}','{cls.session}','Prueba A','TEST-{uuid.uuid4()}'),('{cls.players[1]}','{cls.session}','Prueba B','TEST-{uuid.uuid4()}');
          insert into mm_joint_actions(id,game_id,name,requirements,results) values('{cls.action}','{cls.game}','Acción de prueba','[{{"role":"a"}},{{"role":"b"}}]','[]');
        """)

    @classmethod
    def sql(cls, query, allow_error=False):
        result = subprocess.run(["psql", cls.url, "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-c", query], capture_output=True, text=True)
        if result.returncode and not allow_error:
            raise AssertionError(result.stderr.replace(cls.url, "[connection]"))
        return result

    @classmethod
    def tearDownClass(cls):
        cls.sql(f"delete from mm_games where id='{cls.game}'")

    def test_01_simultaneous_release_is_single_and_unique(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(lambda _: json.loads(self.sql(f"select mm_assign_characters('{self.session}','release')").stdout), range(8)))
        self.assertEqual(sum(not r["already"] for r in results), 1)
        self.assertEqual(self.sql(f"select count(distinct character_id) from mm_session_players where session_id='{self.session}'").stdout.strip(), "2")
        self.assertEqual(self.sql(f"select count(*) from mm_session_players where session_id='{self.session}' and character_id='{self.chars[0]}'").stdout.strip(), "1")
        before = self.sql(f"select id,character_id from mm_session_players where session_id='{self.session}' order by id").stdout
        self.sql(f"select mm_assign_characters('{self.session}','release')")
        self.assertEqual(self.sql(f"select id,character_id from mm_session_players where session_id='{self.session}' order by id").stdout, before)

    def test_02_duplicate_direct_assignment_is_rejected(self):
        char = self.sql(f"select character_id from mm_session_players where id='{self.players[0]}'").stdout.strip()
        result = self.sql(f"update mm_session_players set character_id='{char}' where id='{self.players[1]}'", allow_error=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("mm_players_unique_character", result.stderr)

    def test_03_joint_reversal_and_completed_replay_are_rejected(self):
        self.sql(f"update mm_sessions set status='running',current_act_id='{self.act}' where id='{self.session}'")
        def propose(actor, target):
            plan = json.dumps(dict(kind="joint", source_id=self.action, joint_id=self.action, targets=[target], act_id=self.act, resources=[], results=[], unlocks=[]))
            return self.sql(f"select mm_commit_interaction('{self.session}','{actor}','propose',null,'{plan}'::jsonb)", allow_error=True)
        original = propose(*self.players)
        self.assertEqual(original.returncode, 0)
        pending = propose(*reversed(self.players))
        self.assertNotEqual(pending.returncode, 0)
        self.assertIn("pendiente o completada", pending.stderr)
        request = original.stdout.strip()
        self.sql(f"select mm_commit_interaction('{self.session}','{self.players[1]}','accept','{request}','{{}}')")
        self.assertEqual(self.sql(f"select status from mm_action_requests where id='{request}'").stdout.strip(), "completed")
        for actor, target in [self.players, list(reversed(self.players))]:
            self.assertNotEqual(propose(actor, target).returncode, 0)
        self.assertEqual(self.sql(f"select count(*) from mm_action_requests where session_id='{self.session}'").stdout.strip(), "1")


if __name__ == "__main__":
    unittest.main()