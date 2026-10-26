import { AppError } from '../shared/AppError.js';
import type { Command, CommandResult } from './Command.js';
import type { Document } from '../domain/Document.js';

/**
 * 用快照实现撤销的编辑命令基类。
 *
 * 为什么不用反着算：scale 是浮点乘法，用除法撤销会得到
 * 0.30000000000000004 这种数，tree 的输出马上就不对了。
 * 代价是内存跟文档大小成正比，作业这个规模可以接受。
 */
export abstract class SnapshotCommand implements Command {
  readonly kind = 'edit' as const;

  private before: Document | null = null;
  private after: Document | null = null;

  execute(document: Document): CommandResult {
    this.before = document.clone();
    this.apply(document);
    this.after = document.clone();
    return { lines: this.describe(document) };
  }

  undo(document: Document): CommandResult {
    if (this.before === null) {
      throw new AppError('command has not been executed');
    }
    document.restoreFrom(this.before);
    return { lines: this.describeUndo(document) };
  }

  redo(document: Document): CommandResult {
    if (this.after === null) {
      throw new AppError('command has not been executed');
    }
    document.restoreFrom(this.after);
    return { lines: this.describe(document) };
  }

  /** 真正改文档的地方。所有校验都要在改动之前完成。 */
  protected abstract apply(document: Document): void;

  /** 执行完 / 重做后的回显。 */
  protected abstract describe(document: Document): string[];

  /** 撤销后的回显，默认跟执行时一样。 */
  protected describeUndo(document: Document): string[] {
    return this.describe(document);
  }
}
