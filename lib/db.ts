import { Pool } from "pg";

declare global {
  var postgresPool: Pool | undefined;
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("The database is not configured. Set DATABASE_URL on the server.");
    this.name = "DatabaseNotConfiguredError";
  }
}

export function getDatabasePool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new DatabaseNotConfiguredError();
  }

  if (!globalThis.postgresPool) {
    globalThis.postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    globalThis.postgresPool.on("error", (error) => {
      console.error("Unexpected PostgreSQL pool error:", error);
    });
  }

  return globalThis.postgresPool;
}
