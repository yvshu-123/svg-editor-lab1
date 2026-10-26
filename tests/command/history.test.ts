import { beforeEach, describe, expect, it } from 'vitest';
import { CommandHistory } from '../../src/command/CommandHistory.js';
import { CreateShapeCommand } from '../../src/command/commands/CreateShapeCommand.js';
import { InitCommand } from '../../src/command/commands/InitCommand.js';
import { MoveCommand } from '../../src/command/commands/MoveCommand.js';
import { TreeCommand } from '../../src/command/commands/TreeCommand.js';
import { Document } from '../../src/domain/Document.js';
import { ShapeFactory } from '../../src/shapes/ShapeFactory.js';

describe('CommandHistory', () => {
  let doc: Document;
  let history: CommandHistory;
  let factory: ShapeFactory;

  beforeEach(() => {
    doc = new Document();
    history = new CommandHistory();
    factory = new ShapeFactory();
  });

  const createRect = (id: string, x: number): CreateShapeCommand =>
    new CreateShapeCommand(factory, 'rect', id, [String(x), '0', '10', '10']);

  it('编辑命令能撤销和重做，返回的文案也对得上', () => {
    history.execute(createRect('r1', 0), doc);
    history.execute(new MoveCommand('r1', 5, 5), doc);
    expect(doc.find('r1').getAttribute('x')).toBe('5');

    expect(history.undo(doc).lines).toEqual(['rect#r1 moved back to (0,0)']);
    expect(doc.find('r1').getAttribute('x')).toBe('0');

    expect(history.redo(doc).lines).toEqual(['rect#r1 moved to (5,5)']);
    expect(doc.find('r1').getAttribute('x')).toBe('5');
  });

  it('连着撤销可以一路回到空文档', () => {
    history.execute(createRect('r1', 0), doc);
    history.execute(createRect('r2', 10), doc);
    history.undo(doc);
    history.undo(doc);
    expect(doc.count()).toBe(0);
  });

  it('撤销之后再编辑，redo 栈清空', () => {
    history.execute(createRect('r1', 0), doc);
    history.undo(doc);
    history.execute(createRect('r2', 0), doc);

    expect(() => history.redo(doc)).toThrow('nothing to redo');
  });

  it('空栈时报 nothing to undo / nothing to redo', () => {
    expect(() => history.undo(doc)).toThrow('nothing to undo');
    expect(() => history.redo(doc)).toThrow('nothing to redo');
  });

  it('io 命令之后 undo 和 redo 都被锁住', () => {
    history.execute(createRect('r1', 0), doc);
    history.execute(new InitCommand(400, 200), doc);

    expect(() => history.undo(doc)).toThrow('undo not allowed after io command');
    expect(() => history.redo(doc)).toThrow('redo not allowed after io command');
  });

  it('io 之后的下一次编辑重新解锁', () => {
    history.execute(new InitCommand(400, 200), doc);
    history.execute(createRect('r1', 0), doc);

    expect(history.undo(doc).lines).toEqual(['rect#r1 creation undone']);
  });

  it('显示类命令不进撤销栈', () => {
    history.execute(new TreeCommand(() => ['svg (800x600)']), doc);
    expect(() => history.undo(doc)).toThrow('nothing to undo');
  });

  it('执行失败的编辑命令不入栈', () => {
    history.execute(createRect('r1', 0), doc);
    expect(() => history.execute(createRect('r1', 0), doc)).toThrow('id already exists: r1');
    expect(history.undo(doc).lines).toEqual(['rect#r1 creation undone']);
  });
});
