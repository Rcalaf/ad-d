import type { BaseMessage } from "@langchain/core/messages";
import type { ExpandOptions, Passage, SearchResult } from "@dnd/knowledge";
import { assertPromptFits, checkReportedUsage, sourceBudgetChars, type WindowBudget } from "../llm/contextWindow";
import { checkCitations, findCitations, type CitationChecks } from "./citations";
import { buildMessages, ENGLISH_ONLY_REPLY, INSTRUCTIONS, QUESTION_HEADER, SOURCES_HEADER } from "./prompt";
import { formatSources, toSources, type Source } from "./sources";

/** What the workflow needs from a model: the chat models from getChatModel() fit, and tests pass a scripted one. */
export interface AnswerModel {
  invoke(messages: BaseMessage[]): Promise<{ content: unknown; usage_metadata?: { input_tokens?: number } }>;
}

/** What the workflow needs from the rules index: RulesIndex fits, and tests pass a fake. */
export interface RulesSearch {
  search(question: string, options?: { limit?: number }): Promise<SearchResult[]>;
  expand(results: SearchResult[], options?: ExpandOptions): Promise<Passage[]>;
}

export interface AnswerOptions {
  index: RulesSearch;
  model: AnswerModel;
  /** The model's context window and answer reserve, from the settings. */
  budget: WindowBudget;
  /**
   * Upper limit for the sources, in characters, even if the window allows more: longer prompts make
   * answers slower on a local model. Default 12,000; the 1.8 evaluation will tell where it should be.
   */
  maxSourceChars?: number;
  /** Search results to start from. Default 5. */
  limit?: number;
  /** Called as each stage starts, for progress displays. */
  onStage?: (stage: "searching" | "answering") => void;
}

export interface AnswerResult {
  question: string;
  answer: string;
  sources: Source[];
  /** Source numbers the answer cites. */
  cited: number[];
  checks: CitationChecks;
  /** True when the model declined because the question isn't in English: not an answer, so nothing to check. */
  notEnglish: boolean;
  /** The prompt's length in characters, its estimated tokens, and the tokens the model reports reading. */
  tokens: { promptChars: number; estimated: number; reported?: number };
  /** Time spent searching and expanding, and waiting for the model, in milliseconds. */
  timings: { retrievalMs: number; modelMs: number };
  /** Set when the model reports reading more tokens than the estimate allowed: the prompt may have been cut. */
  usageWarning?: string;
}

const NOTHING_FOUND = "I found no passages in the books about this question.";

/**
 * Answers a rules question from the books: search, expand within the context window, number the
 * passages as sources, ask the model to answer only from them with citations, then check the citations.
 */
export async function answerQuestion(question: string, options: AnswerOptions): Promise<AnswerResult> {
  const { index, model, budget, maxSourceChars = 12_000, limit = 5, onStage = () => {} } = options;

  onStage("searching");
  const retrievalStart = performance.now();
  const results = await index.search(question, { limit });
  if (results.length === 0) {
    // Without sources, a model asked anyway is most likely to invent an answer: don't ask it.
    return {
      question,
      answer: NOTHING_FOUND,
      sources: [],
      cited: [],
      checks: { unknownCitations: [], uncited: false },
      notEnglish: false,
      tokens: { promptChars: 0, estimated: 0 },
      timings: { retrievalMs: performance.now() - retrievalStart, modelMs: 0 },
    };
  }

  // The sources get whatever the window leaves after the fixed parts of the prompt, up to the configured cap.
  const fixedParts = [INSTRUCTIONS, SOURCES_HEADER, QUESTION_HEADER, question];
  const maxChars = Math.min(sourceBudgetChars(fixedParts, budget), maxSourceChars);
  const passages = await index.expand(results, { maxChars });

  const sourcesText = formatSources(passages);
  const promptParts = [...fixedParts, sourcesText];
  const { estimatedTokens } = assertPromptFits(promptParts, budget);
  const retrievalMs = performance.now() - retrievalStart;

  onStage("answering");
  const modelStart = performance.now();
  const response = await model.invoke(buildMessages(sourcesText, question));
  const modelMs = performance.now() - modelStart;

  const answer = contentText(response.content).trim();
  const notEnglish = answer === ENGLISH_ONLY_REPLY;
  const cited = findCitations(answer);
  const reported = response.usage_metadata?.input_tokens;
  return {
    question,
    answer,
    sources: toSources(passages),
    cited,
    // A refusal cites nothing by design: only real answers are checked.
    checks: notEnglish ? { unknownCitations: [], uncited: false } : checkCitations(cited, passages.length),
    notEnglish,
    tokens: { promptChars: promptParts.reduce((sum, part) => sum + part.length, 0), estimated: estimatedTokens, reported },
    timings: { retrievalMs, modelMs },
    usageWarning: checkReportedUsage(reported, budget),
  };
}

/** A model's reply as text: either a string, or a list of parts of which the text parts count. */
function contentText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => (typeof part === "string" ? part : part?.type === "text" ? part.text : "")).join("");
  }
  return "";
}