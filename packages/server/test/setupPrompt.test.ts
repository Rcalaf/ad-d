import { describe, expect, it } from "vitest";
import { SETUP_INSTRUCTIONS } from "../src/agents/setup/prompt";

describe("SETUP_INSTRUCTIONS", () => {
  it("stay short: a few clear rules", () => {
    expect(SETUP_INSTRUCTIONS.split(/\s+/).length).toBeLessThanOrEqual(220);
  });

  it("say when to use each of the four tools, and limit the agent to setting up the game", () => {
    for (const tool of ["show_presets", "set_settings", "search_books", "create_game"]) expect(SETUP_INSTRUCTIONS).toContain(tool);
    expect(SETUP_INSTRUCTIONS).toMatch(/that is your only job/i);
  });
});