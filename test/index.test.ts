import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";

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

class KVClient {
  db: PGlite;

  constructor(db: PGlite) {
    this.db = db;
  }

  async get(k: string) {
    // FIXME
    await setup(this.db);
    let result = await this.db.query("select v from kvpairs where k=$1", [k]);
    return (result.rows as any[])[0].v;
  }

  async set(k: string, v: string) {
    await setup(this.db);
    await this.db.query("insert into kvpairs (k,v) VALUES ($1,$2)", [k, v]);
  }
}

// *****************

test(async () => {
  let kvclient = new KVClient(await makeDb());
  let result = await kvclient.get("foo");
  assert.equal(result, "bar");
});

test(async () => {
  let kvclient = new KVClient(await makeDb());
  let result = await kvclient.get("foo2");
  assert.equal(result, "bar2");
});

test(async () => {
  let db = await makeDb();
  let kvclient = new KVClient(db);
  await kvclient.set("foo3", "bar3");
  let result = (await db.query("select v from kvpairs where k='foo3'")) as any;
  assert.equal(result.rows[0].v, "bar3");
});
