import { z } from "zod";

/** A section where an answer is expected: a book, and a heading title in that book. */
const SectionSchema = z.object({ book: z.string().min(1), section: z.string().min(1) });

const QuestionSchema = z
  .object({
    /** Short, stable name, used to compare runs. */
    id: z.string().regex(/^[a-z0-9-]+$/, "id must use lowercase letters, digits and dashes"),
    question: z.string().min(1),
    /** "rule": the books answer it. "trap": a mechanic from another edition, which the system should decline. */
    kind: z.enum(["rule", "trap"]),
    /** The expected answer in one or two sentences, in our own words, never copied from the books. */
    expected: z.string().min(1),
    expectedSections: z.array(SectionSchema),
    /** "draft" until checked against the books, then "confirmed". */
    status: z.enum(["draft", "confirmed"]),
    /** Where the expected answer comes from. */
    note: z.string().optional(),
  })
  .refine((q) => q.kind === "trap" || q.expectedSections.length > 0, { message: "rule questions need at least one expected section" });

export type EvalQuestion = z.infer<typeof QuestionSchema>;
export type ExpectedSection = z.infer<typeof SectionSchema>;

/** Reads and validates a question set; errors name the question and what is wrong with it. */
export function parseQuestions(json: string): EvalQuestion[] {
  const raw: unknown = JSON.parse(json);
  if (!Array.isArray(raw)) throw new Error("The question file must contain a list of questions.");
  const questions = raw.map((item, i) => {
    const result = QuestionSchema.safeParse(item);
    if (!result.success) {
      const id = (item as { id?: string })?.id ?? `question ${i + 1}`;
      throw new Error(`${id}: ${result.error.issues.map((issue) => issue.message).join("; ")}`);
    }
    return result.data;
  });
  const seen = new Set<string>();
  for (const q of questions) {
    if (seen.has(q.id)) throw new Error(`duplicate id: ${q.id}`);
    seen.add(q.id);
  }
  return questions;
}

/**
 * Expected sections that don't appear as a heading in that book: usually a title written differently
 * from the book's heading. Checked before running, so a typo isn't mistaken for a retrieval failure.
 */
export function missingSections(
  questions: EvalQuestion[],
  headings: { book: string; headingPath: string[] }[],
): { id: string; book: string; section: string }[] {
  const known = new Set(headings.flatMap((h) => h.headingPath.map((title) => `${h.book}|${title.toLowerCase()}`)));
  return questions.flatMap((q) =>
    q.expectedSections.filter((s) => !known.has(`${s.book}|${s.section.toLowerCase()}`)).map((s) => ({ id: q.id, ...s })),
  );
}