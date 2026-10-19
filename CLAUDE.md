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
| `gameSettings.ts` | Game settings chosen by each group at the start of a game: rules options from the books (ability score method I to VI, weapon proficiencies, non-weapon proficiencies, weapon specialization, Hovering on Death's Door) and DM style, our design (encounter difficulty, adjusting encounters in play, explaining rules). The easy, medium and difficult presets; customization, which marks changed settings as custom; plain descriptions with book references. |

### `packages/server/src`

| Module | Role |
| --- | --- |
| `config.ts` | Reads the settings from `.env` (model provider, model, temperature, context window, answer length, embedding model, Ollama address for embeddings from `OLLAMA_HOST` as in the knowledge package, index folder); errors name the variable to fix. |
| `llm/provider.ts` | `getChatModel()`: the only place that knows model providers; optional temperature override per use. Passes the context window and answer length to Ollama (`num_ctx`, `num_predict`). |
| `answering/prompt.ts` | The instructions for answering rules questions (sources only, cite by number, say when the sources don't answer, mention exceptions and converter notes, answer in the question's language) and the messages sent to the model. |
| `answering/sources.ts` | Turns passages into numbered sources: book title, location, pages, converter notes, text. |
| `answering/citations.ts` | Finds the source numbers an answer cites; flags unknown numbers and answers citing nothing. |
| `answering/answerQuestion.ts` | The answering workflow: source budget from the window, search, expand, numbered sources, prompt check, model, citation and usage checks. Receives its search and model from outside, so tests use fakes. If the search finds nothing, the model is not called. |
| `llm/contextWindow.ts` | Keeps prompts inside the context window: estimates tokens (3 characters per token, deliberately pessimistic), derives the space left for sources, refuses a prompt that doesn't fit, and checks the token count the model reports. |
| `state/database.ts` | Opens the game database (`better-sqlite3`) and applies the schema changes it lacks, in order and once, tracked by SQLite's `user_version`. Changes are only ever added at the end, never edited. |
| `state/games.ts` | `GameStore`: create, get, list and update the settings of games. The only code that knows how games are stored; settings validated on every write and read. |
| `cli/ask.ts` | The `ask` command: opens the index, creates the model at temperature 0.1, runs the answering workflow with a spinner, prints the answer, the sources (cited ones marked), warnings and measurements. |
| `cli/evaluate.ts` | The `evaluate` command: checks the expected sections exist, runs every question through the answering workflow, saves the run, compares with the previous run of the same questions, writes a report to review. |
| `evaluation/questions.ts` | Reads and validates `eval/rules-questions.json`; finds expected sections that don't match any heading in the books. |
| `evaluation/runEvaluation.ts` | Scores what code can score reliably: retrieval (expected sections among the sources), grounding (the answer cites an expected section), declined traps; summaries and comparisons between runs of the same questions. |
| `evaluation/report.ts` | The evaluation report: summary, comparison, and each question with expected answer, answer, sources and an empty verdict. |
| `cli/errors.ts` | Turns model errors (Ollama not running, model not downloaded) into what to check. |
| `agents/agentLoop.ts` | The agent loop shared by every agent: the model answers or asks for tools; our code runs them and returns each result with its request's id; unknown tools, invalid arguments and failing tools go back to the model as text; at most 6 rounds; the conversation and tool definitions checked against the context window before each call; every tool use reported. |

## Data

- The whole `data/` folder is local only and ignored by Git (`.gitignore` has `data/`): books, index, reports, evaluation runs and the game database.
- `data/books/`: the book text in Markdown (`phb.md`, `dmg.md`), from the owner's own copies. Files ending in `-condensed.md` are never indexed.
- `data/games.db`: the game database (SQLite).
- `data/index/`: the LanceDB index, and its `embedding_cache` table. Rewritten on every `build-index`, reusing cached vectors for unchanged chunks; the cache keeps only the current chunks' vectors, and old table versions are deleted.
- `eval/rules-questions.json`: the rules evaluation set, committed. Expected answers are written in our own words, never copied from the books; each question is `draft` until checked against the books, then `confirmed`, and its note says where the expected answer came from.
- `data/eval/runs/`: saved evaluation runs, local only.
- `data/reports/`: check reports, fix lists, chunk comparisons and evaluation reports. They quote the books, which is why they must never be committed.
- Never commit, print in full, or reproduce book text in outputs to players. Agents may read and apply it, and cite where a rule comes from.

## Design principles

1. The model narrates, the code decides: every number on a character sheet or in combat comes from `rules`.
2. No agent states a rule from its own memory. Setting up a game, creating characters, designing campaigns and running play all go through the rules search in the knowledge package, and every rule an agent relies on is cited to its source. Exact numbers used in calculations come from data files checked against the books, table by table; anything they don't cover falls back to the rules search. When the books don't cover something, the agent says so and asks the players or the human DM instead of improvising a rule. The model's own creativity is for the story, never for the rules.
3. Tools are plain functions with Zod schemas; LangChain adapters wrap them for the agents, so an MCP adapter can be added later.
4. Tool errors are returned to the model as text, never thrown out of the agent loop; the loop has a round limit.
5. Only `packages/server/src/llm/provider.ts` knows about model providers.
6. The index records the embedding model that built it and refuses any other: vectors from different models are not comparable.
7. Game rules are settings, not code: each group chooses them at the start of a game, through a preset or by customizing it. Book options and DM style are kept apart in the settings.
8. Verify conversions and chunks on the real books, not only on test samples: after every chunker change, run `compare-chunks` before rebuilding the index.

## Commands

- `pnpm test`: all tests (Vitest)
- `pnpm typecheck`: TypeScript check across the workspace
- `pnpm --filter @dnd/knowledge check-books`: checks every book; full report in `data/reports/check-books.md`, and a fix list per book, ordered by page, in `data/reports/fix-list-<book>.md`
- `pnpm --filter @dnd/knowledge compare-chunks`: compares the index with the current chunker output; report in `data/reports/compare-chunks.md`
- `pnpm --filter @dnd/knowledge build-index`: rebuilds the index from `data/books` (needs Ollama running); reports progress, how many chunks were reused or embedded, and each stage's duration. In a terminal, a spinner line shows the current stage and its elapsed time, and during embedding the time since the last batch: a growing "last batch ... ago" means the build is waiting for Ollama; a spinner that stops turning means the build itself is blocked
- `pnpm --filter @dnd/knowledge search-rules "question" [--vector | --keyword] [--full | --context]`: searches the index; `--full` prints whole chunks, `--context` prints the passages exactly as the model will receive them
- `pnpm --filter @dnd/server check-model`: checks the configured model answers, and how fast
- `pnpm --filter @dnd/server evaluate [--only id1,id2]`: runs the rules evaluation; report in `data/reports/eval-<date>.md`, runs saved in `data/eval/runs/`
- `pnpm --filter @dnd/server ask "question"`: answers a rules question from the books, with numbered sources, warnings, and measurements (search and answer time, prompt size, estimated and reported tokens, real characters per token)
- `pnpm --filter @dnd/server games [create "name" --preset easy | show <id> | delete <id> | clear]`: lists, creates, shows and deletes saved games, with each setting described and cited; `delete` and `clear` ask for a typed yes

Rebuild the index after any change to the books, the chunker or the index format. After a chunker change, run `compare-chunks` first: it needs the old index to compare against.

Working loop for correcting the books by hand: open the PDF and `fix-list-<book>.md` side by side, work through the pages in order following each task's guide, run `check-books` after each session (fixed tasks disappear), and after a batch run `compare-chunks` and then `build-index`.

## Known pitfalls

- Never name a package script after a built-in pnpm command (`search`, `test`, `install`, `setup`...): the built-in wins and the script never runs; `pnpm setup` even starts installing pnpm globally. `pnpm run <name>` always runs the script.
- `.gitignore` had no final line break: appending with `echo ... >>` would glue the new rule to the last line. Edit it in the editor. Until it ignored the whole `data/` folder, reports quoting the books and the game database were committed; they remain in the public repository's history (see TODO).
- VS Code's search skips `data/books/` because it's ignored by Git: turn off "Use Exclude Settings and Ignore Files" in the search panel, search inside the open file with Cmd+F, or use `grep` in the terminal (macOS `grep` doesn't support `\b`).
- Never reuse one Zod schema object in several fields of a tool: the definition sent to the model turns the repeats into references (`$ref`) to the first field, which a small model can't follow. Build each field's schema with a function.
- LanceDB index configurations (`Index.fts()`) can only be used once: create a new one for each index.
- Never let `better-sqlite3` move to version 13 while Node stays at 22.11: it crashes without an error message. Its type definitions come from `@types/better-sqlite3`.
- LanceDB prints "No existing dataset ... will be created" warnings straight to the terminal the first time a table is created (they cross the spinner line); `LANCE_LOG` and `RUST_LOG` don't silence them in this version. Harmless.
- The first LanceDB operation in a process loads its native library and can take seconds: index tests have a 15 s limit and a warm-up.
- Mixed fractions lost their space in the conversion ("31/2" for "3 1/2"): in VS Code, regex search `\b(\d)([123]/[234])\b` in `data/books` finds them; check each against the page before restoring the space.
- Ollama runs every model with its own default context window (4,096 tokens here) unless `num_ctx` is set, and a longer prompt is not refused: part of it is dropped, the beginning (the instructions) most at risk. The window and answer length are set in `.env` (`LLM_CONTEXT_TOKENS`, default 8,192; `LLM_MAX_ANSWER_TOKENS`, default 1,024) and checked in `llm/contextWindow.ts`.
- English stemming in keyword search handles regular plurals but not irregular ones (dwarf/dwarves, thief/thieves); vector search covers those.
- A bold subheading lasts until the next heading, like a real one: content after it that belongs to the parent section is attributed to the subheading. `compare-chunks` shows such cases.
- A bold line counts as a subheading only if it looks like a title: capitalized words, at most 8, no "Table N", not a school label in parentheses. A one-word subheading that isn't one (like "Water" in the List of Rings) can't be told apart by a rule: `compare-chunks` shows it as a group of moved chunks; remove the bold in the source.
- The book check reuses the chunker's `boldHeadingTitle` rule, so both always agree on what a bold subheading is.

## Working agreements

- `pnpm test` and `pnpm typecheck` must pass before every commit.
- Every change to `rules` or `knowledge` gets tests; agent tests use a scripted model, never a real one.
- Ask before adding a dependency; prefer MIT, Apache 2.0 or BSD licences.
- When a design depends on what the books say, Claude writes the questions for the rules search (`ask`) and Roger runs them, instead of Claude relying on memory; answers are checked against their sources, and doubtful ones against the PDF pages.
- Every agent has the same rules tool (`search_rules`), built on the answering workflow, and its instructions require consulting it before stating, applying or explaining a rule.
- Agents are judged with repeatable evaluations (fixed scenarios, several runs each, automatic checks), not single conversations: at temperature 0.3, the same conversation can go differently twice.
- Change one thing at a time in an agent, and measure it, before changing the next.
- Tests of agent tools also check what the model is shown (the tool definitions as sent), not only what the tools accept.
- Agent instructions stay short: merge rules rather than adding patches.
- Commit after every step that passes its tests and checks; never leave work uncommitted across steps.
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
- In progress: Iteration 2. Done: 2.1, settings schema and presets, based on the rules search's answers and Roger's reading of PHB p. 70; the evaluation set grew to 29 questions with ten from that session. 2.2, saving games: SQLite through `better-sqlite3` 12 (chosen over MongoDB: no server to run, transactions built in, the same embedded approach as LanceDB), a versioned schema, and a `GameStore` behind which storage could change; 2.2b, deleting one game or all of them, from the store and the `games` command, after a typed yes.
  - 2.3, the setup agent: a first attempt (2.3 to 2.3h, never committed on `main`) is kept on the branch `setup-agent-experiments`. Its lessons are in Working agreements and Known pitfalls: with a 7B model, many small patches made the agent worse; single conversations misled every judgement; a shared schema object reached the model as `$ref` pointers. Being rebuilt from 2.2 in small, measured, committed steps, around four requirements: show the three presets, build a custom combination, explain presets by searching the books (`search_rules`, shared), create the game with the chosen settings.
- Next: 2.3 rebuilt from scratch on `main`, nothing taken from the branch: a basic, informative game creation agent (show the presets, build the chosen settings, explain them by searching the books, create the game after a typed yes). It doesn't design characters or campaigns, nor act as Game Master. Steps: 2.3.1 agent loop, 2.3.2 shared `search_rules`, 2.3.3 the setup tools, 2.3.4 instructions and `new-game` with a manual test, 2.3.5 adjustments only if needed.
- Done: 2.3.1, the agent loop.

## TODO: deferred for better results

Work set aside to keep moving towards a playable system. Grouped by what each item waits for, in the order it would be done.

### A. Book sources (Roger, in progress)

1. Fix the Markdown books with the fix lists (`data/reports/fix-list-<book>.md`), working page by page against the PDFs. **Priority: the Player's Handbook tables Iteration 2 needs** (abilities, races, classes, saving throws, THAC0).
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

### E. Larger items

16. Multilingual support (Catalan, Spanish): the 7B model took a Catalan question for French, translated "nan" (dwarf) as "elf" and answered in English, and keyword search finds nothing for non-English words. Options: translate the player's question into English first, naming the language from settings rather than detecting it, with a glossary of game terms provided by Roger (not invented); search and answer in English; translate the answer back. A translation tool the Game Master can call for occasional cases. A larger or more multilingual model, measured against the evaluation.
17. PDF to Markdown converter (Python, Docling, a second reading of every table, OCR for scanned pages): table extraction is the weakest part of the current conversions.
18. MCP server exposing `search_rules` (iteration 1b, undecided).
19. Remove the book excerpts from the public repository's history: reports and evaluation runs under `data/` were committed (commits on `main` since hybrid search, and the experiments branch). With `git filter-repo --path data/ --invert-paths`, after a full backup, then a force-push of both branches; GitHub may keep old commits cached until its support purges them.
20. Try a larger local model for agents (for example a 14B model) on the same evaluation scenarios, to tell the 7B model's limits from the design's.