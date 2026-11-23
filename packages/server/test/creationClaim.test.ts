import { describe, expect, it } from "vitest";
import { claimsCreation } from "../src/agents/setup/creationClaim";

describe("claimsCreation", () => {
  it("recognizes the claims the agent made in real tests", () => {
    for (const reply of [
      'Your game "Test campaign" is now created with the following settings:',
      'The game "Test 3" has been created. Are you ready to start playing?',
      'Great! Your game "Test 28/12" is created with the following settings:',
      "The game \"Test campaign\" has been created. Are you ready to start playing?",
      "Confirmed! The game \"Test 3\" is now created with the agreed settings.",
      "I've created your game, enjoy!",
      "Your game was successfully created.",
    ]) {
      expect(claimsCreation(reply), reply).toBe(true);
    }
  });

  it("ignores negations, conditions, futures and requests, which are correct replies", () => {
    for (const reply of [
      "The game is not created yet: the program now asks the person at the keyboard to confirm.",
      "Once the game is created, you can create your characters in a later step.",
      "It will be created after you confirm.",
      "When the game is created, the settings are saved.",
      'Creation of "Test campaign" requested.',
      "Would you like to confirm the creation of your game, or make any other changes?",
      "Your game is set to the medium preset. Would you like to name your game?",
      "Character creation is a separate step, later.",
    ]) {
      expect(claimsCreation(reply), reply).toBe(false);
    }
  });

  it("finds a claim in any sentence of a longer reply", () => {
    expect(claimsCreation("Here are your settings.\n\n- Encounter difficulty: below\n\nYour game is now created. Enjoy!")).toBe(true);
  });
});