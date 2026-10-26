import { AppError } from '../../shared/AppError.js';
import type { Command, CommandResult } from '../Command.js';
import type { Document } from '../../domain/Document.js';
import type { SvgWriterPort } from '../../ports/Ports.js';

/** save [file.svg]：不带参数时用读入路径；写成功后把路径记下来。 */
export class SaveCommand implements Command {
  readonly kind = 'io' as const;

  constructor(
    private readonly path: string | null,
    private readonly writer: SvgWriterPort,
  ) {}

  execute(document: Document): CommandResult {
    const target = this.path ?? document.sourcePath;
    if (target === null) {
      throw new AppError("no file path: use 'save <file.svg>'");
    }
    this.writer.write(document, target);
    document.sourcePath = target;
    return { lines: [`saved to ${target} (${document.count()} elements)`] };
  }

  undo(): CommandResult {
    throw new AppError('undo not allowed after io command');
  }
}
