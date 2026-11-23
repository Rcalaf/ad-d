/**
 * Whether a reply says the game has been created. Only the program creates a game, after the person at the keyboard
 * types yes; a reply saying it did is false. The agent has said so in every test, with every model, sometimes
 * without even requesting creation ("Your game is now created… Enjoy your game!"), so the command checks the outcome
 * instead of relying on the agent not to say it.
 *
 * A claim is a sentence saying the game is, has been or was created. Sentences with a negation or a condition
 * ("is not created yet", "once the game is created", "when it is created") are correct replies and don't count.
 */

/** "is created", "is now created", "has been created", "was successfully created", "I've created". */
const CLAIM = /\b(?:is|has been|was)\s+(?:now\s+)?(?:successfully\s+)?created\b|\bI(?:'ve| have)\s+(?:just\s+)?created\b/i;
/** Words that make a sentence a negation, a condition or a future rather than a statement that it happened. */
const NOT_A_CLAIM = /\b(?:not|once|when|after|before|until|if|will|would|can|could)\b/i;

export function claimsCreation(reply: string): boolean {
  return reply
    .split(/(?<=[.!?])\s+|\n+/)
    .some((sentence) => CLAIM.test(sentence) && !NOT_A_CLAIM.test(sentence));
}