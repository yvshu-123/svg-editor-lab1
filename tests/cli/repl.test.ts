import { beforeEach, describe, expect, it } from 'vitest';
import { CommandRegistry } from '../../src/cli/CommandRegistry.js';
import { LineTokenizer } from '../../src/cli/LineTokenizer.js';
import { Repl } from '../../src/cli/Repl.js';
import { ShowFormatter } from '../../src/cli/ShowFormatter.js';
import { TreeFormatter } from '../../src/cli/TreeFormatter.js';
import { CommandHistory } from '../../src/command/CommandHistory.js';
import { Document } from '../../src/domain/Document.js';
import { SvgReader } from '../../src/io/SvgReader.js';
import { SvgWriter } from '../../src/io/SvgWriter.js';
import { ShapeFactory } from '../../src/shapes/ShapeFactory.js';
import { MemoryFileSystem } from '../support/memoryFs.js';

let repl: Repl;

beforeEach(() => {
  const fs = new MemoryFileSystem();
  const factory = new ShapeFactory();
  const tree = new TreeFormatter();
  const show = new ShowFormatter();
  const registry = new CommandRegistry({
    factory,
    reader: new SvgReader(fs, factory),
    writer: new SvgWriter(fs),
    treeRenderer: (document, rootId) => tree.render(document, rootId),
    shapeRenderer: (document, id) => show.render(document, id),
    helpLines: ['help line'],
  });

  repl = new Repl({
    document: new Document(),
    history: new CommandHistory(),
    registry,
    tokenizer: new LineTokenizer(),
  });
});

describe('Repl', () => {
  it('没 init / read 之前，编辑和显示命令都报 no document', () => {
    expect(repl.handleLine('tree')).toEqual(["error: no document. use 'init' or 'read' first"]);
    expect(repl.handleLine('create rect r1 0 0 1 1')).toEqual([
      "error: no document. use 'init' or 'read' first",
    ]);
  });

  it('help 在 init 之前也能用', () => {
    expect(repl.handleLine('help')).toEqual(['help line']);
  });

  it('空行和注释没有输出', () => {
    expect(repl.handleLine('')).toEqual([]);
    expect(repl.handleLine('# note')).toEqual([]);
  });

  it('init 之后能编辑、撤销、重做', () => {
    expect(repl.handleLine('init 400 200')).toEqual(['canvas 400x200 created']);
    expect(repl.handleLine('create circle c1 100 100 20 red')).toEqual(['circle#c1 created']);
    expect(repl.handleLine('undo')).toEqual(['circle#c1 creation undone']);
    expect(repl.handleLine('redo')).toEqual(['circle#c1 created']);
  });

  it('io 命令后 undo 被禁，下一次编辑后恢复', () => {
    repl.handleLine('init');
    repl.handleLine('create rect r1 0 0 1 1');
    repl.handleLine('save demo.svg');

    expect(repl.handleLine('undo')).toEqual(['error: undo not allowed after io command']);

    repl.handleLine('create rect r2 0 0 1 1');
    expect(repl.handleLine('undo')).toEqual(['rect#r2 creation undone']);
  });

  it('错误统一加 error: 前缀，而且只占一行', () => {
    repl.handleLine('init');
    expect(repl.handleLine('delete nope')).toEqual(['error: no such shape: nope']);
    repl.handleLine('create rect r1 0 0 1 1');
    expect(repl.handleLine('create rect r1 0 0 1 1')).toEqual(['error: id already exists: r1']);
  });

  it('未知命令和未闭合引号', () => {
    expect(repl.handleLine('dance')).toEqual(['error: unknown command: dance']);
    expect(repl.handleLine('create text t1 0 0 "abc')).toEqual(['error: unterminated quoted string']);
  });

  it('quit 把退出标记置上', () => {
    expect(repl.handleLine('quit')).toEqual([]);
    expect(repl.shouldExit).toBe(true);
  });
});
