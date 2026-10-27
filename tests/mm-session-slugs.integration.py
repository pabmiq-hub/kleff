"""Opt-in integration rules on the active database, with isolated fixtures."""
import os, subprocess, unittest, urllib.parse, uuid
class SessionSlugs(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        value = os.environ.get('APP_SUPABASE_DATABASE_URL')
        if not value: raise unittest.SkipTest('Own database connection required')
        cls.url = urllib.parse.urlunsplit(urllib.parse.urlsplit(value)._replace(query='sslmode=require'))
        cls.game, cls.one, cls.two = [str(uuid.uuid4()) for _ in range(3)]
        cls.sql(f"insert into mm_games(id,slug,title) values('{cls.game}','test-{cls.game}','Prueba aislada'); insert into mm_sessions(id,game_id,name) values('{cls.one}','{cls.game}','Uno'),('{cls.two}','{cls.game}','Dos');")
    @classmethod
    def sql(cls, query, allow_error=False):
        r = subprocess.run(['psql',cls.url,'-X','-qAt','-v','ON_ERROR_STOP=1','-c',query],capture_output=True,text=True)
        if r.returncode and not allow_error: raise AssertionError(r.stderr.replace(cls.url,'[connection]'))
        return r
    @classmethod
    def tearDownClass(cls): cls.sql(f"delete from mm_games where id='{cls.game}'")
    def test_automatic_short_unique_names(self):
        names = self.sql(f"select join_slug from mm_sessions where game_id='{self.game}'").stdout.splitlines()
        self.assertEqual(len(set(names)),2)
        for name in names: self.assertRegex(name,r'^[a-z0-9]{10}$')
    def test_custom_name_preserves_id_and_personal_code(self):
        name = 'dracula-'+self.one[:8]
        code = 'TEST-'+uuid.uuid4().hex[:12].upper()
        self.sql(f"insert into mm_session_players(session_id,display_name,access_code) values('{self.one}','Prueba','{code}'); update mm_sessions set join_slug='{name}' where id='{self.one}'")
        self.assertEqual(self.sql(f"select id from mm_sessions where join_slug='{name}'").stdout.strip(),self.one)
        self.assertEqual(self.sql(f"select access_code from mm_session_players where session_id='{self.one}'").stdout.strip(),code)
    def test_duplicate_is_blocked_by_database(self):
        name=self.sql(f"select join_slug from mm_sessions where id='{self.one}'").stdout.strip()
        self.assertNotEqual(self.sql(f"update mm_sessions set join_slug='{name}' where id='{self.two}'",True).returncode,0)
    def test_invalid_name_is_blocked(self):
        self.assertNotEqual(self.sql(f"update mm_sessions set join_slug='../admin' where id='{self.two}'",True).returncode,0)
    def test_existing_sessions_have_names(self):
        self.assertEqual(self.sql('select count(*) from mm_sessions where join_slug is null').stdout.strip(),'0')
if __name__ == '__main__': unittest.main()