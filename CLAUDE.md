# AD&D AI Game Master

Personal project: an agentic system for playing AD&D 2nd Edition with friends, running on open models locally. It is also a learning project, so explain the reasoning behind changes, not only the changes. Built incrementally: every iteration ends with something usable.

## Environment

- Node 22.11.0 (see `.node-version`). Do not upgrade Node or npm, and do not suggest it: another project on this machine depends on this version.
- pnpm through Corepack, version pinned in `package.json`. Run one command per line.
- Vitest 4 with Vite 6, forced by an override in `pnpm-workspace.yaml`, because newer Vite needs Node 22.12.
- Local models through Ollama: `qwen2.5:7b` for chat, `bge-m3` for embeddings.

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
| `chunker.ts` | Splits a Markdown book by headings. Tables are never cut; a "Table N:" heading covers only its table (footnotes included), then text returns to the parent section. Page markers (`<!-- page N -->`) may be inline. Ids are unique per book and stable across rebuilds. |
| `bookCheck.ts` | Line-level structural checks on a converted book: headings, tables, page markers, HTML, text artifacts. |
| `chunkInspect.ts` | Chunk-level checks: short, duplicated, mid-sentence, oversized, orphan chunks, table titles without tables. |
| `reportFormat.ts` | Markdown report, findings grouped by severity (fix, review, info) and kind. |
| `embedder.ts` | `Embedder` interface; `OllamaEmbedder` sends texts in batches. |
| `fusion.ts` | Reciprocal rank fusion of ranked lists. |
| `store.ts` | Builds the LanceDB index (vectors plus a keyword index) and searches it: hybrid by default, or vector or keyword alone. |

## Data

- `data/books/`: the book text in Markdown (`phb.md`, `dmg.md`), from the owner's own copies. Local only, ignored by Git. Files ending in `-condensed.md` are never indexed.
- `data/index/`: the LanceDB index. Local only, ignored by Git. Rebuilt from scratch on every `build-index`; old versions are deleted.
- `data/reports/`: check reports. Local only, ignored by Git, since they quote the books.
- Never commit, print in full, or reproduce book text in outputs to players. Agents may read and apply it, and cite where a rule comes from.

## Design principles

1. The model narrates, the code decides: every number on a character sheet or in combat comes from `rules`.
2. RAG for prose (procedures, rules explained in text, guidance); structured data for numbers and tables.
3. Tools are plain functions with Zod schemas; LangChain adapters wrap them for the agents, so an MCP adapter can be added later.
4. Tool errors are returned to the model as text, never thrown out of the agent loop; the loop has a round limit.
5. Only `packages/server/src/llm/provider.ts` knows about model providers.
6. The index records the embedding model that built it and refuses any other: vectors from different models are not comparable.
7. Verify conversions and chunks on the real books, not only on test samples: compare chunker output before and after every chunker change.

## Commands

- `pnpm test`: all tests (Vitest)
- `pnpm typecheck`: TypeScript check across the workspace
- `pnpm --filter @dnd/knowledge check-books`: checks every book; full report in `data/reports/check-books.md`
- `pnpm --filter @dnd/knowledge build-index`: rebuilds the index from `data/books` (needs Ollama running)
- `pnpm --filter @dnd/knowledge search-rules "question" [--vector | --keyword]`: searches the index

Rebuild the index after any change to the books, the chunker or the index format.

## Known pitfalls

- Never name a package script after a built-in pnpm command (`search`, `test`, `install`...): the built-in wins and the script never runs. `pnpm run <name>` always runs the script.
- LanceDB index configurations (`Index.fts()`) can only be used once: create a new one for each index.
- The first LanceDB operation in a process loads its native library and can take seconds: index tests have a 15 s limit and a warm-up.
- English stemming in keyword search handles regular plurals but not irregular ones (dwarf/dwarves, thief/thieves); vector search covers those.

## Working agreements

- `pnpm test` and `pnpm typecheck` must pass before every commit.
- Every change to `rules` or `knowledge` gets tests; agent tests use a scripted model, never a real one.
- Ask before adding a dependency; prefer MIT, Apache 2.0 or BSD licences.
- Code, comments and identifiers in English; player-facing output follows the configured language.

## Status

- Iteration 0 done: environment, packages and libraries installed.
- Iteration 1, knowledge base:
  - Done: chunker (1.3), book and chunk diagnostics (1.4), embeddings and index (1.5), hybrid search (1.6).
  - In progress: book conversions of `phb.md` and `dmg.md`, corrected with the help of `check-books`.
  - Next: 1.7 ask the rules (the chat model answers from retrieved sections, with citations); 1.8 evaluation (questions with known answers).
- Next iterations: 2, Character Designer; 3, Campaign Designer.

## Backlog

- PDF to Markdown converter (Python, Docling, a second reading of every table, OCR for scanned pages).
- Chunk comparison tool: which chunks were added, removed or moved between two chunker versions.
- Embedding cache, so a rebuild only embeds new or changed chunks.
- Reranker, if the evaluation shows the first results are often in the wrong order.
- MCP server exposing `search_rules` (iteration 1b, undecided).
