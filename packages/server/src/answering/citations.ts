/** A citation: one or more numbers in square brackets, such as [1] or [2, 3]. "[...]" and "[Table 7]" are not. */
const CITATION = /\[(\d+(?:\s*,\s*\d+)*)\]/g;

/** The distinct source numbers an answer cites, in ascending order. */
export function findCitations(answer: string): number[] {
  const numbers = [...answer.matchAll(CITATION)].flatMap((m) => m[1].split(",").map((n) => Number(n.trim())));
  return [...new Set(numbers)].sort((a, b) => a - b);
}

export interface CitationChecks {
  /** Cited numbers with no matching source: the model referred to something it wasn't given. */
  unknownCitations: number[];
  /** True when the answer cites nothing: either the books don't cover the question, or it isn't grounded. */
  uncited: boolean;
}

export function checkCitations(cited: number[], sourceCount: number): CitationChecks {
  return {
    unknownCitations: cited.filter((n) => n < 1 || n > sourceCount),
    uncited: cited.length === 0,
  };
}