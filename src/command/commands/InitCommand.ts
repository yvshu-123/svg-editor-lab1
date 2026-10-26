import { AppError } from '../../shared/AppError.js';
import type { Command, CommandResult } from '../Command.js';
import type { Document } from '../../domain/Document.js';
import { formatNumber } from '../../shared/NumberFormat.js';

/** init [w] [h]：新建空画布。io 命令，执行完 undo/redo 锁住。 */
export class InitCommand implements Command {
  readonly kind = 'io' as const;

  constructor(
    private readonly width = 800,
    private readonly height = 600,
  ) {}

  execute(document: Document): CommandResult {
    document.clear();
    document.resize(this.width, this.height);
    document.sourcePath = null;
    return { lines: [`canvas ${formatNumber(this.width)}x${formatNumber(this.height)} created`] };
  }

  undo(): CommandResult {
    throw new AppError('undo not allowed after io command');
  }
}
