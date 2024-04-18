import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { PGlite, Results } from "@electric-sql/pglite";
import { KVRepository, DB } from "../lib/KVRepository";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import pg from "pg";

class TempDb {
  container: any;
  client: any;
  constructor() {}

  async create() {
    this.container = await new PostgreSqlContainer().start();
    this.client = new pg.Client({
      host: this.container.getHost(),
      port: this.container.getPort(),
      database: this.container.getDatabase(),
      user: this.container.getUsername(),
      password: this.container.getPassword(),
    });
    await this.client.connect();
  }

  async [Symbol.asyncDispose]() {
    if (this.client) await this.client.end();
    if (this.container) await this.container.stop();
  }

  async query(...args: any) {
    if (!this.client) throw "Not created yet";
    return await this.client.query(...args);
  }
}

async function setup(db: DB) {
  await db.query(`
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

// *****************

let globalTempDb: TempDb | undefined;

before(async () => {
  globalTempDb = new TempDb();
  await globalTempDb.create();
});

after(async () => {
  if (globalTempDb) await globalTempDb[Symbol.asyncDispose]();
});

async function getDb() {
  if (!globalTempDb) throw Error("Not initialized");

  await setup(globalTempDb);
  return globalTempDb;
}

test(async () => {
  let kvclient = new KVRepository(await getDb());
  let result = await kvclient.get("foo");
  assert.equal(result, "bar");
});

test(async () => {
  let kvclient = new KVRepository(await getDb());
  let result = await kvclient.get("foo2");
  assert.equal(result, "bar2");
});

test(async () => {
  let kvclient = new KVRepository(await getDb());
  let result = await kvclient.get("does_not_exist");
  assert.equal(result, undefined);
});
