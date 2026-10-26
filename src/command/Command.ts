import type { Document } from '../domain/Document.js';

export type CommandKind = 'edit' | 'io' | 'display';

export interface CommandResult {
  readonly lines: string[];
}

/**
 * 一条命令就是一个对象，也是一个撤销单元。
 * kind 决定它进不进撤销栈、要不要锁住撤销（作业 §4.3）。
 */
export interface Command {
  readonly kind: CommandKind;
  execute(document: Document): CommandResult;
  undo(document: Document): CommandResult;
  redo?(document: Document): CommandResult;
}
