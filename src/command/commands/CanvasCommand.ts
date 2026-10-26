import { AppError } from '../../shared/AppError.js';
import type { Command, CommandKind, CommandResult } from '../Command.js';
import type { Document } from '../../domain/Document.js';
import { formatNumber } from '../../shared/NumberFormat.js';

/**
 * canvas [w] [h]：不带参数只显示（display，不进撤销栈）；
 * 带参数改尺寸（io，执行后撤销锁住）。
 */
export class CanvasCommand implements Command {
  constructor(
    private readonly width?: number,
    private readonly height?: number,
  ) {}

  get kind(): CommandKind {
    return this.width === undefined ? 'display' : 'io';
  }

  execute(document: Document): CommandResult {
    if (this.width === undefined || this.height === undefined) {
      return { lines: [`canvas ${formatNumber(document.width)}x${formatNumber(document.height)}`] };
    }
    document.resize(this.width, this.height);
    return { lines: [`canvas ${formatNumber(this.width)}x${formatNumber(this.height)}`] };
  }

  undo(): CommandResult {
    throw new AppError('undo not allowed after io command');
  }
}
