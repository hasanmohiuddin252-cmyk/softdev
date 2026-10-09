import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const nextEnv = createRequire(import.meta.url)("@next/env");
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to run database migrations.");
  process.exitCode = 1;
} else {
  const pool = new Pool({ connectionString: databaseUrl });
  const scriptDirectory = dirname(fileURLToPath(import.meta.url));
  const migrationsDirectory = join(scriptDirectory, "..", "db", "migrations");
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((file) => /^\d+_.+\.sql$/.test(file))
      .sort();

    for (const migrationFile of migrationFiles) {
      const alreadyApplied = await client.query(
        "SELECT 1 FROM schema_migrations WHERE name = $1",
        [migrationFile],
      );
      if (alreadyApplied.rowCount) {
        console.log(`Already applied: ${migrationFile}`);
        continue;
      }

      const migrationSql = await readFile(
        join(migrationsDirectory, migrationFile),
        "utf8",
      );
      await client.query("BEGIN");
      try {
        await client.query("SELECT pg_advisory_xact_lock(684271903)");
        const migrationCheck = await client.query(
          "SELECT 1 FROM schema_migrations WHERE name = $1",
          [migrationFile],
        );

        if (!migrationCheck.rowCount) {
          await client.query(migrationSql);
          await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
            migrationFile,
          ]);
        }

        await client.query("COMMIT");
        console.log(`Applied: ${migrationFile}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } catch (error) {
    console.error("Database migration failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}
