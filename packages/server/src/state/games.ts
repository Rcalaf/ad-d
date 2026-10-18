import { randomUUID } from "node:crypto";
import { GameSettingsSchema, type GameSettings } from "@dnd/shared";
import { z } from "zod";
import type { Db } from "./database";

export interface Game {
  id: string;
  name: string;
  settings: GameSettings;
  /** ISO dates. */
  createdAt: string;
  updatedAt: string;
}

interface GameRow {
  id: string;
  name: string;
  settings: string;
  created_at: string;
  updated_at: string;
}

const NameSchema = z.string().trim().min(1, "A game needs a name.").max(80, "A game name can have at most 80 characters.");

/**
 * Games and their settings. The only code that knows how games are stored: agents call these
 * functions and never see SQL, so the storage could change without changing them.
 * Settings are validated when written and when read, so a damaged row never reaches an agent.
 */
export class GameStore {
  private readonly now: () => Date;

  constructor(
    private readonly db: Db,
    options: { now?: () => Date } = {},
  ) {
    this.now = options.now ?? (() => new Date());
  }

  create(input: { name: string; settings: GameSettings }): Game {
    const name = parseOrThrow(NameSchema, input.name);
    const settings = parseOrThrow(GameSettingsSchema, input.settings);
    const now = this.now().toISOString();
    const game: Game = { id: randomUUID(), name, settings, createdAt: now, updatedAt: now };
    this.db
      .prepare("INSERT INTO games (id, name, settings, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
      .run(game.id, game.name, JSON.stringify(game.settings), game.createdAt, game.updatedAt);
    return game;
  }

  get(id: string): Game | undefined {
    const row = this.db.prepare("SELECT * FROM games WHERE id = ?").get(id) as GameRow | undefined;
    return row && toGame(row);
  }

  /** All games, most recently updated first. */
  list(): Game[] {
    const rows = this.db.prepare("SELECT * FROM games ORDER BY updated_at DESC").all() as GameRow[];
    return rows.map(toGame);
  }

  updateSettings(id: string, settings: GameSettings): Game {
    const valid = parseOrThrow(GameSettingsSchema, settings);
    const result = this.db
      .prepare("UPDATE games SET settings = ?, updated_at = ? WHERE id = ?")
      .run(JSON.stringify(valid), this.now().toISOString(), id);
    if (result.changes === 0) throw new Error(`No game with id ${id}.`);
    return this.get(id)!;
  }

  /** Deletes one game. Returns false when there was no game with that id. */
  delete(id: string): boolean {
    return this.db.prepare("DELETE FROM games WHERE id = ?").run(id).changes > 0;
  }

  /** Deletes every game. Returns how many were deleted. */
  clear(): number {
    return this.db.prepare("DELETE FROM games").run().changes;
  }
}

function toGame(row: GameRow): Game {
  const result = GameSettingsSchema.safeParse(JSON.parse(row.settings));
  if (!result.success) {
    throw new Error(`Game ${row.id} ("${row.name}") has invalid settings in the database: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
  return { id: row.id, name: row.name, settings: result.data, createdAt: row.created_at, updatedAt: row.updated_at };
}

function parseOrThrow<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues.map((i) => i.message).join(" "));
  return result.data;
}