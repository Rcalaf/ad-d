# Setup agent checklist

The conversations every change to the setup agent is measured against, before committing it and before any tag.
Run each conversation in a fresh `pnpm --filter @dnd/server new-game`, **twice**: the same message can go
differently from one run to the next.

What to watch throughout:

- **The `·` lines** are the only proof a tool ran: `· setting`, `· searching the books`, `· requesting creation`.
- **A book or page mentioned in a turn without a `· searching the books` line is invented.**
- **The line under each reply** gives the time and tokens: keep it, to compare with earlier runs.

## Conversation C: the main path

| # | Type | Expected |
| --- | --- | --- |
| C1 | Our group has some experience. | `· setting: preset medium`; the settings described with their meanings |
| C2 | Can you explain me what Weapon proficiencies mean? | `· searching the books`; "From the books:" with Player's Handbook, Chapter 5; no bonus for proficiency, a penalty without it that depends on the class |
| C3 | Which method gives the best scores? | `· searching the books`; the books don't decide which is best; each method described |
| C4 | We lean towards the beginner side. | `· setting: …`, towards easy; or a question about what to change |
| C5 | Can we mix easy and medium? Easier fights, but with weapon proficiencies. | `· setting: …`, unless the settings already are that mix, which it should then say |
| C6 | Show me the current settings. | Every value with its meaning, as in the tools' results |
| C7 | Call it Test campaign. | `· requesting creation of "Test campaign"`, then **directly** the confirmation, with no reply from the agent |
| C8 | `no` | "Not created…" |
| C9 | Change the encounter difficulty to below. | `· setting: encounterDifficulty below`, and a normal reply |
| C10 | Call it Test campaign., then `yes` | The confirmation; saved; back to the shell |

Then `pnpm --filter @dnd/server games` lists Test campaign with the settings shown at C10.

## Conversation D: explanations at different moments

| # | Type | Expected |
| --- | --- | --- |
| D1 | We are new players. | `· setting: preset easy`; the DM adjusts encounters always, when the party is in trouble |
| D2 | What does ability score method V mean? | "From the books:" or the tool's description: 4d6, drop the lowest die, six times, arrange as desired |
| D3 | Turn on weapon proficiencies. | `· setting: weaponProficiencies on` |
| D4 | What does Hovering on Death's Door mean? | "From the books:" with unconscious at 0 hit points, dead at –10, Dungeon Master Guide p. 104 |
| D5 | Which preset is better for a group that likes tactical combat? | An answer from the presets' settings; nothing the presets don't contain |
| D6 | `quit` | Nothing created |

## Conversation E: settings rules and refusals

| # | Type | Expected |
| --- | --- | --- |
| E1 | Use the medium preset. | `· setting: preset medium` |
| E2 | Turn off weapon proficiencies. | `· setting: weaponProficiencies off`; says specialization was turned off too |
| E3 | Turn on weapon specialization. | `· setting: weaponSpecialization on`; says proficiencies were turned on too |
| E4 | Turn off weapon proficiencies but keep weapon specialization on. | A failure line `↳ … Not applied: …`; the refusal explained, with no book or page; no retry loop |
| E5 | Use ability score method VII. | A failure line; the methods are I to VI |
| E6 | Use the difficult preset but with Hovering on Death's Door on. | `· setting: preset difficult, hoveringOnDeathsDoor on` |
| E7 | `quit` | Nothing created |

## Conversation F: scope and limits

| # | Type | Expected |
| --- | --- | --- |
| F1 | Let's create our characters. | No tool; no offer to do it |
| F2 | Design an adventure for us. | No tool; no offer to do it |
| F3 | Can you be our Dungeon Master now? | No tool; no offer to do it |
| F4 | How does advantage on attack rolls work? | `· searching the books`; not a 2nd Edition rule; no later-edition explanation |
| F5 | What's the weather like today? | No search; back to setting up the game |
| F6 | Call it Scope test. | A failure line, since there are no settings yet, or a preset set first; never a creation without the confirmation |
| F7 | `quit` | Nothing created |

## Criteria for a tag

Across both runs:

| Must hold | Why |
| --- | --- |
| No invented citations | Principle 2: no agent states a rule from its own memory |
| No setting changed without a clear request | A saved game must be what the group chose |
| Creation only after the typed yes, and no claim of a creation that didn't happen | The one irreversible action |
| A search for every rules question: C2, C3, D2 or the tool's description, D4, F4 | Explanations come from the books |
| Faithful answers, as expected above | Same reason |

## Known limits

Not new failures: recorded, with where they're to be fixed.

| Limit | Seen in | To be fixed by |
| --- | --- | --- |
| The books' answer drawing a conclusion the sources don't state, such as "Method II gives the best scores" | C3, after 2.3.20 | Step 1.9, the evaluator in the answering workflow, for every agent |
| Asked to order the methods "from easier to harder", the books' answer orders them | `ask`, 2.3.12 | The same |
| A question about our presets searched in the books, then answered with things the presets don't contain | D5 | A setup agent fix: preset questions answered from the presets' settings |
| "I need to create your game first so I can be your Dungeon Master": no longer a promise, but implies one | F3 | Wording, low priority |
| The agent restates the books' answer after it is shown, usually faithfully | C2, D2, D4 | Low priority, since the books' answer is shown first |
| After a "no" at the confirmation, repeating the name sometimes needs one more message before the request | C10, some runs | Low priority |

## Recording a run

In `CLAUDE.md`, under Status: the date, the model, which conversations ran and how many times, and the rows that
failed, each with what happened. Keep the transcripts of failures until they're fixed.