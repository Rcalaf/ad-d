import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { customizeSettings, presetSettings } from "@dnd/shared";
import { describe, expect, it } from "vitest";
import { openDatabase, SCHEMA_VERSION } from "../src/state/database";
import { GameStore } from "../src/state/games";

/** A clock the tests control, so timestamps are predictable. */
function fakeClock(start = "2026-10-18T10:00:00.000Z") {
  let now = new Date(start);
  return { now: () => now, advance: (ms: number) => (now = new Date(now.getTime() + ms)) };
}

const store = (clock = fakeClock()) => new GameStore(openDatabase(":memory:"), { now: clock.now });

describe("GameStore", () => {
  it("creates a game with its settings and reads it back", () => {
    const games = store();
    const created = games.create({ name: "Friday group", settings: presetSettings("easy") });
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(games.get(created.id)).toEqual(created);
    expect(created).toMatchObject({ name: "Friday group", settings: presetSettings("easy"), createdAt: "2026-10-18T10:00:00.000Z", updatedAt: "2026-10-18T10:00:00.000Z" });
  });

  it("returns undefined for a game that doesn't exist", () => {
    expect(store().get("no-such-game")).toBeUndefined();
  });

  it("lists games, most recently updated first", () => {
    const clock = fakeClock();
    const games = store(clock);
    const a = games.create({ name: "A", settings: presetSettings("easy") });
    clock.advance(1000);
    games.create({ name: "B", settings: presetSettings("medium") });
    clock.advance(1000);
    games.updateSettings(a.id, presetSettings("difficult"));
    expect(games.list().map((g) => g.name)).toEqual(["A", "B"]);
  });

  it("updates settings and the update time, never the creation time", () => {
    const clock = fakeClock();
    const games = store(clock);
    const game = games.create({ name: "A", settings: presetSettings("easy") });
    clock.advance(60_000);
    const changed = customizeSettings(game.settings, { rules: { abilityScoreMethod: "I" } });
    const updated = games.updateSettings(game.id, changed);
    expect(updated.settings.preset).toBe("custom");
    expect(updated.createdAt).toBe(game.createdAt);
    expect(updated.updatedAt).toBe("2026-10-18T10:01:00.000Z");
    expect(games.get(game.id)).toEqual(updated);
  });

  it("refuses invalid settings, and writes nothing", () => {
    const games = store();
    const invalid = presetSettings("easy");
    invalid.rules.weaponSpecialization = true;
    expect(() => games.create({ name: "A", settings: invalid })).toThrow(/specialization/i);
    expect(games.list()).toEqual([]);
  });

  it("refuses an empty name, and an update to a game that doesn't exist", () => {
    const games = store();
    expect(() => games.create({ name: "  ", settings: presetSettings("easy") })).toThrow(/name/i);
    expect(() => games.updateSettings("no-such-game", presetSettings("easy"))).toThrow(/no-such-game/);
  });

  it("reports a damaged game clearly when reading it, naming the game", () => {
    const db = openDatabase(":memory:");
    const games = new GameStore(db);
    const game = games.create({ name: "A", settings: presetSettings("easy") });
    db.prepare("update games set settings = ? where id = ?").run(JSON.stringify({ preset: "easy" }), game.id);
    expect(() => games.get(game.id)).toThrow(new RegExp(`Game ${game.id}.*settings`));
  });
});

describe("GameStore, deleting", () => {
  it("deletes one game, and says whether it existed", () => {
    const games = store();
    const a = games.create({ name: "A", settings: presetSettings("easy") });
    const b = games.create({ name: "B", settings: presetSettings("easy") });
    expect(games.delete(a.id)).toBe(true);
    expect(games.list().map((g) => g.id)).toEqual([b.id]);
    expect(games.delete(a.id)).toBe(false);
  });

  it("clears every game, returning how many were deleted", () => {
    const games = store();
    games.create({ name: "A", settings: presetSettings("easy") });
    games.create({ name: "B", settings: presetSettings("medium") });
    expect(games.clear()).toBe(2);
    expect(games.list()).toEqual([]);
    expect(games.clear()).toBe(0);
  });
});

describe("openDatabase", () => {
  it("creates the tables once, records the schema version, and keeps data across openings", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "games-"));
    try {
      const file = path.join(dir, "games.db");
      const first = openDatabase(file);
      const game = new GameStore(first).create({ name: "Kept", settings: presetSettings("medium") });
      first.close();
      const second = openDatabase(file);
      expect(second.pragma("user_version", { simple: true })).toBe(SCHEMA_VERSION);
      expect(new GameStore(second).get(game.id)?.name).toBe("Kept");
      second.close();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});