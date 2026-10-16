/** The part of an output stream the spinner needs; process.stdout fits, and tests pass a fake. */
export interface SpinnerStream {
  isTTY?: boolean;
  write(text: string): boolean;
}

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const INTERVAL_MS = 80;
/** Carriage return + clear line: moves to the start of the line and erases it. */
const CLEAR_LINE = "\r\x1b[K";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";

/**
 * A one-line spinner for long command-line tasks. It redraws about 12 times a second with the text
 * returned by a function, so live values such as elapsed time stay current. If the program blocks,
 * the spinner stops turning, which is itself a sign that something is stuck.
 * In a non-terminal output (a file, a pipe), it doesn't animate and only prints log lines.
 */
export class Spinner {
  private timer?: ReturnType<typeof setInterval>;
  private frame = 0;
  private text: () => string = () => "";

  constructor(private readonly stream: SpinnerStream = process.stdout) {}

  private get animated(): boolean {
    return Boolean(this.stream.isTTY);
  }

  /** Starts spinning with the given text, or replaces the text if already spinning. */
  start(text: () => string): void {
    this.text = text;
    if (!this.animated || this.timer) return;
    this.stream.write(HIDE_CURSOR);
    this.draw();
    this.timer = setInterval(() => this.draw(), INTERVAL_MS);
  }

  /** Prints a line above the spinner, which keeps spinning below it. */
  log(line: string): void {
    if (this.timer) this.stream.write(CLEAR_LINE);
    this.stream.write(`${line}\n`);
    if (this.timer) this.draw();
  }

  /** Stops spinning, clears the spinner line and restores the cursor. Safe to call more than once. */
  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = undefined;
    this.stream.write(CLEAR_LINE + SHOW_CURSOR);
  }

  private draw(): void {
    this.frame = (this.frame + 1) % FRAMES.length;
    this.stream.write(`${CLEAR_LINE}${FRAMES[this.frame]} ${this.text()}`);
  }
}