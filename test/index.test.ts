import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";

class KVClient {
  db: PGlite;

  constructor(db: PGlite) {
    this.db = db;
  }

  async get(k: string) {
    await this.db.query(`
drop table if exists kvpairs;
`);
    await this.db.query(`
create table kvpairs (
  k text primary key,
  v text not null
)`);

    await this.db.query(`
insert into kvpairs
(k,v)
VALUES
('foo','bar'),
('foo2','bar2')
`);
    let result = await this.db.query("select v from kvpairs where k=$1", [k]);
    return (result.rows as any[])[0].v;
  }
}

// *****************

let globalDb: PGlite | undefined;

test(async () => {
  if (!globalDb) globalDb = new PGlite();
  let kvclient = new KVClient(globalDb);
  let result = await kvclient.get("foo");
  assert.equal(result, "bar");
});

test(async () => {
  if (!globalDb) globalDb = new PGlite();
  let kvclient = new KVClient(globalDb);
  let result = await kvclient.get("foo2");
  assert.equal(result, "bar2");
});
