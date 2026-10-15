import { describe, expect, it } from "vitest";
import { reciprocalRankFusion } from "../src/fusion";

describe("reciprocalRankFusion", () => {
  it("ranks an item found by both searches above items found by only one", () => {
    const fused = reciprocalRankFusion([
      ["a", "b", "c"],
      ["d", "b"],
    ]);
    expect(fused[0].id).toBe("b");
  });

  it("scores each appearance as 1 / (k + rank) and adds them up", () => {
    const [b] = reciprocalRankFusion([["a", "b"], ["b"]], 60).filter((r) => r.id === "b");
    expect(b.score).toBeCloseTo(1 / 62 + 1 / 61);
  });

  it("records the rank of each item in each list, starting at 1", () => {
    const fused = reciprocalRankFusion([["a", "b"], ["b"]]);
    expect(fused.find((r) => r.id === "b")?.ranks).toEqual([2, 1]);
    expect(fused.find((r) => r.id === "a")?.ranks).toEqual([1, undefined]);
  });

  it("works when one of the lists is empty", () => {
    expect(reciprocalRankFusion([["a", "b"], []]).map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("breaks ties by the order in which items first appeared", () => {
    expect(reciprocalRankFusion([["a"], ["b"]]).map((r) => r.id)).toEqual(["a", "b"]);
  });
});
