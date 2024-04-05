import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { KVRepository } from "../lib/KVRepository";

async function setup(db: PGlite) {
  await db.exec(`
drop table if exists kvpairs;

create table kvpairs (
  k text primary key,
  v text not null
);

insert into kvpairs
(k,v)
VALUES
('foo','bar'),
('foo2','bar2');
`);
}

let makeDb = (function () {
  let db: PGlite | undefined;

  return async function () {
    if (!db) db = new PGlite();
    await setup(db);
    return db;
  };
})();

// *****************

test(async () => {
  let kvclient = new KVRepository(await makeDb());
  let result = await kvclient.get("foo");
  assert.equal(result, "bar");
});

test(async () => {
  let kvclient = new KVRepository(await makeDb());
  let result = await kvclient.get("foo2");
  assert.equal(result, "bar2");
});

test(async () => {
  let db = await makeDb();
  let kvrepository = new KVRepository(db);
  await kvrepository.set("foo3", "bar3");
  let result = (await db.query("select v from kvpairs where k='foo3'")) as {
    rows: { v: string }[];
  };
  assert.equal(result.rows[0].v, "bar3");
});
