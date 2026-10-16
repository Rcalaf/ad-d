import type { BaseMessage } from "@langchain/core/messages";
import type { ExpandOptions, Passage, SearchResult } from "@dnd/knowledge";
import { assertPromptFits, checkReportedUsage, sourceBudgetChars, type WindowBudget } from "../llm/contextWindow";
import { checkCitations, findCitations, type CitationChecks } from "./citations";
import { buildMessages, INSTRUCTIONS, QUESTION_HEADER, SOURCES_HEADER } from "./prompt";
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
}

export interface AnswerResult {
  question: string;
  answer: string;
  sources: Source[];
  /** Source numbers the answer cites. */
  cited: number[];
  checks: CitationChecks;
  tokens: { estimated: number; reported?: number };
  /** Set when the model reports reading more tokens than the estimate allowed: the prompt may have been cut. */
  usageWarning?: string;
}

const NOTHING_FOUND = "I found no passages in the books about this question.";

/**
 * Answers a rules question from the books: search, expand within the context window, number the
 * passages as sources, ask the model to answer only from them with citations, then check the citations.
 */
export async function answerQuestion(question: string, options: AnswerOptions): Promise<AnswerResult> {
  const { index, model, budget, maxSourceChars = 12_000, limit = 5 } = options;

  const results = await index.search(question, { limit });
  if (results.length === 0) {
    // Without sources, a model asked anyway is most likely to invent an answer: don't ask it.
    return { question, answer: NOTHING_FOUND, sources: [], cited: [], checks: { unknownCitations: [], uncited: false }, tokens: { estimated: 0 } };
  }

  // The sources get whatever the window leaves after the fixed parts of the prompt, up to the configured cap.
  const fixedParts = [INSTRUCTIONS, SOURCES_HEADER, QUESTION_HEADER, question];
  const maxChars = Math.min(sourceBudgetChars(fixedParts, budget), maxSourceChars);
  const passages = await index.expand(results, { maxChars });

  const sourcesText = formatSources(passages);
  const { estimatedTokens } = assertPromptFits([...fixedParts, sourcesText], budget);
  const response = await model.invoke(buildMessages(sourcesText, question));

  const answer = contentText(response.content).trim();
  const cited = findCitations(answer);
  const reported = response.usage_metadata?.input_tokens;
  return {
    question,
    answer,
    sources: toSources(passages),
    cited,
    checks: checkCitations(cited, passages.length),
    tokens: { estimated: estimatedTokens, reported },
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