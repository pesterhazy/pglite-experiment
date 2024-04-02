import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";

let db: PGlite | undefined;

test(async () => {
  if (!db) db = new PGlite();
  let result = (await db.query("select 1 as v;")) as any;
  assert.equal(result.rows[0].v, 1);
});
