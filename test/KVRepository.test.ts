import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { PGlite, Results } from "@electric-sql/pglite";
import { KVRepository, DB } from "../lib/KVRepository";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import pg from "pg";

type TestDB = {
  create(): Promise<void>;
  query(...args: any): Promise<any>;
  [Symbol.asyncDispose](): Promise<any>;
};

class ContainerTestDB {
  private container: any;
  private client: any;

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

class InProcessTestDB {
  private pglite: any;

  constructor() {
    this.pglite = new PGlite();
  }

  async create() {}

  async [Symbol.asyncDispose]() {}

  async query(...args: any) {
    return await this.pglite.query(...args);
  }
}

async function setup(db: DB) {
  await db.query(`drop table if exists kvpairs;`);
  await db.query(`
create table kvpairs (
  k text primary key,
  v text not null
);`);

  await db.query(`
insert into kvpairs
(k,v)
VALUES
('foo','bar'),
('foo2','bar2');
`);
}

// *****************

const TEST_DB_TYPE = InProcessTestDB;
// const TEST_DB_TYPE = ContainerTestDB;

let globalTestDB: TestDB | undefined;

before(async () => {
  globalTestDB = new TEST_DB_TYPE();
  await globalTestDB.create();
});

after(async () => {
  if (globalTestDB) await globalTestDB[Symbol.asyncDispose]();
});

async function getDb() {
  if (!globalTestDB) throw Error("Not initialized");

  await setup(globalTestDB);
  return globalTestDB;
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

test(async () => {
  let kvclient = new KVRepository(await getDb());
  for (let i = 0; i < 100; i++) {
    let result = await kvclient.get("foo2");
    assert.equal(result, "bar2");
  }
});
