import readline from "node:readline/promises";
import { HumanMessage, type BaseMessage } from "@langchain/core/messages";
import { OllamaEmbedder, RulesIndex, Spinner } from "@dnd/knowledge";
import { describeSettings } from "@dnd/shared";
import { runAgentTurn } from "../agents/agentLoop";
import { createSetupAgent, SETUP_OPENING } from "../agents/setup/agent";
import { loadSettings } from "../config";
import { openDatabase } from "../state/database";
import { GameStore } from "../state/games";
import { explainModelError } from "./errors";

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

/** What the agent is doing, in words, for the log line shown while it works. */
function describeCall(name: string, args: unknown): string {
  const a = (args ?? {}) as Record<string, unknown>;
  if (name === "search_rules") return `searching the books: "${a.question}"`;
  if (name === "describe_presets") return "reading the presets";
  if (name === "propose_settings") {
    const changes = Object.entries(a).map(([key, value]) => `${key} ${value}`);
    return `updating the draft settings${changes.length ? `: ${changes.join(", ")}` : ""}`;
  }
  if (name === "request_game_creation") return `asking to create "${a.name}"`;
  return `using ${name}`;
}

/**
 * The setup conversation: the agent proposes the game's settings, and the person at the keyboard confirms creation.
 *   --verbose   show every tool result in full, to see exactly what the agent read
 */
async function main() {
  const verbose = process.argv.includes("--verbose");
  const settings = loadSettings();
  const db = openDatabase(settings.gamesDbPath);
  const store = new GameStore(db);
  const index = await RulesIndex.open(settings.indexDir, new OllamaEmbedder({ model: settings.embeddingModel, host: settings.ollamaHost }));
  // The same agent the evaluation (eval-setup) measures.
  const { session, tools, model, budget, initialMessages } = createSetupAgent(settings, index);

  const spinner = new Spinner();
  const rl = readline.createInterface({ input: process.stdin });
  // Lines are read from a queue: one typed (or piped) while the agent is thinking waits its turn instead
  // of being lost, and the end of input (Ctrl+D) ends the session cleanly.
  const lines = rl[Symbol.asyncIterator]();
  const ask = async (prompt: string): Promise<string | undefined> => {
    process.stdout.write(prompt);
    const next = await lines.next();
    return next.done ? undefined : next.value.trim();
  };
  let messages: BaseMessage[] = initialMessages();
  console.log(`\n${SETUP_OPENING}\n(Type "quit" to leave without creating a game.)`);

  try {
    while (true) {
      const line = await ask("\n> ");
      if (line === undefined) break;
      if (!line) continue;
      if (["quit", "exit"].includes(line.toLowerCase())) break;

      const start = performance.now();
      spinner.start(() => `Thinking · ${seconds(performance.now() - start)}`);
      try {
        const turn = await runAgentTurn({
          model,
          tools,
          messages: [...messages, new HumanMessage(line)],
          budget,
          onContinuation: (n) => spinner.log(`  · continuing the answer (${n})`),
          onToolCall: (name, args) => spinner.log(`  · ${describeCall(name, args)}`),
          // Results that didn't succeed are always shown (refusals, invalid arguments, repeats); --verbose shows all.
          onToolResult: (_name, ok, content) => {
            const refused = !ok;
            if (verbose) spinner.log(content.split("\n").map((l) => `      ${l}`).join("\n"));
            else if (refused) spinner.log(`      ↳ ${content.split("\n")[0]}`);
          },
        });
        messages = turn.messages;
        spinner.stop();
        console.log(`\n${turn.reply}`);
      } catch (error) {
        // The conversation stays as it was before this message, so the next one starts from a valid state.
        spinner.stop();
        console.error(`\n${explainModelError(error, settings.llmModel)}`);
        continue;
      }

      if (session.creation && session.draft) {
        console.log(`\nGame: ${session.creation.name}`);
        for (const l of describeSettings(session.draft)) console.log(`  ${l.setting}: ${l.value}`);
        const answer = ((await ask("\nCreate this game? (yes/no) ")) ?? "").toLowerCase();
        if (answer === "yes" || answer === "y") {
          const game = store.create({ name: session.creation.name, settings: session.draft });
          console.log(`\nCreated "${game.name}" (id ${game.id}).\nSee it with: pnpm --filter @dnd/server games show ${game.id}`);
          break;
        }
        session.creation = undefined;
        messages.push(new HumanMessage("[The person at the keyboard did not confirm the creation. Ask what they would like to change.]"));
        console.log("Not created. Tell the agent what you'd like to change.");
      }
    }
  } finally {
    spinner.stop();
    rl.close();
    db.close();
  }
}

main().catch((error) => {
  console.error(explainModelError(error));
  process.exit(1);
});