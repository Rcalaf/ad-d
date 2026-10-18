# AD&D AI Game Master

Personal project: an agentic system for playing AD&D 2nd Edition with friends, running on open models locally. It is also a learning project, so explain the reasoning behind changes, not only the changes. Built incrementally: every iteration ends with something usable.

## Environment

- Node 22.11.0 (see `.node-version`). Do not upgrade Node or npm, and do not suggest it: another project on this machine depends on this version.
- pnpm through Corepack, version pinned in `package.json`. Run one command per line.
- Vitest 4 with Vite 6, forced by an override in `pnpm-workspace.yaml`, because newer Vite needs Node 22.12.
- `better-sqlite3` pinned to version 12 (`^12`), allowed to build in `pnpm-workspace.yaml`: version 13 crashes with a segmentation fault on Node 22.11 (tested), and Node's built-in `node:sqlite` needs the `--experimental-sqlite` flag on 22.11.
- Local models through Ollama: `qwen2.5:7b` for chat, `bge-m3` for embeddings. The first request after Ollama starts, or after it has been idle, includes loading the model: measure speed on the second request.

## Structure

TypeScript monorepo with dependencies in one direction only:

| Package | Holds | Depends on |
| --- | --- | --- |
| `packages/shared` | Zod schemas and types | Nothing of ours |
| `packages/rules` | AD&D 2e mechanics: exact calculations from structured data | `shared` |
| `packages/knowledge` | Book checks, chunking, embeddings, LanceDB index, hybrid rules search | Nothing of ours |
| `packages/server` | The agents: Character Designer, Campaign Designer, Game Master | All three |

`rules` never calls `knowledge`: exact numbers come from data files, never from search.

### `packages/knowledge/src`

| Module | Role |
| --- | --- |
| `chunker.ts` | Splits a Markdown book by headings. A bold line standing alone (`**Weapons Allowed**`) counts as a subheading if it looks like a title (see Known pitfalls); a bold line repeating its own section's title is ignored. Tables are never cut; a "Table N" heading covers only its table (footnotes included, also plain `* ` ones), then text returns to the parent section. Page markers may be inline. Converter comments (`<!-- UNCLEAR: ... -->`) are removed from the text and kept as the chunk's `notes`. Each chunk records its section number (in book order) and its piece position, so adjacent pieces can be found. Tables belong to the section they sit in: a section's pieces run in book order (text, table, text after the table); a new heading, real or bold, starts a new section. Ids are unique per book and stable across rebuilds. |
| `bookCheck.ts` | Line-level structural checks on a converted book: headings, tables (including titles captured inside tables and tables flattened into one line), page markers, HTML, garbled text, other text artifacts. |
| `chunkInspect.ts` | Chunk-level checks: short, duplicated, mid-sentence, oversized, orphan chunks, table titles without tables. |
| `chunkCompare.ts` | Compares the chunks stored in the index with what the chunker produces now: unchanged, moved, added, removed. The report groups moved chunks by their new location, largest groups first. |
| `reportFormat.ts` | Markdown report, findings grouped by severity (fix, review, info) and kind. |
| `fixList.ts` | Per-book fix list for correcting the Markdown by hand: tasks ordered by printed page, with a guide per kind of problem. Every kind that needs action must have a guide (a test enforces it). |
| `embedder.ts` | `Embedder` interface; `OllamaEmbedder` sends texts in batches. |
| `fusion.ts` | Reciprocal rank fusion of ranked lists. |
| `store.ts` | Builds the LanceDB index (vectors plus a keyword index) and searches it. Builds reuse vectors from an embedding cache keyed by a fingerprint of the model and the embedded text, so only new or changed chunks are embedded; builds report progress and stage timings. Search is hybrid by default, or vector or keyword alone. Results include the converter notes, so agents can warn about unreliable sources. `expand()` turns results into passages: neighbouring pieces of the same section, merged by section, within a size budget (12,000 characters by default; the pieces the search found are always kept). The radius counts text pieces only, so tables in between come along without using it up; a table's title is put in front of its rows; a table that doesn't fit is named in its place ("[Table 8: ..., not included]"). |

### `packages/shared/src`

| Module | Role |
| --- | --- |
| `gameSettings.ts` | Game settings chosen by each group at the start of a game: rules options from the books (ability score method I to VI, weapon proficiencies, non-weapon proficiencies, weapon specialization, Hovering on Death's Door) and DM style, our design (encounter difficulty, adjusting encounters in play, explaining rules). The easy, medium and difficult presets; customization, which marks changed settings as custom; plain descriptions with book references; `SETTING_EXPLANATIONS`, what each setting means, marked as a book rule (with its reference) or our design (with none), written only from what has been checked against the books, for agents to relay instead of improvising. |

### `packages/server/src`

| Module | Role |
| --- | --- |
| `config.ts` | Reads the settings from `.env` (model provider, model, temperature, context window, answer length, embedding model, Ollama address for embeddings from `OLLAMA_HOST` as in the knowledge package, index folder); errors name the variable to fix. |
| `llm/provider.ts` | `getChatModel()`: the only place that knows model providers; optional temperature and answer length overrides per use, so each agent asks for what its task needs. Passes the context window and answer length to Ollama (`num_ctx`, `num_predict`). |
| `answering/prompt.ts` | The instructions for answering rules questions (sources only, cite by number, say when the sources don't answer, mention exceptions and converter notes, answer in the question's language) and the messages sent to the model. |
| `answering/sources.ts` | Turns passages into numbered sources: book title, location, pages, converter notes, text. |
| `answering/citations.ts` | Finds the source numbers an answer cites; flags unknown numbers and answers citing nothing. |
| `answering/answerQuestion.ts` | The answering workflow: source budget from the window, search, expand, numbered sources, prompt check, model, citation and usage checks. Receives its search and model from outside, so tests use fakes. If the search finds nothing, the model is not called. |
| `llm/contextWindow.ts` | Keeps prompts inside the context window: estimates tokens (3 characters per token, deliberately pessimistic), derives the space left for sources, refuses a prompt that doesn't fit, and checks the token count the model reports. |
| `agents/agentLoop.ts` | The agent loop every agent uses: the model answers or requests tools; our code runs them and returns each result with its request's id; unknown tools, invalid arguments and tool errors go back to the model as text; a call repeated with the same arguments in a turn (compared with keys sorted, so order doesn't matter) is not run again, the model is reminded of the earlier result; an answer cut at the length limit (whichever provider reports it: `done_reason`, `finish_reason`, `stop_reason`) is continued automatically, up to twice and only if the conversation plus the answer so far fits the window, with the parts joined and only the whole answer kept in the history; a visible note if it's still cut; a round limit; the conversation and tool definitions checked against the context window before each call. Tools are plain functions with Zod schemas, converted to LangChain's format only to describe them to the model. |
| `agents/rulesTool.ts` | `search_rules`, the rules tool every agent shares: the answering workflow, returning the answer with the sources it cites, and saying plainly when it cites none. |
| `agents/setup/tools.ts` | The setup agent's session (the draft settings, held in code, changed only through `propose_settings` and validated each time) and its tools: `search_rules`, `describe_presets` (each setting's explanation once, then each preset's values, about 3,400 characters), `propose_settings` (flat arguments, one per setting, easier for small models; takes the four on/off settings, non-weapon proficiencies included, as exactly "on" or "off", the words the agent reads in every description, any letter case, refusing anything else with a message naming the two; each field's schema built separately so none is sent as a `$ref`; starts from the medium preset, saying so, when none was chosen; turns specialization off with weapon proficiencies and proficiencies on with specialization, saying so; refuses only explicit contradictions, as failures; ends a successful change telling the agent to show it and stop), `request_game_creation` (records the request; saves nothing). |
| `agents/setup/agent.ts` | `createSetupAgent`: builds the setup agent (session, tools with the rules search, model with tools bound, temperatures, 2,048-token answers, opening). Used by both `new-game` and `eval-setup`, so the evaluation measures the agent players get. |
| `agents/setup/prompt.ts` | The setup agent's instructions: ask the group's experience, recommend a preset showing its settings, explain settings with the explanations `describe_presets` gives and deeper rules through `search_rules`, never adding a reference the tools didn't give; apply changes, ask for a name, request creation. |
| `cli/evalSetup.ts` | The `eval-setup` command: plays the scenarios of `eval/setup-scenarios.json` against the real model, several times each, checks every conversation automatically, and writes a report with the transcripts. Creation is only requested, never performed. |
| `evaluation/setupEval.ts` | The setup agent evaluation: scenarios, the runner, and the checks (used tools, draft as expected, creation requested with the right name, no JSON in replies, no false creation claim, stayed in scope (a heuristic), no failed calls, no round limit), summaries and the report. |
| `cli/newGame.ts` | The `new-game` command: the setup conversation, with a 2,048-token answer limit for the agent (its window check uses the same number). Shows each settings change with its arguments and every refusal; `--verbose` shows every tool result in full. Creating the game requires the person at the keyboard to type yes, checked in code, not by the model. Input lines are read from a queue, so none are lost while the agent works. |
| `state/database.ts` | Opens the game database (`better-sqlite3`) and applies the schema changes it lacks, in order and once, tracked by SQLite's `user_version`. Changes are only ever added at the end, never edited. |
| `state/games.ts` | `GameStore`: create, get, list and update the settings of games. The only code that knows how games are stored; settings validated on every write and read. |
| `cli/ask.ts` | The `ask` command: opens the index, creates the model at temperature 0.1, runs the answering workflow with a spinner, prints the answer, the sources (cited ones marked), warnings and measurements. |
| `cli/evaluate.ts` | The `evaluate` command: checks the expected sections exist, runs every question through the answering workflow, saves the run, compares with the previous run of the same questions, writes a report to review. |
| `evaluation/questions.ts` | Reads and validates `eval/rules-questions.json`; finds expected sections that don't match any heading in the books. |
| `evaluation/runEvaluation.ts` | Scores what code can score reliably: retrieval (expected sections among the sources), grounding (the answer cites an expected section), declined traps; summaries and comparisons between runs of the same questions. |
| `evaluation/report.ts` | The evaluation report: summary, comparison, and each question with expected answer, answer, sources and an empty verdict. |
| `cli/errors.ts` | Turns model errors (Ollama not running, model not downloaded) into what to check. |

## Data

- `data/books/`: the book text in Markdown (`phb.md`, `dmg.md`), from the owner's own copies. Local only, ignored by Git. Files ending in `-condensed.md` are never indexed.
- `data/games.db`: the game database (SQLite), local only, ignored by Git.
- `data/index/`: the LanceDB index, and its `embedding_cache` table. Local only, ignored by Git. Rewritten on every `build-index`, reusing cached vectors for unchanged chunks; the cache keeps only the current chunks' vectors, and old table versions are deleted.
- `eval/rules-questions.json`: the rules evaluation set, committed. Expected answers are written in our own words, never copied from the books; each question is `draft` until checked against the books, then `confirmed`, and its note says where the expected answer came from.
- `data/eval/runs/`: saved evaluation runs, local only.
- `eval/setup-scenarios.json`: the setup agent's evaluation scenarios, committed: fixed player messages and the expected draft and game name, with expected values taken from the presets in code.
- `data/eval/setup-runs/`: saved setup agent evaluation runs, local only.
- `data/reports/`: check reports, fix lists, chunk comparisons and evaluation reports. Local only, ignored by Git, since they quote the books.
- Never commit, print in full, or reproduce book text in outputs to players. Agents may read and apply it, and cite where a rule comes from.

## Design principles

1. The model narrates, the code decides: every number on a character sheet or in combat comes from `rules`.
2. No agent states a rule from its own memory. Setting up a game, creating characters, designing campaigns and running play all go through the rules search in the knowledge package, and every rule an agent relies on is cited to its source. Exact numbers used in calculations come from data files checked against the books, table by table; anything they don't cover falls back to the rules search. When the books don't cover something, the agent says so and asks the players or the human DM instead of improvising a rule. The model's own creativity is for the story, never for the rules.
3. Tools are plain functions with Zod schemas; LangChain adapters wrap them for the agents, so an MCP adapter can be added later.
4. Tool errors are returned to the model as text, never thrown out of the agent loop; the loop has a round limit.
5. Only `packages/server/src/llm/provider.ts` knows about model providers.
6. The index records the embedding model that built it and refuses any other: vectors from different models are not comparable.
7. Game rules are settings, not code: each group chooses them at the start of a game, through a preset or by customizing it. Book options and DM style are kept apart in the settings.
8. Anything permanent an agent does needs a human confirmation enforced in code: the agent requests, the command asks the person, and only a typed yes acts. A model can misunderstand; a yes/no check in code can't.
9. Verify conversions and chunks on the real books, not only on test samples: after every chunker change, run `compare-chunks` before rebuilding the index.

## Commands

- `pnpm test`: all tests (Vitest)
- `pnpm typecheck`: TypeScript check across the workspace
- `pnpm --filter @dnd/knowledge check-books`: checks every book; full report in `data/reports/check-books.md`, and a fix list per book, ordered by page, in `data/reports/fix-list-<book>.md`
- `pnpm --filter @dnd/knowledge compare-chunks`: compares the index with the current chunker output; report in `data/reports/compare-chunks.md`
- `pnpm --filter @dnd/knowledge build-index`: rebuilds the index from `data/books` (needs Ollama running); reports progress, how many chunks were reused or embedded, and each stage's duration. In a terminal, a spinner line shows the current stage and its elapsed time, and during embedding the time since the last batch: a growing "last batch ... ago" means the build is waiting for Ollama; a spinner that stops turning means the build itself is blocked
- `pnpm --filter @dnd/knowledge search-rules "question" [--vector | --keyword] [--full | --context]`: searches the index; `--full` prints whole chunks, `--context` prints the passages exactly as the model will receive them
- `pnpm --filter @dnd/server check-model`: checks the configured model answers, and how fast
- `pnpm --filter @dnd/server evaluate [--only id1,id2]`: runs the rules evaluation; report in `data/reports/eval-<date>.md`, runs saved in `data/eval/runs/`
- `pnpm --filter @dnd/server games [create "name" --preset easy | show <id>]`: lists, creates and shows saved games, with each setting described and cited
- `pnpm --filter @dnd/server eval-setup [--runs N] [--only id1,id2]`: the setup agent evaluation, 3 conversations per scenario by default; report in `data/reports/eval-setup-<date>.md`, runs saved in `data/eval/setup-runs/`
- `pnpm --filter @dnd/server new-game [--verbose]`: sets up a new game in conversation with the setup agent; the person at the keyboard confirms creation
- `pnpm --filter @dnd/server ask "question"`: answers a rules question from the books, with numbered sources, warnings, and measurements (search and answer time, prompt size, estimated and reported tokens, real characters per token)

Rebuild the index after any change to the books, the chunker or the index format. After a chunker change, run `compare-chunks` first: it needs the old index to compare against.

Working loop for correcting the books by hand: open the PDF and `fix-list-<book>.md` side by side, work through the pages in order following each task's guide, run `check-books` after each session (fixed tasks disappear), and after a batch run `compare-chunks` and then `build-index`.

## Known pitfalls

- Never name a package script after a built-in pnpm command (`search`, `test`, `install`, `setup`...): the built-in wins and the script never runs. `pnpm setup` even starts installing pnpm globally: the setup agent's command is called `new-game` for that reason. `pnpm run <name>` always runs the script.
- LanceDB index configurations (`Index.fts()`) can only be used once: create a new one for each index.
- Never reuse one Zod schema object in several fields of a tool: the definition sent to the model turns the repeats into references (`$ref`) to the first field, which a small model can't follow. Build each field's schema with a function. A test checks every tool definition for `$ref`.
- Never let `better-sqlite3` move to version 13 while Node stays at 22.11: it crashes without an error message. Its type definitions come from `@types/better-sqlite3`.
- LanceDB prints "No existing dataset ... will be created" warnings straight to the terminal the first time a table is created (they cross the spinner line); `LANCE_LOG` and `RUST_LOG` don't silence them in this version. Harmless.
- The first LanceDB operation in a process loads its native library and can take seconds: index tests have a 15 s limit and a warm-up.
- Mixed fractions lost their space in the conversion ("31/2" for "3 1/2"): in VS Code, regex search `\b(\d)([123]/[234])\b` in `data/books` finds them; check each against the page before restoring the space.
- Ollama's answer limit (`num_predict`) has no fixed maximum: its default, -1, means no limit, and the real ceiling is the context window, which holds the prompt and the answer together. "No limit" lets a runaway answer fill the window, so each agent sets an explicit limit, and cut answers are continued instead.
- Ollama runs every model with its own default context window (4,096 tokens here) unless `num_ctx` is set, and a longer prompt is not refused: part of it is dropped, the beginning (the instructions) most at risk. The window and answer length are set in `.env` (`LLM_CONTEXT_TOKENS`, default 8,192; `LLM_MAX_ANSWER_TOKENS`, default 1,024) and checked in `llm/contextWindow.ts`.
- VS Code's search skips `data/books/` because it's in `.gitignore`: turn off "Use Exclude Settings and Ignore Files" in the search panel, search inside the open file with Cmd+F, or use `grep` in the terminal (macOS `grep` doesn't support `\b`).
- English stemming in keyword search handles regular plurals but not irregular ones (dwarf/dwarves, thief/thieves); vector search covers those.
- A bold subheading lasts until the next heading, like a real one: content after it that belongs to the parent section is attributed to the subheading. `compare-chunks` shows such cases.
- A bold line counts as a subheading only if it looks like a title: capitalized words, at most 8, no "Table N", not a school label in parentheses. A one-word subheading that isn't one (like "Water" in the List of Rings) can't be told apart by a rule: `compare-chunks` shows it as a group of moved chunks; remove the bold in the source.
- The book check reuses the chunker's `boldHeadingTitle` rule, so both always agree on what a bold subheading is.

## Working agreements

- `pnpm test` and `pnpm typecheck` must pass before every commit.
- Every change to `rules` or `knowledge` gets tests; agent tests use a scripted model, never a real one.
- Ask before adding a dependency; prefer MIT, Apache 2.0 or BSD licences.
- When a design depends on what the books say, Claude writes the questions for the rules search (`ask`) and Roger runs them, instead of Claude relying on memory; answers are checked against their sources, and doubtful ones against the PDF pages.
- Every agent has the same rules tool, built on the answering workflow, and its instructions require consulting it before stating, applying or explaining a rule.
- Agents are judged with repeatable evaluations (fixed scenarios, several runs each, automatic checks), not single conversations: at temperature 0.3, the same conversation can go differently twice.
- Tests of agent tools also check what the model is shown (the tool definitions as sent), not only what the tools accept.
- Agent instructions stay short (the setup agent's are capped at 220 words by a test): merge rules rather than adding patches.
- When updating this file, Claude starts from the latest version in the repository and checks that every edit given to apply by hand is still present, and that every package script has its line under Commands.
- Code, comments and identifiers in English. Player-facing input and output are **English-only for now** (decided after the first real answers, see Status): a working system that creates and runs games comes before multilingual support.

## Status

- Iteration 0 done: environment, packages and libraries installed.
- Iteration 1, knowledge base:
  - Done: chunker (1.3), book and chunk diagnostics (1.4), embeddings and index (1.5), hybrid search (1.6), chunker fixes from the diagnostics of the real books (1.6b, 1.6c), per-book fix lists for hand correction (1.6d). The chunker side is considered settled; remaining problems are in the transcription.
  - In progress: book conversions of `phb.md` and `dmg.md`, corrected with the help of `check-books`. Known source problems: table titles captured inside tables, tables flattened into one line or not rebuilt at all, scrambled sentence openings (mostly in the DMG), text in decorative fonts decoded as symbols, paragraphs cut by blank lines, subheadings written as bold text.
  - Settled: mid-sentence chunks in the DMG (about 60) come from the transcription (scrambled sentence openings, blank lines inside paragraphs), not from the chunker.
  - Quick source fixes: the DMG's name printed in a decorative font (`D!"#$%" l&'($) fuide`) can be replaced across the file with search and replace, after checking it against the page; split table titles (`#### Table 57` followed by the title on its own line) merged into one heading.
  - Source fixing: by hand, with the fix lists, as time allows. Proposed priority: the Player's Handbook tables iteration 2 needs (abilities, races, classes, saving throws, THAC0); the PDF converter remains an option for the rest.
  - Done: 1.7 ask the rules: 1.7a, connection to the model (`check-model`: 5.2 s for a one-word answer, first call); 1.7b, neighbouring pieces (`expand`, `--context`; requires an index rebuilt with piece numbers), revised so tables belong to their section and the text before a table is reachable from the text after it; 1.7b3, embedding cache, build progress and a spinner; 1.7c0, context window management (window set explicitly, token estimates, source budget derived from the window, prompt check before sending, usage check after); 1.7c, the answering workflow (single pass; the answer's language is left to the instructions, since telling Catalan from Spanish reliably needs a detection library) (a full build took 923 s once instead of the usual 210 s, cause unknown; progress reporting will show where time goes). 1.7d, the `ask` command (verified end to end against a stand-in Ollama: num_ctx 8192, num_predict 1024 and temperature 0.1 reach Ollama). First real answers (qwen2.5:7b, 16 to 21 s each, 4.2 to 4.3 characters per token): "Can a dwarf be a mage?" answered no correctly but claimed no exceptions exist, missing the DM's case-by-case advice in its own source, and ignored the converter note; a Catalan question was misread (see Backlog); the "advantage" trap (a 5th Edition mechanic) was answered with invented content citing real sources, which the citation checks cannot catch (motivates 1.9). Questions and answers are now English-only, with a fixed reply to other languages.
  - Done: 1.8, lean evaluation (tooling): 19 questions (16 rules, 3 traps from 5th Edition), all draft; the `evaluate` command scores retrieval, grounding and traps, and the report collects Roger's verdicts on content. Built and tested end to end; the baseline is deferred until the books are fixed (TODO, groups A and B).
- Plan: Iteration 2, game setup (settings and presets, saving games, the setup agent); 3, Character Designer; 4, Campaign Designer; 5, Game Master in play.
- Done: Iteration 2, game setup: 2.1, settings schema and presets, based on the rules search's answers and Roger's reading of PHB p. 70; the evaluation set grew to 29 questions with ten from that session. 2.2, saving games: SQLite through `better-sqlite3` 12 (chosen over MongoDB: no server to run, transactions built in, the same embedded approach as LanceDB), a versioned schema, and a `GameStore` behind which storage could change. 2.3, the setup agent, the project's first agent with tools (verified end to end against a stand-in Ollama, including tool requests in Ollama's format, two tools in one request, and creation only after a typed yes). Setup agent v1 stable after four tests with Qwen on the Mac and a measured baseline (see TODO item 17), tagged `setup-agent-v1`.
- Next: Iteration 3, Character Designer.
  - After 1.7: 1.8 evaluation (questions with known answers and known source sections); 1.9 evaluator-optimizer where 1.8 shows it helps (claim-by-claim support checks, one revision when a check fails, a new search when the sources don't answer), compared against the 1.8 baseline.
- Next iterations: 2, Character Designer; 3, Campaign Designer.

## TODO: deferred for better results

Work set aside to keep moving towards a playable system. Grouped by what each item waits for, in the order it would be done.

### A. Book sources (Roger, in progress)

1. Fix the Markdown books with the fix lists (`data/reports/fix-list-<book>.md`), working page by page against the PDFs. **Priority: the Player's Handbook tables the Character Designer (Iteration 3) needs** (abilities, races, classes, saving throws, THAC0).
2. Check every converter warning "header cells that were not detected" against the printed page: Table 1 was a false alarm (its top-left cell is empty in print too, which the converter flagged), but others may hide lost or shifted headings. Delete the comment only when the table matches the page.
3. Check the descriptions of ability score methods III, IV and VI in `packages/shared/src/gameSettings.ts` against PHB p. 18-19 (they come from the rules search's answer; I, II and V match the DMG's headings). On PHB p. 70, delete the truncated duplicate of the paragraph that starts "Even newly created, 1st-level characters have proficiencies", before the heading Acquiring Proficiencies.
4. Quick fixes: the DMG's name in a decorative font (`D!"#$%" l&'($) fuide`) by search and replace after checking it; split table titles (`#### Table 57` followed by the title on its own line) merged into one heading. Mixed fractions are already done.
5. After each batch: `check-books`, `compare-chunks`, `build-index` (the embedding cache keeps rebuilds short).

### B. Evaluation baseline (after A)

6. Run `evaluate`, fix the expected section titles it reports as missing, rerun those with `--only`.
7. Confirm the 29 questions against the books (2 already confirmed): correct each expected answer in our own words (never copied), write the charging modifiers from the book, set `status` to `confirmed`, commit `eval/rules-questions.json`.
8. Full run as the baseline; verdicts in the report (correct, partly right, wrong) with a reason (model, retrieval, book); share the summary.

### C. Answer quality (decide with the baseline from B)

9. Step 1.9, evaluator-optimizer: claim-by-claim support checks, one revision when a check fails, a new search when the sources don't answer; compared against the baseline. Motivated by the first real answers: a missed exception, an ignored converter note, and a trap answered with invented content citing real sources, which the citation checks can't catch.
10. Passage budget priority: the found pieces of all results always go in first, so weak results can crowd out the neighbours of strong ones (seen: the start of the Dwarves description dropped for the dwarf mage question). Options: a larger budget, bounded by the context window, or giving the best results their neighbours before weaker results are included.
11. Reranker, if the evaluation shows the first results are often in the wrong order.

### D. Performance and calibration

12. Calibrate `CHARS_PER_TOKEN` (3, pessimistic): `ask` measured 4.2 to 4.3 characters per token on the first four questions, and 3.9 to 4.8 on the eleven of the game setup session; 3 stays safely pessimistic.
13. Confirm with `ollama ps` that `qwen2.5:7b` runs with the 8,192-token window; measure how prompt length affects answer speed (first answers: 16 to 21 s for about 3,000 tokens).
14. One search took 10.8 s instead of 0.2 to 1.7 s: check with `ollama ps` right after a slow search whether the embedding model was unloaded to make room for the chat model.
15. One full build took 923 s instead of about 210 s, cause unknown: the progress line ("last batch ... ago") will show whether Ollama pauses, if it happens again.

### D2. Agents

16. How reliably `qwen2.5:7b` follows the setup agent's instructions and uses its tools (whether it calls `search_rules` for every rule, applies changes with `propose_settings`, waits for confirmation). First real test: turn 1 worked (presets read, medium applied for "some experience"); turn 2, a vague wish ("between beginners and mid"), ended in six `propose_settings` calls and the round limit, arguments not visible at the time. Fixed with: arguments and refusals shown, dependent settings changed together, a repeated-call guard in the loop, and instructions for vague wishes and refusals. Second test: no loop, a sensible custom mix in one call, creation handled correctly; but asked to explain the presets, it answered from memory without `search_rules`, with wrong explanations (Hovering on Death's Door, proficiencies) and invented page references for our design settings, and the answer was cut at the length limit. Fixed with explanations written in code from checked sources, references only from tools, and a note on truncated answers. Lesson: with a 7B model, instructions alone don't stop improvising; giving it correct text to relay does. Third test: explanations relayed correctly, but turn 2 looped again; the new display showed why: no preset had been applied in turn 1, so every change was refused for lack of a draft (a refusal the display didn't flag), and the model wrote yes/no settings as "off" text, as it reads them. Fixed with: start from medium when nothing is chosen, refusals reported as failures, tolerant yes/no values, a stop instruction after success, order-independent repeat detection. Lesson: every refusal must be visible, and tools should speak the same words the model reads: a single "on"/"off" pair, matching every description, instead of a growing list of accepted synonyms (Roger's suggestion). Answer limit raised to 2,048 tokens for the setup agent, with automatic continuation, instead of only noting truncation. Fourth test (with 2.3e): a more natural conversation, but the agent described the presets from memory with wrong values (methods, proficiencies, Hovering on Death's Door reversed), wrote tool arguments as JSON in its replies instead of calling tools, and said the game was created when `request_game_creation` was never called (the code guard saved nothing). A refused `nonweaponProficiencies: "on"` shows that setting still uses "off"/"allowed" instead of the single on/off pair. Decision (Roger): keep the agent conversational; a version where code shows the presets table and the draft (2.3f) was not applied.
17. Done (2.3g): full analysis after the fourth test. Found and fixed a defect from 2.3e (two on/off fields sent to the model as `$ref` pointers, with no type or values); `nonweaponProficiencies` takes "on"/"off" like the others; instructions consolidated from nine patches into five steps (210 words), adding the scope limit (the job ends at creation), never writing JSON or tool arguments, never announcing creation; agent construction shared by `new-game` and the new `eval-setup` evaluation. The 2,048-token answers and the continuation showed no effect either way (never triggered in the test). Restored in this file: principle 2, the rules-tool working agreement and the VS Code search pitfall, given earlier to apply by hand and lost in later generated versions.
    Baseline (`eval-setup`, qwen2.5:7b, 9 conversations, about 87 s each): tools used, draft as expected, creation requested, no JSON, stayed in scope, no failed calls, no round limit all 9/9; false creation claim 2/9 ("has been created... will now be asked to confirm"). Two checks were wrong on their first run and were fixed in 2.3h: names now compared ignoring letter case (the model capitalizes them), and the scope heuristic no longer matches the book reference "Rolling Ability Scores". 2.3h also stabilized the code: dead code removed (the compiler reports no unused code), the creation result stated plainly (the model had parroted its instruction-like wording), tests trimmed. **Setup agent v1: stable, tagged `setup-agent-v1`.**
18. Try a larger local model for agents (for example a 14B model) with the same `new-game` conversation, to tell the 7B model's limits from the design's: tool calls written as text and claims of actions not taken point to the model. Evaluate more systematically once several agents exist.

### E. Larger items

19. Multilingual support (Catalan, Spanish): the 7B model took a Catalan question for French, translated "nan" (dwarf) as "elf" and answered in English, and keyword search finds nothing for non-English words. Options: translate the player's question into English first, naming the language from settings rather than detecting it, with a glossary of game terms provided by Roger (not invented); search and answer in English; translate the answer back. A translation tool the Game Master can call for occasional cases. A larger or more multilingual model, measured against the evaluation.
20. PDF to Markdown converter (Python, Docling, a second reading of every table, OCR for scanned pages): table extraction is the weakest part of the current conversions.
21. MCP server exposing `search_rules` (iteration 1b, undecided).