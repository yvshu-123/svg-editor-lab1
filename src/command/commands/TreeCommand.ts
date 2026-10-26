import { AppError } from '../../shared/AppError.js';
import type { Command, CommandResult } from '../Command.js';
import type { Document } from '../../domain/Document.js';
import type { TreeRenderer } from '../../ports/Ports.js';

/** tree [id]：显示类命令，不进撤销栈。 */
export class TreeCommand implements Command {
  readonly kind = 'display' as const;

  constructor(
    private readonly renderer: TreeRenderer,
    private readonly rootId?: string,
  ) {}

  execute(document: Document): CommandResult {
    return { lines: this.renderer(document, this.rootId) };
  }

  undo(): CommandResult {
    throw new AppError('display command cannot be undone');
  }
}
