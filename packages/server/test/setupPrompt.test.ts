import { describe, expect, it } from "vitest";
import { SETUP_INSTRUCTIONS, SETUP_TURN_REMINDER } from "../src/agents/setup/prompt";

describe("SETUP_INSTRUCTIONS", () => {
  it("stay short: a few clear rules", () => {
    expect(SETUP_INSTRUCTIONS.split(/\s+/).length).toBeLessThanOrEqual(220);
  });

  it("say when to use each of the four tools, and limit the agent to setting up the game", () => {
    for (const tool of ["show_presets", "set_settings", "search_books", "create_game"]) expect(SETUP_INSTRUCTIONS).toContain(tool);
    expect(SETUP_INSTRUCTIONS).toMatch(/that is your only job/i);
  });

  it("come with a short turn reminder, pointing explanations to search_books and changes to set_settings", () => {
    expect(SETUP_TURN_REMINDER.split(/\s+/).length).toBeLessThanOrEqual(40);
    expect(SETUP_TURN_REMINDER).toContain("search_books");
    expect(SETUP_TURN_REMINDER).toContain("set_settings");
  });
});