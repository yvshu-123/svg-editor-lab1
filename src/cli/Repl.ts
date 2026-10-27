import { createInterface } from 'node:readline';
import type { CommandHistory } from '../command/CommandHistory.js';
import type { Document } from '../domain/Document.js';
import { AppError } from '../shared/AppError.js';
import type { CommandRegistry } from './CommandRegistry.js';
import type { LineTokenizer } from './LineTokenizer.js';

export interface ReplDependencies {
  document: Document;
  history: CommandHistory;
  registry: CommandRegistry;
  tokenizer: LineTokenizer;
}

const NO_DOCUMENT = "no document. use 'init' or 'read' first";

/**
 * REPL 只做四件事：读一行、分词、分发、打印。
 * handleLine 返回字符串数组，测试可以不开终端直接驱动整个会话。
 */
export class Repl {
  private hasDocument = false;
  private exitRequested = false;

  constructor(private readonly deps: ReplDependencies) {}

  get shouldExit(): boolean {
    return this.exitRequested;
  }

  handleLine(line: string): string[] {
    try {
      const tokens = this.deps.tokenizer.tokenize(line);
      if (tokens === null) {
        return [];
      }
      return this.dispatch(tokens);
    } catch (error) {
      return [`error: ${messageOf(error)}`];
    }
  }

  start(input: NodeJS.ReadableStream = process.stdin, output: NodeJS.WritableStream = process.stdout): void {
    output.write("svg-editor 0.1 — type 'help' for commands\n\n");
    const readline = createInterface({ input, output, prompt: 'svg> ' });
    readline.prompt();

    readline.on('line', (line) => {
      for (const text of this.handleLine(line)) {
        output.write(`${text}\n`);
      }
      if (this.exitRequested) {
        readline.close();
        return;
      }
      readline.prompt();
    });

    readline.on('close', () => {
      output.write('\n');
    });
  }

  private dispatch(tokens: string[]): string[] {
    const name = tokens[0]!;

    if (name === 'quit' || name === 'exit') {
      this.exitRequested = true;
      return [];
    }

    if (name === 'undo' || name === 'redo') {
      this.requireDocument();
      const result =
        name === 'undo' ? this.deps.history.undo(this.deps.document) : this.deps.history.redo(this.deps.document);
      return result.lines;
    }

    const command = this.deps.registry.build(tokens);

    if (!this.hasDocument && name !== 'init' && name !== 'read' && name !== 'help') {
      throw new AppError(NO_DOCUMENT);
    }

    const result = this.deps.history.execute(command, this.deps.document);
    if (name === 'init' || name === 'read') {
      this.hasDocument = true;
    }
    return result.lines;
  }

  private requireDocument(): void {
    if (!this.hasDocument) {
      throw new AppError(NO_DOCUMENT);
    }
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
