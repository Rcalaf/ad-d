import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Spinner } from "../src/cli/spinner";

/** A fake output stream that records what is written to it. */
function fakeStream(isTTY: boolean) {
  const writes: string[] = [];
  return { isTTY, writes, write: (text: string) => (writes.push(text), true) };
}

describe("Spinner", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("redraws its line with a new frame and the current text while running", () => {
    const stream = fakeStream(true);
    let count = 0;
    const spinner = new Spinner(stream);
    spinner.start(() => `Embedding ${count}`);
    count = 5;
    vi.advanceTimersByTime(80);
    count = 9;
    vi.advanceTimersByTime(80);
    const frames = stream.writes.filter((w) => w.includes("Embedding"));
    expect(frames.at(-2)).toContain("Embedding 5");
    expect(frames.at(-1)).toContain("Embedding 9");
    // Each frame starts with the invisible "clear line" sequence; the spinner symbol comes right after it.
    const symbol = (frame: string) => frame.replace("\r\x1b[K", "")[0];
    expect(symbol(frames.at(-2)!)).not.toBe(symbol(frames.at(-1)!));
    spinner.stop();
  });

  it("prints a log line above the spinner, clearing the spinner line first", () => {
    const stream = fakeStream(true);
    const spinner = new Spinner(stream);
    spinner.start(() => "Working");
    spinner.log("Cache: 10 chunks unchanged");
    const i = stream.writes.findIndex((w) => w.includes("Cache:"));
    expect(stream.writes[i - 1]).toContain("\r\x1b[K");
    expect(stream.writes[i]).toBe("Cache: 10 chunks unchanged\n");
    expect(stream.writes.slice(i + 1).join("")).toContain("Working");
    spinner.stop();
  });

  it("stops redrawing and clears its line when stopped", () => {
    const stream = fakeStream(true);
    const spinner = new Spinner(stream);
    spinner.start(() => "Working");
    spinner.stop();
    const after = stream.writes.length;
    vi.advanceTimersByTime(1000);
    expect(stream.writes.length).toBe(after);
    expect(stream.writes.join("")).toContain("\r\x1b[K");
  });

  it("doesn't animate when the output is not a terminal, but still prints log lines", () => {
    const stream = fakeStream(false);
    const spinner = new Spinner(stream);
    spinner.start(() => "Working");
    vi.advanceTimersByTime(1000);
    spinner.log("Index built");
    spinner.stop();
    expect(stream.writes).toEqual(["Index built\n"]);
  });
});