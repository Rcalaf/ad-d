import { AIMessage, HumanMessage, type BaseMessage } from "@langchain/core/messages";
import type { AnswerModel } from "./answerQuestion";
import { findCitations } from "./citations";

/**
 * The evaluator, step 1.9: checks an answer sentence by sentence against its sources, asks for one revision when a
 * sentence isn't supported, and removes what is still unsupported after it. The citation checks only see whether a
 * cited source exists; this sees whether it says what the sentence claims ("Method II gives the best scores [1]",
 * where [1] says only that it gives better scores than Method I).
 *
 * Every call continues the answer's own conversation (the instructions, the sources and the question, then the
 * answer), so its beginning is identical to the answer's request: Ollama can reuse what it already read instead of
 * reading the sources again.
 */

export interface Sentence {
  text: string;
  /** The source numbers the sentence cites. */
  cited: number[];
}

export interface Verdict {
  supported: boolean;
  reason?: string;
}

export interface Verification {
  /** The answer to show: unchanged, revised, or with unsupported sentences removed. */
  answer: string;
  /** Sentences the first check found unsupported, with its reason, whether or not the revision fixed them. */
  flagged: { sentence: string; reason: string }[];
  /** Sentences removed because they were still unsupported after the revision, with the checker's reason. */
  removed: { sentence: string; reason: string }[];
  /** True when the answer was rewritten after a check. */
  revised: boolean;
  /** True when a check's reply couldn't be read: the answer is then kept as it was, never cut on a guess. */
  checkFailed: boolean;
  /** The evaluator's own model calls, tokens and time. */
  calls: number;
  inputTokens: number;
  outputTokens: number;
  ms: number;
}

/** Splits an answer into checkable units: a list item is one unit; other lines are split into sentences. */
export function splitSentences(answer: string): Sentence[] {
  const units: string[] = [];
  for (const line of answer.split(/\n+/).map((l) => l.trim()).filter(Boolean)) {
    if (/^([-*]|\d+\.)\s/.test(line)) units.push(line);
    // A new sentence starts after . ! or ? followed by a capital letter, bold or a bracket: "p. 18" is not split.
    else units.push(...line.split(/(?<=[.!?])\s+(?=[A-Z*"(\[])/).map((s) => s.trim()).filter(Boolean));
  }
  return units.map((text) => ({ text, cited: findCitations(text) }));
}

/** Reads one verdict per numbered sentence. Returns undefined if any sentence has none: never guess. */
export function parseVerdicts(reply: string, count: number): Verdict[] | undefined {
  const found = new Map<number, Verdict>();
  for (const line of reply.split("\n")) {
    const m = line.match(/^\s*(\d+)\s*[:.)\-–]\s*(not\s+supported|supported)\b[\s:.\-–]*(.*)$/i);
    if (!m) continue;
    const supported = !/^not/i.test(m[2]);
    found.set(Number(m[1]), supported ? { supported } : { supported, reason: m[3].trim().replace(/\.$/, "") || "not stated in the sources" });
  }
  const verdicts = Array.from({ length: count }, (_, i) => found.get(i + 1));
  return verdicts.every(Boolean) ? (verdicts as Verdict[]) : undefined;
}

const checkRequest = (sentences: Sentence[]) =>
  [
    "Check your answer against the sources above, one sentence at a time. A sentence is supported only if the sources it cites state it, or, when it cites none, if any source states it. A conclusion, ranking or detail the sources don't state is not supported.",
    "Reply with one line per sentence and nothing else, in this form:",
    "<number>: supported",
    "<number>: not supported: <short reason>",
    "",
    "Sentences:",
    ...sentences.map((s, i) => `${i + 1}. ${s.text}`),
  ].join("\n");

const reviseRequest = (unsupported: { text: string; reason: string }[]) =>
  [
    "These sentences of your answer are not supported by the sources:",
    ...unsupported.map((u) => `- ${u.text} (${u.reason})`),
    "",
    "Rewrite your answer using only what the sources state, with their citations, keeping everything that was supported. Reply with the answer only.",
  ].join("\n");

/** Removes sentences from an answer, then tidies the spaces and empty lines they leave. */
function removeSentences(answer: string, sentences: string[]): string {
  let text = answer;
  for (const sentence of sentences) text = text.replace(sentence, "");
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trimEnd())
    .filter((line, i, lines) => !(line.trim() === "" && (i === 0 || lines[i - 1].trim() === "")))
    .join("\n")
    .trim();
}

export async function verifyAnswer(answer: string, answerMessages: BaseMessage[], model: AnswerModel): Promise<Verification> {
  const start = performance.now();
  const usage = { calls: 0, inputTokens: 0, outputTokens: 0 };
  const call = async (messages: BaseMessage[]) => {
    const response = await model.invoke(messages);
    usage.calls++;
    usage.inputTokens += response.usage_metadata?.input_tokens ?? 0;
    usage.outputTokens += response.usage_metadata?.output_tokens ?? 0;
    return contentText(response.content).trim();
  };
  const check = async (text: string) => {
    const sentences = splitSentences(text);
    const reply = await call([...answerMessages, new AIMessage(text), new HumanMessage(checkRequest(sentences))]);
    const verdicts = parseVerdicts(reply, sentences.length);
    const unsupported = verdicts && sentences.flatMap((s, i) => (verdicts[i].supported ? [] : [{ text: s.text, reason: verdicts[i].reason! }]));
    return unsupported;
  };
  const done = (result: Omit<Verification, "calls" | "inputTokens" | "outputTokens" | "ms">): Verification => ({ ...result, ...usage, ms: performance.now() - start });

  const first = await check(answer);
  if (!first) return done({ answer, flagged: [], removed: [], revised: false, checkFailed: true });
  if (first.length === 0) return done({ answer, flagged: [], removed: [], revised: false, checkFailed: false });
  const flagged = first.map((u) => ({ sentence: u.text, reason: u.reason }));

  // One revision, then one more check of it.
  const revision = await call([...answerMessages, new AIMessage(answer), new HumanMessage(reviseRequest(first))]);
  const second = await check(revision);
  if (!second) return done({ answer: revision, flagged, removed: [], revised: true, checkFailed: true });
  const removed = second.map((u) => ({ sentence: u.text, reason: u.reason }));
  return done({ answer: removeSentences(revision, removed.map((r) => r.sentence)), flagged, removed, revised: true, checkFailed: false });
}

/** A model's reply as text: either a string, or a list of parts of which the text parts count. */
function contentText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((p) => (typeof p === "string" ? p : p?.type === "text" ? p.text : "")).join("");
  return "";
}