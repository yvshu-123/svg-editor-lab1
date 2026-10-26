import { AppError } from '../../shared/AppError.js';
import type { Command, CommandResult } from '../Command.js';
import type { Document } from '../../domain/Document.js';
import type { ShapeRenderer } from '../../ports/Ports.js';

/** show <id>：显示单个图形的属性明细，不进撤销栈。 */
export class ShowCommand implements Command {
  readonly kind = 'display' as const;

  constructor(
    private readonly renderer: ShapeRenderer,
    private readonly shapeId: string,
  ) {}

  execute(document: Document): CommandResult {
    return { lines: this.renderer(document, this.shapeId) };
  }

  undo(): CommandResult {
    throw new AppError('display command cannot be undone');
  }
}
