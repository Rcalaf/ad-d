import readline from "node:readline/promises";
import { describeSettings, PRESET_NAMES, presetSettings, type PresetName } from "@dnd/shared";
import { loadSettings } from "../config";
import { openDatabase } from "../state/database";
import { GameStore, type Game } from "../state/games";

const USAGE = `Usage:
  pnpm --filter @dnd/server games                                   list the saved games
  pnpm --filter @dnd/server games create "name" --preset easy       create a game from a preset (${PRESET_NAMES.join(", ")})
  pnpm --filter @dnd/server games show <id>                         show a game's settings
  pnpm --filter @dnd/server games delete <id>                       delete a game, after confirmation
  pnpm --filter @dnd/server games clear                             delete every game, after confirmation`;

/** Lists, creates, shows and deletes games in data/games.db. Deleting asks for a typed yes: it can't be undone. */
async function main() {
  const [command, ...args] = process.argv.slice(2);
  const settings = loadSettings();
  const db = openDatabase(settings.gamesDbPath);
  const games = new GameStore(db);
  try {
    if (!command) return list(games.list());
    if (command === "create") {
      const name = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--preset");
      const preset = args[args.indexOf("--preset") + 1];
      if (!name || !args.includes("--preset") || !PRESET_NAMES.includes(preset as PresetName)) throw new Error(USAGE);
      return show(games.create({ name, settings: presetSettings(preset as PresetName) }), "Created");
    }
    if (command === "show") {
      const game = args[0] && games.get(args[0]);
      if (!game) throw new Error(args[0] ? `No game with id ${args[0]}.` : USAGE);
      return show(game);
    }
    if (command === "delete") {
      const game = args[0] && games.get(args[0]);
      if (!game) throw new Error(args[0] ? `No game with id ${args[0]}.` : USAGE);
      if (!(await confirm(`Delete "${game.name}"? This can't be undone. (yes/no) `))) return console.log("Nothing deleted.");
      games.delete(game.id);
      return console.log(`Deleted "${game.name}".`);
    }
    if (command === "clear") {
      const count = games.list().length;
      if (count === 0) return console.log("There are no games to delete.");
      if (!(await confirm(`Delete all ${count} game${count === 1 ? "" : "s"}? This can't be undone. (yes/no) `))) return console.log("Nothing deleted.");
      return console.log(`Deleted ${games.clear()} game${count === 1 ? "" : "s"}.`);
    }
    throw new Error(USAGE);
  } finally {
    db.close();
  }
}

/** Asks a yes/no question; only "yes" (or "y") confirms. */
async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(question)).trim().toLowerCase();
    return answer === "yes" || answer === "y";
  } finally {
    rl.close();
  }
}

function list(all: Game[]) {
  if (all.length === 0) return console.log("No games yet. Create one with: games create \"name\" --preset easy");
  for (const game of all) console.log(`${game.id}  ${game.name}  (${game.settings.preset}, updated ${game.updatedAt.slice(0, 16).replace("T", " ")})`);
}

function show(game: Game, heading = "Game") {
  console.log(`${heading}: ${game.name}\n  id ${game.id} · preset ${game.settings.preset} · created ${game.createdAt.slice(0, 16).replace("T", " ")}\n`);
  for (const line of describeSettings(game.settings)) {
    console.log(`  ${line.setting}: ${line.value}${line.reference ? `\n      (${line.reference})` : ""}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});