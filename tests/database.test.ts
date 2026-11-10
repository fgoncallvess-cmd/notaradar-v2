import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { fresh, emptyGrade } from "../src/lib/data";
// Executes the actual installation SQL in embedded PostgreSQL. auth.uid() is
// simulated with the same per-request claim convention; no cloud credentials.
test("Banco: instalação, RLS, isolamento e revisão concorrente", async (t) => {
  const db = new PGlite();
  const a = "11111111-1111-4111-8111-111111111111",
    b = "22222222-2222-4222-8222-222222222222";
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon; insert into auth.users values ('${a}'),('${b}');`,
  );
  const schema = await readFile(
    new URL("../supabase/schema.sql", import.meta.url),
    "utf8",
  );
  await db.exec(schema);
  await db.exec(schema);
  const data = fresh();
  data.grades["r0:1"] = {
    ...emptyGrade(),
    partial: 6,
    exam: 6,
    extras: [{ id: "one", description: "Trabalho", value: 1 }],
  };
  const payload = JSON.stringify(data);
  async function user(id: string) {
    await db.exec("reset role; set role authenticated;");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  }
  const save = (revision: number) =>
    db.query<{ revision: number }>(
      "select public.save_notaradar_data($1::jsonb,$2::integer) as revision",
      [payload, revision],
    );
  await t.test("Conta A grava e lê seus dados", async () => {
    await user(a);
    assert.equal((await save(0)).rows[0].revision, 1);
    const result = await db.query<{ user_id: string }>(
      "select user_id from public.notaradar_data",
    );
    assert.deepEqual(result.rows, [{ user_id: a }]);
  });
  await t.test("Conta B não lê nem modifica a conta A", async () => {
    await user(b);
    assert.deepEqual(
      (await db.query("select * from public.notaradar_data")).rows,
      [],
    );
    assert.equal(
      (
        await db.query(
          "update public.notaradar_data set revision=9 where user_id=$1 returning user_id",
          [a],
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      () =>
        db.query(
          "insert into public.notaradar_data(user_id,year,payload) values($1,2026,$2::jsonb)",
          [a, payload],
        ),
      /row-level security/,
    );
  });
  await t.test("RPC usa identidade do usuário B", async () => {
    assert.equal((await save(0)).rows[0].revision, 1);
    assert.deepEqual(
      (await db.query("select user_id from public.notaradar_data")).rows,
      [{ user_id: b }],
    );
  });
  await t.test(
    "Usuário não pode transferir registro para outra conta",
    async () => {
      await assert.rejects(
        () =>
          db.query(
            "update public.notaradar_data set user_id=$1 where user_id=$2",
            [a, b],
          ),
        /row-level security/,
      );
    },
  );
  await t.test("Revisões obsoletas não sobrescrevem dados", async () => {
    await user(a);
    assert.equal((await save(1)).rows[0].revision, 2);
    await assert.rejects(() => save(1), /revision_conflict/);
    await assert.rejects(() => save(0), /revision_conflict/);
    assert.equal(
      (
        await db.query<{ revision: number }>(
          "select revision from public.notaradar_data",
        )
      ).rows[0].revision,
      2,
    );
  });
  await t.test("Payload com ano ou versão incorreta é recusado", async () => {
    await assert.rejects(
      () =>
        db.query("select public.save_notaradar_data($1::jsonb,2)", [
          JSON.stringify({ ...data, year: 2027 }),
        ]),
      /invalid_payload/,
    );
  });
  await t.test("Visitante anônimo não lê nem grava", async () => {
    await db.exec("reset role; set role anon;");
    await assert.rejects(
      () => db.query("select * from public.notaradar_data"),
      /permission denied/,
    );
    await assert.rejects(() => save(0), /permission denied/);
  });
  await db.close();
});
