import { AppError } from '../../shared/AppError.js';
import type { Command, CommandResult } from '../Command.js';
import type { Document } from '../../domain/Document.js';
import type { SvgReaderPort } from '../../ports/Ports.js';

/** read <file.svg>：警告行排在摘要前面。 */
export class ReadCommand implements Command {
  readonly kind = 'io' as const;

  constructor(
    private readonly path: string,
    private readonly reader: SvgReaderPort,
  ) {}

  execute(document: Document): CommandResult {
    const result = this.reader.read(this.path);
    document.restoreFrom(result.document);
    document.sourcePath = this.path;
    return {
      lines: [...result.warnings, `read ${this.path} (${document.count()} elements)`],
    };
  }

  undo(): CommandResult {
    throw new AppError('undo not allowed after io command');
  }
}
