# AD&D AI Game Master

Personal project: an agentic system for playing AD&D 2nd Edition with friends, running on open models locally. It is also a learning project, so explain the reasoning behind changes, not only the changes. Built incrementally: every iteration ends with something usable.

## Environment

- Node 22.11.0 (see `.node-version`). Do not upgrade Node or npm, and do not suggest it: another project on this machine depends on this version.
- pnpm through Corepack, version pinned in `package.json`. Run one command per line.
- Vitest 4 with Vite 6, forced by an override in `pnpm-workspace.yaml`, because newer Vite needs Node 22.12.
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
| `chunker.ts` | Splits a Markdown book by headings. A bold line standing alone (`**Weapons Allowed**`) counts as a subheading if it looks like a title (see Known pitfalls); a bold line repeating its own section's title is ignored. Tables are never cut; a "Table N" heading covers only its table (footnotes included, also plain `* ` ones), then text returns to the parent section. Page markers may be inline. Converter comments (`<!-- UNCLEAR: ... -->`) are removed from the text and kept as the chunk's `notes`. Ids are unique per book and stable across rebuilds. |
| `bookCheck.ts` | Line-level structural checks on a converted book: headings, tables (including titles captured inside tables and tables flattened into one line), page markers, HTML, garbled text, other text artifacts. |
| `chunkInspect.ts` | Chunk-level checks: short, duplicated, mid-sentence, oversized, orphan chunks, table titles without tables. |
| `chunkCompare.ts` | Compares the chunks stored in the index with what the chunker produces now: unchanged, moved, added, removed. The report groups moved chunks by their new location, largest groups first. |
| `reportFormat.ts` | Markdown report, findings grouped by severity (fix, review, info) and kind. |
| `fixList.ts` | Per-book fix list for correcting the Markdown by hand: tasks ordered by printed page, with a guide per kind of problem. Every kind that needs action must have a guide (a test enforces it). |
| `embedder.ts` | `Embedder` interface; `OllamaEmbedder` sends texts in batches. |
| `fusion.ts` | Reciprocal rank fusion of ranked lists. |
| `store.ts` | Builds the LanceDB index (vectors plus a keyword index) and searches it: hybrid by default, or vector or keyword alone. Results include the converter notes, so agents can warn about unreliable sources. |

### `packages/server/src`

| Module | Role |
| --- | --- |
| `config.ts` | Reads the settings from `.env` (model provider, model, temperature, embedding model, index folder); errors name the variable to fix. |
| `llm/provider.ts` | `getChatModel()`: the only place that knows model providers; optional temperature override per use. |
| `cli/errors.ts` | Turns model errors (Ollama not running, model not downloaded) into what to check. |

## Data

- `data/books/`: the book text in Markdown (`phb.md`, `dmg.md`), from the owner's own copies. Local only, ignored by Git. Files ending in `-condensed.md` are never indexed.
- `data/index/`: the LanceDB index. Local only, ignored by Git. Rebuilt from scratch on every `build-index`; old versions are deleted.
- `data/reports/`: check reports, fix lists and chunk comparisons. Local only, ignored by Git, since they quote the books.
- Never commit, print in full, or reproduce book text in outputs to players. Agents may read and apply it, and cite where a rule comes from.

## Design principles

1. The model narrates, the code decides: every number on a character sheet or in combat comes from `rules`.
2. RAG for prose (procedures, rules explained in text, guidance); structured data for numbers and tables.
3. Tools are plain functions with Zod schemas; LangChain adapters wrap them for the agents, so an MCP adapter can be added later.
4. Tool errors are returned to the model as text, never thrown out of the agent loop; the loop has a round limit.
5. Only `packages/server/src/llm/provider.ts` knows about model providers.
6. The index records the embedding model that built it and refuses any other: vectors from different models are not comparable.
7. Verify conversions and chunks on the real books, not only on test samples: after every chunker change, run `compare-chunks` before rebuilding the index.

## Commands

- `pnpm test`: all tests (Vitest)
- `pnpm typecheck`: TypeScript check across the workspace
- `pnpm --filter @dnd/knowledge check-books`: checks every book; full report in `data/reports/check-books.md`, and a fix list per book, ordered by page, in `data/reports/fix-list-<book>.md`
- `pnpm --filter @dnd/knowledge compare-chunks`: compares the index with the current chunker output; report in `data/reports/compare-chunks.md`
- `pnpm --filter @dnd/knowledge build-index`: rebuilds the index from `data/books` (needs Ollama running)
- `pnpm --filter @dnd/knowledge search-rules "question" [--vector | --keyword]`: searches the index
- `pnpm --filter @dnd/server check-model`: checks the configured model answers, and how fast

Rebuild the index after any change to the books, the chunker or the index format. After a chunker change, run `compare-chunks` first: it needs the old index to compare against.

Working loop for correcting the books by hand: open the PDF and `fix-list-<book>.md` side by side, work through the pages in order following each task's guide, run `check-books` after each session (fixed tasks disappear), and after a batch run `compare-chunks` and then `build-index`.

## Known pitfalls

- Never name a package script after a built-in pnpm command (`search`, `test`, `install`...): the built-in wins and the script never runs. `pnpm run <name>` always runs the script.
- LanceDB index configurations (`Index.fts()`) can only be used once: create a new one for each index.
- The first LanceDB operation in a process loads its native library and can take seconds: index tests have a 15 s limit and a warm-up.
- English stemming in keyword search handles regular plurals but not irregular ones (dwarf/dwarves, thief/thieves); vector search covers those.
- A bold subheading lasts until the next heading, like a real one: content after it that belongs to the parent section is attributed to the subheading. `compare-chunks` shows such cases.
- A bold line counts as a subheading only if it looks like a title: capitalized words, at most 8, no "Table N", not a school label in parentheses. A one-word subheading that isn't one (like "Water" in the List of Rings) can't be told apart by a rule: `compare-chunks` shows it as a group of moved chunks; remove the bold in the source.
- The book check reuses the chunker's `boldHeadingTitle` rule, so both always agree on what a bold subheading is.

## Working agreements

- `pnpm test` and `pnpm typecheck` must pass before every commit.
- Every change to `rules` or `knowledge` gets tests; agent tests use a scripted model, never a real one.
- Ask before adding a dependency; prefer MIT, Apache 2.0 or BSD licences.
- Code, comments and identifiers in English; player-facing output follows the configured language.

## Status

- Iteration 0 done: environment, packages and libraries installed.
- Iteration 1, knowledge base:
  - Done: chunker (1.3), book and chunk diagnostics (1.4), embeddings and index (1.5), hybrid search (1.6), chunker fixes from the diagnostics of the real books (1.6b, 1.6c), per-book fix lists for hand correction (1.6d). The chunker side is considered settled; remaining problems are in the transcription.
  - In progress: book conversions of `phb.md` and `dmg.md`, corrected with the help of `check-books`. Known source problems: table titles captured inside tables, tables flattened into one line or not rebuilt at all, scrambled sentence openings (mostly in the DMG), text in decorative fonts decoded as symbols, paragraphs cut by blank lines, subheadings written as bold text.
  - Settled: mid-sentence chunks in the DMG (about 60) come from the transcription (scrambled sentence openings, blank lines inside paragraphs), not from the chunker.
  - Quick source fixes: the DMG's name printed in a decorative font (`D!"#$%" l&'($) fuide`) can be replaced across the file with search and replace, after checking it against the page; split table titles (`#### Table 57` followed by the title on its own line) merged into one heading.
  - Source fixing: by hand, with the fix lists, as time allows. Proposed priority: the Player's Handbook tables iteration 2 needs (abilities, races, classes, saving throws, THAC0); the PDF converter remains an option for the rest.
  - In progress: 1.7 ask the rules. Done: 1.7a, connection to the model (`check-model`: 5.2 s for a one-word answer, on the first call). Next: 1.7b, neighbouring pieces (section and piece numbers on each chunk, `expand` with a size budget; requires an index rebuild); 1.7c, the answering workflow (search, expand, the model answers only from numbered sources with citations, the code checks the citations); 1.7d, the `ask` command.
  - After 1.7: 1.8 evaluation (questions with known answers and known source sections).
- Next iterations: 2, Character Designer; 3, Campaign Designer.

## Backlog

- PDF to Markdown converter (Python, Docling, a second reading of every table, OCR for scanned pages). Higher priority after the diagnostics: table extraction is the weakest part of the current conversions.
- Embedding cache, so a rebuild only embeds new or changed chunks.
- Reranker, if the evaluation shows the first results are often in the wrong order.
- MCP server exposing `search_rules` (iteration 1b, undecided).