import { describe, expect, it } from "vitest";
import { explainModelError } from "../src/cli/errors";

describe("explainModelError", () => {
  it("explains a connection failure", () => {
    expect(explainModelError(new Error("fetch failed"))).toMatch(/Ollama app is running/);
  });

  it("explains a missing model, with the command to download it", () => {
    expect(explainModelError(new Error('model "qwen3:8b" not found, try pulling it first'), "qwen3:8b")).toContain("ollama pull qwen3:8b");
  });

  it("passes other errors through unchanged", () => {
    expect(explainModelError(new Error("rate limited"))).toBe("rate limited");
  });
});