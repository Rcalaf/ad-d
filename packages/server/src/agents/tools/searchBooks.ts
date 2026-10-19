import { z } from "zod";
import type { AnswerResult } from "../../answering/answerQuestion";
import { sourceHeading } from "../../answering/sources";
import type { AgentTool } from "../agentLoop";

/**
 * search_books, the tool every agent uses to ask the books: no agent states a rule from its own memory.
 * Named after what it searches, not after "rules": the books also hold guidance, such as the Guide's advice
 * on running encounters. More than a retriever: it runs the answering workflow (search, neighbouring pieces,
 * an answer citing numbered sources) and decides what the agent gets to see, so the agent receives a short,
 * checked answer instead of raw passages.
 *
 * The answering function comes from outside: the real one uses the index and the model; tests pass a fake.
 */
export function searchBooksTool(answer: (question: string) => Promise<AnswerResult>): AgentTool {
  return {
    name: "search_books",
    description:
      "Search the AD&D 2nd Edition books (the Player's Handbook and the Dungeon Master Guide) for rules or guidance. " +
      "Returns an answer with the book, section and pages it comes from. Use it whenever you need what the books say.",
    schema: z.object({
      question: z.string().min(3).describe("One specific question about the books, in English"),
    }),
    run: async ({ question }) => {
      const result = await answer(question);
      if (result.sources.length === 0) {
        return "The books don't cover this: no passages were found. Tell the players the books don't cover it.";
      }
      // An answer citing nothing may come from the model's memory rather than the books: it's not passed on.
      if (result.checks.uncited || result.cited.length === 0) {
        return "The passages found in the books don't answer this clearly. Tell the players you couldn't find it in the books.";
      }
      const cited = result.sources
        .filter((s) => result.cited.includes(s.number))
        .map((s) => `${sourceHeading(s)}${s.notes.length ? " (converter note: its values may be unreliable)" : ""}`);
      return `Answer: ${result.answer}\nSources:\n${cited.join("\n")}`;
    },
  };
}