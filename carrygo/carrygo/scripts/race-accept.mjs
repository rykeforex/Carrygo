// True concurrency check for job acceptance.
// Two approved, ONLINE collectors fire accept_pickup for the same pickup at the same instant over separate
// HTTP connections. Exactly one must win; the other must get "job_unavailable". Repeats for ROUNDS rounds.
//
// Run against a staging project (it creates real pickups and completes them):
//   SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... CUSTOMER_EMAIL=... CUSTOMER_PASSWORD=... \
//   COLLECTOR1_EMAIL=... COLLECTOR1_PASSWORD=... COLLECTOR2_EMAIL=... COLLECTOR2_PASSWORD=... npm run test:race
import { createClient } from "@supabase/supabase-js";

const need = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "CUSTOMER_EMAIL", "CUSTOMER_PASSWORD", "COLLECTOR1_EMAIL", "COLLECTOR1_PASSWORD", "COLLECTOR2_EMAIL", "COLLECTOR2_PASSWORD"];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) { console.error("Missing env vars:", missing.join(", ")); process.exit(2); }
const rounds = Number(process.env.ROUNDS || 10);

async function login(email, password) {
  const c = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`login failed for ${email}: ${error.message}`);
  return c;
}
const ok = (r, what) => { if (r.error) throw new Error(`${what}: ${r.error.message}`); return r.data; };

const customer = await login(process.env.CUSTOMER_EMAIL, process.env.CUSTOMER_PASSWORD);
const collectors = [await login(process.env.COLLECTOR1_EMAIL, process.env.COLLECTOR1_PASSWORD), await login(process.env.COLLECTOR2_EMAIL, process.env.COLLECTOR2_PASSWORD)];
for (const c of collectors) ok(await c.rpc("set_collector_online", { p_online: true }), "go online");

let failures = 0;
for (let i = 1; i <= rounds; i++) {
  const pk = ok(await customer.rpc("create_pickup", { p_category: "general", p_quantity: 1, p_address: "Race test, Accra", p_lat: 5.6, p_lng: -0.18 }), "create_pickup");
  const results = await Promise.all(collectors.map((c) => c.rpc("accept_pickup", { p_id: pk.id })));
  const winners = results.map((r, idx) => (r.error ? null : idx)).filter((x) => x !== null);
  const losersOk = results.every((r) => !r.error || /job_unavailable/.test(r.error.message));
  if (winners.length !== 1 || !losersOk) {
    failures++;
    console.error(`round ${i}: FAIL winners=${winners.length}`, results.map((r) => r.error?.message || "accepted"));
  } else {
    console.log(`round ${i}: ok (collector ${winners[0] + 1} won, other got job_unavailable)`);
    const w = collectors[winners[0]];
    for (const to of ["en_route", "arrived", "collected", "completed"]) ok(await w.rpc("advance_pickup", { p_id: pk.id, p_to: to }), `advance ${to}`);
  }
}
for (const c of collectors) await c.rpc("set_collector_online", { p_online: false });
console.log(failures === 0 ? `PASS: ${rounds}/${rounds} rounds had exactly one winner` : `FAIL: ${failures}/${rounds} rounds violated exclusivity`);
process.exit(failures === 0 ? 0 : 1);
