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

  it("tell the agent the players see the books' answer directly, so it neither repeats nor rewords it", () => {
    expect(SETUP_INSTRUCTIONS).toContain("The players see its answer and sources directly: don't repeat or reword them; add at most one sentence relating it to their settings.");
    expect(SETUP_INSTRUCTIONS).not.toMatch(/relay its answer/i);
    expect(SETUP_TURN_REMINDER).not.toMatch(/name the book and page/);
  });


  it("let the reminder change settings only when the players ask or say what they want, and ask when a message is unclear", () => {
    expect(SETUP_TURN_REMINDER).toContain("Call set_settings only when players ask for a change or say what they want; if unclear, ask what they mean.");
    expect(SETUP_TURN_REMINDER).not.toMatch(/to suggest or change settings, call set_settings/i);
  });

  it("say that other parts of the program create characters, design adventures and run the game, without offering them", () => {
    expect(SETUP_INSTRUCTIONS).toContain("You don't create characters, design adventures or run the game: other parts of the program do that later; never offer them.");
    expect(SETUP_INSTRUCTIONS).not.toContain("say that comes later");
  });
});