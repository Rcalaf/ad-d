import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type Db = Database.Database;

/**
 * The database schema, as a list of changes. Each database records how many it has applied
 * (SQLite's user_version), so opening it applies the missing ones, in order, exactly once.
 * Never edit a change once released: add a new one at the end.
 */
const MIGRATIONS: string[] = [
  // 1: games, with their settings as JSON validated by GameSettingsSchema on every write and read.
  `CREATE TABLE games (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     settings TEXT NOT NULL,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

/** Opens (or creates) the game database and brings its schema up to date. ":memory:" gives a temporary one, for tests. */
export function openDatabase(file: string): Db {
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("foreign_keys = ON");
  // Write-ahead logging: readers don't block the writer. Only meaningful for a file.
  if (file !== ":memory:") db.pragma("journal_mode = WAL");

  const current = db.pragma("user_version", { simple: true }) as number;
  if (current > SCHEMA_VERSION) {
    db.close();
    throw new Error(`The database ${file} was created by a newer version of this project (schema ${current}, this code knows ${SCHEMA_VERSION}).`);
  }
  // All missing changes in one transaction: either the database is fully updated, or not at all.
  db.transaction(() => {
    for (let version = current; version < SCHEMA_VERSION; version++) db.exec(MIGRATIONS[version]);
    db.pragma(`user_version = ${SCHEMA_VERSION}`);
  })();
  return db;
}