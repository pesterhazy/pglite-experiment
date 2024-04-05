import { PGlite } from "@electric-sql/pglite";

export class KVRepository {
  db: PGlite;

  constructor(db: PGlite) {
    this.db = db;
  }

  async get(k: string) {
    let result = await this.db.query("select v from kvpairs where k=$1", [k]);
    if (result.rows.length === 0) return undefined;
    return (result.rows[0] as any).v;
  }

  async set(k: string, v: string) {
    await this.db.query("insert into kvpairs (k,v) VALUES ($1,$2)", [k, v]);
  }
}
