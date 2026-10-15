/** One item after fusion: its combined score, and its rank in each input list (1-based, undefined if absent). */
export interface FusedResult {
  id: string;
  score: number;
  ranks: (number | undefined)[];
}

/**
 * Reciprocal rank fusion: combines several ranked lists of ids into one.
 * Each appearance scores 1 / (k + rank); an item's score is the sum over the lists it appears in.
 * It uses ranks, not the searches' own scores, because those are on unrelated scales.
 * k = 60 is the value from the original paper: it keeps the top ranks from dominating completely.
 */
export function reciprocalRankFusion(lists: string[][], k = 60): FusedResult[] {
  const results = new Map<string, FusedResult>();
  lists.forEach((list, listIndex) => {
    list.forEach((id, position) => {
      const rank = position + 1;
      const entry = results.get(id) ?? { id, score: 0, ranks: lists.map(() => undefined) };
      entry.score += 1 / (k + rank);
      entry.ranks[listIndex] = rank;
      results.set(id, entry);
    });
  });
  // Array.prototype.sort is stable, so equal scores keep the order of first appearance.
  return [...results.values()].sort((a, b) => b.score - a.score);
}
