#!/usr/bin/env python3
"""Integration test: public join link (mm_join_session) against the real DB.

Creates a temp game + session, exercises the open-join rules, and cleans up.
Rules verified (from the feature spec):
  1. Join is rejected while the link is closed (join_enabled = false).
  2. With the link open, a player self-registers and gets a row + registered invitation.
  3. The same email cannot join twice (case-insensitive).
  4. Capacity is capped at min(max_players, playable characters).
  5. Join is rejected once the session leaves the lobby.
"""
import os, subprocess, sys, uuid

url = os.environ.get("APP_SUPABASE_DATABASE_URL")
if not url:
    sys.exit("APP_SUPABASE_DATABASE_URL not set")

def sql(q):
    r = subprocess.run(
        ["psql", url, "-v", "ON_ERROR_STOP=1", "-tA", "-c", q],
        capture_output=True, text=True, env={**os.environ, "PGSSLMODE": "require"},
    )
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip())
    return r.stdout.strip()

game_id, session_id = str(uuid.uuid4()), str(uuid.uuid4())
try:
    sql(f"""
      INSERT INTO mm_games (id, slug, title, min_players, max_players, duration_minutes, status)
      VALUES ('{game_id}', 'test-join-{game_id[:8]}', 'Test join', 1, 2, 30, 'draft');
      INSERT INTO mm_characters (game_id, ref, name, sort_order) VALUES
        ('{game_id}', 'a', 'A', 0), ('{game_id}', 'b', 'B', 1), ('{game_id}', 'c', 'C', 2);
      INSERT INTO mm_sessions (id, game_id, name) VALUES ('{session_id}', '{game_id}', 'Test join session');
    """)

    def join(name, email, expect_error=None):
        out = sql(f"SELECT public.mm_join_session('{session_id}', '{name}', '{email}', 'TEST-0001');")
        if expect_error is None:
            uuid.UUID(out)  # must return a player id
        else:
            raise AssertionError(f"expected error {expect_error!r}, got {out!r}")

    def join_error(name, email):
        r = subprocess.run(
            ["psql", url, "-tA", "-c", f"SELECT public.mm_join_session('{session_id}', '{name}', '{email}', 'TEST-0002');"],
            capture_output=True, text=True, env={**os.environ, "PGSSLMODE": "require"},
        )
        assert r.returncode != 0, "expected the join to fail"
        return r.stderr

    # 1. closed link rejects
    err = join_error("Uno", "uno@test.dev")
    assert "cerradas" in err, err
    print("1. closed link rejected: OK")

    sql(f"UPDATE mm_sessions SET join_enabled = true WHERE id = '{session_id}';")

    # 2. open link registers
    join("Uno", "uno@test.dev")
    row = sql(f"SELECT i.source, i.status, p.display_name FROM mm_invitations i JOIN mm_session_players p ON p.invitation_id = i.id WHERE p.email = 'uno@test.dev';")
    assert row == "link|registered|Uno", row
    print("2. self-registration with registered invitation: OK")

    # 3. duplicate email (different case) rejected
    err = join_error("Otro", "UNO@test.dev")
    assert "Ya estás apuntado" in err, err
    print("3. duplicate email rejected: OK")

    # 4. capacity = min(max_players=2, playable=3) -> one more allowed, then full
    join("Dos", "dos@test.dev")
    err = join_error("Tres", "tres@test.dev")
    assert "completa" in err, err
    print("4. capacity cap enforced: OK")

    # 5. started session rejects joins
    sql(f"UPDATE mm_sessions SET status = 'running' WHERE id = '{session_id}';")
    sql(f"DELETE FROM mm_session_players WHERE session_id = '{session_id}' AND email = 'dos@test.dev';")
    err = join_error("Tres", "tres@test.dev")
    assert "comenzado" in err, err
    print("5. started session rejects joins: OK")

    print("ALL OPEN-JOIN TESTS PASSED")
finally:
    sql(f"DELETE FROM mm_games WHERE id = '{game_id}';")  # cascades to session/players/invitations/characters
