// Install PGlite only in a disposable tools directory; never connect these tests to a real project.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
if (!process.env.SECURITY_PGLITE_PATH) throw new Error('Set SECURITY_PGLITE_PATH to an isolated @electric-sql/pglite installation.');
const { PGlite } = require(process.env.SECURITY_PGLITE_PATH);
const db = new PGlite();
const migration = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20261002235125_sync_security.sql'), 'utf8');
before(async () => {
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  await db.exec(migration);
  await db.exec(migration);
});
after(async () => { await db.close(); });
const hash = 'a'.repeat(64), version = 'b'.repeat(64);
const scalar = async (sql, args = []) => (await db.query(sql, args)).rows[0].result;
test('SQL installs idempotently, enforces RLS and denies public table/RPC access', async () => {
  const rows = (await db.query("select relname, relrowsecurity from pg_class where relname in ('sync_sessions','sync_login_attempts')")).rows;
  assert.equal(rows.length, 2); assert.ok(rows.every(row => row.relrowsecurity));
  for (const role of ['anon', 'authenticated']) {
    for (const table of ['sync_sessions', 'sync_login_attempts']) {
      assert.equal(await scalar("select has_table_privilege($1, $2, 'SELECT,INSERT,UPDATE,DELETE') as result", [role, 'public.' + table]), false);
    }
    for (const fn of ['reserve_sync_login_attempt(text)', 'issue_sync_session(text,text,text)', 'validate_sync_session(text,text,text)']) {
      assert.equal(await scalar("select has_function_privilege($1, $2, 'EXECUTE') as result", [role, 'public.' + fn]), false);
    }
  }
  await db.exec('set role anon;');
  await assert.rejects(db.query("select public.reserve_sync_login_attempt('family')"), /permission denied/);
  await db.exec('reset role;');
  const funcs = (await db.query("select prosecdef, proconfig from pg_proc where proname in ('reserve_sync_login_attempt','issue_sync_session','validate_sync_session')")).rows;
  assert.equal(funcs.length, 3); assert.ok(funcs.every(row => !row.prosecdef && row.proconfig.includes('search_path=""')));
});
test('actual login RPC admits ten requests then denies the eleventh and recovers after its window', async () => {
  await db.exec('set role service_role;');
  const calls = await Promise.all(Array.from({ length: 20 }, () => scalar("select public.reserve_sync_login_attempt('budget-family') as result")));
  assert.equal(calls.filter(row => row.allowed).length, 10);
  assert.ok(calls.filter(row => !row.allowed).every(row => row.retry_after >= 1 && row.retry_after <= 300));
  assert.equal(await scalar("select attempts as result from public.sync_login_attempts where workspace_id = 'budget-family'"), 10);
  await db.query("update public.sync_login_attempts set window_started_at = clock_timestamp() - interval '6 minutes' where workspace_id = 'budget-family'");
  assert.equal((await scalar("select public.reserve_sync_login_attempt('budget-family') as result")).allowed, true);
  assert.equal((await scalar("select public.reserve_sync_login_attempt('other-family') as result")).allowed, true);
  await db.exec('reset role;');
});
test('actual session RPC issues a server deadline, enforces workspace/version, revocation and expiry', async () => {
  await db.exec('set role service_role;');
  await db.query('select public.issue_sync_session($1,$2,$3)', ['family', hash, version]);
  const validate = (workspace = 'family', v = version) => scalar('select public.validate_sync_session($1,$2,$3) as result', [workspace, hash, v]);
  assert.equal(await validate(), true); assert.equal(await validate('other'), false);
  assert.equal(await validate('family', 'c'.repeat(64)), false);
  const span = await scalar("select extract(epoch from expires_at - created_at)::integer as result from public.sync_sessions where workspace_id='family'");
  assert.equal(span, 30 * 86400);
  await db.query("delete from public.sync_sessions where workspace_id='family' and token_hash=$1", [hash]);
  assert.equal(await validate(), false);
  await db.query('select public.issue_sync_session($1,$2,$3)', ['family', hash, version]);
  await db.query("update public.sync_sessions set created_at=clock_timestamp() - interval '31 days', expires_at=clock_timestamp() - interval '1 day' where workspace_id='family'");
  assert.equal(await validate(), false);
  await db.query('select public.issue_sync_session($1,$2,$3)', ['family', 'd'.repeat(64), version]);
  assert.equal(await scalar("select count(*)::integer as result from public.sync_sessions where workspace_id='family'"), 1);
  await assert.rejects(db.query('select public.issue_sync_session($1,$2,$3)', ['family', 'not-a-hash', version]), /check constraint/);
  await db.exec('reset role;');
});
