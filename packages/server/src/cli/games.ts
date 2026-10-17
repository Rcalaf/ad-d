import { describeSettings, PRESET_NAMES, presetSettings, type PresetName } from "@dnd/shared";
import { loadSettings } from "../config";
import { openDatabase } from "../state/database";
import { GameStore, type Game } from "../state/games";

const USAGE = `Usage:
  pnpm --filter @dnd/server games                                   list the saved games
  pnpm --filter @dnd/server games create "name" --preset easy       create a game from a preset (${PRESET_NAMES.join(", ")})
  pnpm --filter @dnd/server games show <id>                         show a game's settings`;

/** Lists, creates and shows games in data/games.db: a way to check the game store by hand. */
function main() {
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
    throw new Error(USAGE);
  } finally {
    db.close();
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

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}