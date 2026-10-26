import { AppError } from '../shared/AppError.js';
import type { Command, CommandResult } from './Command.js';
import type { Document } from '../domain/Document.js';

/**
 * 撤销栈 + io 锁。
 *
 * 作业 §4.3 说：文档类命令执行后 undo/redo 禁止，直到下一次编辑命令解禁。
 * 这里落成两件事：io 命令清空历史并上锁，编辑命令执行时解锁。
 */
export class CommandHistory {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];
  private locked = false;

  execute(command: Command, document: Document): CommandResult {
    if (command.kind === 'display') {
      return command.execute(document);
    }

    if (command.kind === 'io') {
      const result = command.execute(document);
      this.undoStack.length = 0;
      this.redoStack.length = 0;
      this.locked = true;
      return result;
    }

    const result = command.execute(document);
    this.undoStack.push(command);
    this.redoStack.length = 0;
    this.locked = false;
    return result;
  }

  undo(document: Document): CommandResult {
    if (this.locked) {
      throw new AppError('undo not allowed after io command');
    }
    const command = this.undoStack.pop();
    if (command === undefined) {
      throw new AppError('nothing to undo');
    }
    const result = command.undo(document);
    this.redoStack.push(command);
    return result;
  }

  redo(document: Document): CommandResult {
    if (this.locked) {
      throw new AppError('redo not allowed after io command');
    }
    const command = this.redoStack.pop();
    if (command === undefined) {
      throw new AppError('nothing to redo');
    }
    const result = command.redo === undefined ? command.execute(document) : command.redo(document);
    this.undoStack.push(command);
    return result;
  }

  canUndo(): boolean {
    return !this.locked && this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return !this.locked && this.redoStack.length > 0;
  }
}
