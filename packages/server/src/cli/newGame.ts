import readline from "node:readline";
import { AIMessage, HumanMessage, SystemMessage, type BaseMessage } from "@langchain/core/messages";
import { OllamaEmbedder, RulesIndex, Spinner } from "@dnd/knowledge";
import { describeSettings } from "@dnd/shared";
import { runAgentTurn, toLangChainTools, type ToolCallingModel, type ToolUse } from "../agents/agentLoop";
import { SETUP_INSTRUCTIONS, SETUP_TURN_REMINDER } from "../agents/setup/prompt";
import { presetsTable, SetupSession, setupTools } from "../agents/setup/tools";
import { searchBooksTool } from "../agents/tools/searchBooks";
import { answerQuestion } from "../answering/answerQuestion";
import { loadSettings } from "../config";
import { getChatModel } from "../llm/provider";
import { openDatabase } from "../state/database";
import { GameStore } from "../state/games";
import { explainModelError } from "./errors";
import { formatTurnStats, type BooksAnswerStats } from "./turnStats";

/** Answers from the books stick to the sources; the conversation itself can be a little freer. */
const BOOKS_TEMPERATURE = 0.1;
const AGENT_TEMPERATURE = 0.3;
const OPENING = [
  "Let's set up your game. There are three presets to start from:",
  "",
  presetsTable(),
  "",
  "How experienced is your group with AD&D 2nd Edition: new players, some experience, or veterans?",
].join("\n");

/** A tool use in words, for the line shown while the agent works. */
function describeToolUse(use: ToolUse): string {
  const args = (use.args ?? {}) as Record<string, unknown>;
  const line =
    use.name === "search_books" ? `searching the books: "${args.question}"`
    : use.name === "show_presets" ? "showing the presets"
    : use.name === "set_settings" ? `setting: ${Object.entries(args).map(([k, v]) => `${k} ${v}`).join(", ") || "(nothing)"}`
    : use.name === "create_game" ? `requesting creation of "${args.name}"`
    : `using ${use.name}`;
  // Failures are shown under the line, so problems are always visible.
  return use.ok ? `  · ${line}` : `  · ${line}\n      ↳ ${use.result.split("\n")[0]}`;
}

/**
 * The new-game command: a conversation with the setup agent, which chooses the game's settings with the players.
 * The game is saved only after the person at the keyboard types yes.
 */
async function main() {
  const settings = loadSettings();
  const budget = { contextTokens: settings.contextTokens, answerTokens: settings.answerTokens };
  const db = openDatabase(settings.gamesDbPath);
  const store = new GameStore(db);
  const index = await RulesIndex.open(settings.indexDir, new OllamaEmbedder({ model: settings.embeddingModel, host: settings.ollamaHost }));

  const session = new SetupSession();
  // The books' answers summarize given passages: thinking adds time without helping. The agent keeps its default.
  const booksModel = getChatModel(settings, { temperature: BOOKS_TEMPERATURE, thinking: false });
  // Each books' answer of the current turn, for the line shown under the reply.
  let booksThisTurn: BooksAnswerStats[] = [];
  const askBooks = async (question: string) => {
    const result = await answerQuestion(question, { index, model: booksModel, budget });
    const { retrievalMs, modelMs } = result.timings;
    booksThisTurn.push({ ms: retrievalMs + modelMs, inputTokens: result.tokens.reported ?? 0, outputTokens: result.tokens.generated ?? 0 });
    return result;
  };
  const tools = [...setupTools(session), searchBooksTool(askBooks)];
  // Thinking off for the agent too: choosing settings and tools gains little from it, and it costs time on every
  // turn and can use up the answer limit (empty replies). Measured against thinking on: see CLAUDE.md, 2.3.10.
  const chat = getChatModel(settings, { temperature: AGENT_TEMPERATURE, thinking: false });
  if (!chat.bindTools) throw new Error(`The model provider for ${settings.llmModel} doesn't support tools.`);
  const model = chat.bindTools(toLangChainTools(tools)) as unknown as ToolCallingModel;

  // Lines are read from a queue: a line typed while the agent is thinking waits its turn instead of being lost,
  // and the end of input (Ctrl+D) ends the session cleanly.
  const input = readline.createInterface({ input: process.stdin });
  const lines = input[Symbol.asyncIterator]();
  const ask = async (prompt: string) => {
    process.stdout.write(prompt);
    const next = await lines.next();
    return next.done ? undefined : String(next.value).trim();
  };

  const spinner = new Spinner();
  let messages: BaseMessage[] = [new SystemMessage(SETUP_INSTRUCTIONS), new AIMessage(OPENING)];
  console.log(`\n${OPENING}\n(Type "quit" to leave without creating a game.)`);

  try {
    while (true) {
      const line = await ask("\n> ");
      if (line === undefined || ["quit", "exit"].includes(line.toLowerCase())) break;
      if (!line) continue;

      const start = performance.now();
      booksThisTurn = [];
      spinner.start(() => `Thinking · ${((performance.now() - start) / 1000).toFixed(1)} s`);
      try {
        const turn = await runAgentTurn({
          model,
          tools,
          messages: [...messages, new HumanMessage(line)],
          budget,
          turnReminder: SETUP_TURN_REMINDER,
          // After a creation request, the program takes over with the typed confirmation: no reply from the agent.
          endTurnAfter: ["create_game"],
          onToolUse: (use) => spinner.log(describeToolUse(use)),
        });
        messages = turn.messages;
        spinner.stop();
        if (turn.reply) console.log(`\n${turn.reply}`);
        // Time and tokens of this turn, left on screen to compare changes.
        console.log(formatTurnStats({ ms: performance.now() - start, agent: turn.usage, books: booksThisTurn }));
      } catch (error) {
        // The conversation stays as it was before this message, so the next one starts from a valid state.
        spinner.stop();
        console.error(`\n${explainModelError(error, settings.llmModel)}`);
        continue;
      }

      if (session.requestedName && session.settings) {
        console.log(`\nGame: ${session.requestedName}`);
        for (const l of describeSettings(session.settings)) console.log(`  ${l.setting}: ${l.value}`);
        const answer = ((await ask("\nCreate this game? (yes/no) ")) ?? "").toLowerCase();
        if (answer === "yes" || answer === "y") {
          const game = store.create({ name: session.requestedName, settings: session.settings });
          console.log(`\nCreated "${game.name}" (id ${game.id}).`);
          break;
        }
        session.requestedName = undefined;
        messages.push(new HumanMessage("(The person at the keyboard did not confirm the creation. Ask what they would like to change.)"));
        console.log("Not created. Tell the agent what you'd like to change.");
      }
    }
  } finally {
    // Closing the input is what lets the program end: an open input keeps Node waiting for more lines.
    input.close();
    spinner.stop();
    db.close();
  }
}

main().catch((error) => {
  console.error(explainModelError(error));
  process.exit(1);
});