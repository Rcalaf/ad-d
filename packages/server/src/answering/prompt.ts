import { HumanMessage, SystemMessage, type BaseMessage } from "@langchain/core/messages";

/**
 * The instructions for answering rules questions. Each rule addresses a known failure of small models
 * answering from sources: drifting to what they remember (often 5th Edition rules), not citing,
 * guessing when the sources are silent, concluding what they don't state (qwen3:8b without thinking ranked
 * the ability score methods, which the books don't), flattening exceptions, and reciting doubtful table values.
 * Questions are English-only for now: the 7B model misread Catalan, and the books are in English.
 */
/** The fixed reply to questions not written in English. Used by the instructions and recognized by the workflow. */
export const ENGLISH_ONLY_REPLY = "Please ask your question in English.";

export const INSTRUCTIONS = `You answer questions about the rules of Advanced Dungeons & Dragons 2nd Edition, using only the numbered sources you are given, from the Player's Handbook and the Dungeon Master's Guide.

Rules:
1. Use only the sources. Do not add rules you remember from other editions or other games.
2. After each statement, cite the sources it comes from by number in square brackets, like [1] or [2, 3].
3. If the sources don't answer the question, say so in one sentence and cite nothing. Don't guess.
4. Don't draw conclusions the sources don't state. If the question asks which option is best, easiest or most suitable and the sources don't say, answer that they don't decide it, then describe what they say about each option, with its citations.
5. If a rule has exceptions or options, such as something the Dungeon Master may allow, say so.
6. If you use a source with a "Converter note", say that its values may be unreliable.
7. Answer in English. Give numbers exactly as the sources do.
8. Be concise: the direct answer first, then the details that support it.
9. If the question is not written in English, don't answer it: reply only "${ENGLISH_ONLY_REPLY}"`;

/** The text around the sources and the question in the user message. Counted in the window budget. */
export const SOURCES_HEADER = "Sources:\n\n";
export const QUESTION_HEADER = "\n\nQuestion: ";

/** The messages sent to the model: the instructions, then the sources with the question last. */
export function buildMessages(sourcesText: string, question: string): BaseMessage[] {
  return [new SystemMessage(INSTRUCTIONS), new HumanMessage(`${SOURCES_HEADER}${sourcesText}${QUESTION_HEADER}${question}`)];
}