import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";

async function setup(db: PGlite) {
  await db.query(`
drop table if exists kvpairs;
`);
  await db.query(`
create table kvpairs (
  k text primary key,
  v text not null
)`);

  await db.query(`
insert into kvpairs
(k,v)
VALUES
('foo','bar'),
('foo2','bar2')
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
    await setup(this.db);
    let result = await this.db.query("select v from kvpairs where k=$1", [k]);
    return (result.rows as any[])[0].v;
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
