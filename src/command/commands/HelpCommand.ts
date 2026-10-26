import { AppError } from '../../shared/AppError.js';
import type { Command, CommandResult } from '../Command.js';
import type { Document } from '../../domain/Document.js';

/** help：文本由 cli 层给，这里只负责输出。 */
export class HelpCommand implements Command {
  readonly kind = 'display' as const;

  constructor(private readonly lines: string[]) {}

  execute(_document: Document): CommandResult {
    return { lines: [...this.lines] };
  }

  undo(): CommandResult {
    throw new AppError('display command cannot be undone');
  }
}
