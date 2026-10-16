import type { Passage } from "@dnd/knowledge";

/** A numbered source, as shown to the model and listed with the answer. */
export interface Source {
  number: number;
  book: string;
  /** The book's title, from the first heading of its file. */
  title: string;
  /** Where in the book: chapter and sections, without the title. */
  location: string;
  pages: number[];
  notes: string[];
}

export function toSources(passages: Passage[]): Source[] {
  return passages.map((p, i) => ({
    number: i + 1,
    book: p.book,
    title: p.headingPath[0] ?? p.book,
    location: p.headingPath.slice(1).join(" > "),
    pages: p.pages,
    notes: p.notes,
  }));
}

/** A source's heading line: "[1] Player's Handbook · Chapter 2 > Dwarves · p. 27-28". */
export function sourceHeading(source: Source): string {
  const pages = source.pages.length ? ` · p. ${source.pages[0]}${source.pages.length > 1 ? `-${source.pages.at(-1)}` : ""}` : "";
  return `[${source.number}] ${source.title}${source.location ? ` · ${source.location}` : ""}${pages}`;
}

/** The sources as one text for the model: each heading, any converter notes, then the passage. */
export function formatSources(passages: Passage[]): string {
  const sources = toSources(passages);
  return passages
    .map((passage, i) => {
      const notes = sources[i].notes.map((note) => `Converter note: ${note}\n`).join("");
      return `${sourceHeading(sources[i])}\n${notes}${passage.text}`;
    })
    .join("\n\n");
}