import { beforeEach, describe, expect, it } from 'vitest';
import { CommandRegistry } from '../../src/cli/CommandRegistry.js';
import { LineTokenizer } from '../../src/cli/LineTokenizer.js';
import { ShowFormatter } from '../../src/cli/ShowFormatter.js';
import { TreeFormatter } from '../../src/cli/TreeFormatter.js';
import { CommandHistory } from '../../src/command/CommandHistory.js';
import { Document } from '../../src/domain/Document.js';
import { SvgReader } from '../../src/io/SvgReader.js';
import { SvgWriter } from '../../src/io/SvgWriter.js';
import { ShapeFactory } from '../../src/shapes/ShapeFactory.js';
import { MemoryFileSystem } from '../support/memoryFs.js';

let registry: CommandRegistry;
let tokenizer: LineTokenizer;
let doc: Document;
let history: CommandHistory;

beforeEach(() => {
  const fs = new MemoryFileSystem();
  const factory = new ShapeFactory();
  const tree = new TreeFormatter();
  const show = new ShowFormatter();
  tokenizer = new LineTokenizer();
  registry = new CommandRegistry({
    factory,
    reader: new SvgReader(fs, factory),
    writer: new SvgWriter(fs),
    treeRenderer: (document, rootId) => tree.render(document, rootId),
    shapeRenderer: (document, id) => show.render(document, id),
    helpLines: ['commands'],
  });
  doc = new Document();
  history = new CommandHistory();
});

const run = (line: string): string[] => {
  const tokens = tokenizer.tokenize(line);
  if (tokens === null) {
    return [];
  }
  return history.execute(registry.build(tokens), doc).lines;
};

describe('CommandRegistry', () => {
  it('create 带 in 子句', () => {
    run('create g flow');
    expect(run('create rect start 120 100 160 60 #4a90d9 in flow')).toEqual([
      'rect#start created in g#flow',
    ]);
    expect(doc.find('start').parent?.id).toBe('flow');
  });

  it('create text 的内容带空格', () => {
    expect(run('create text title 20 40 "My Diagram"')).toEqual(['text#title created']);
    expect(doc.find('title').textContent()).toBe('My Diagram');
  });

  it('set 的值也能带空格', () => {
    run('create text t1 0 0 "a"');
    expect(run('set t1 text "hello world"')).toEqual(['text#t1 updated: text="hello world"']);
  });

  it('group 收编多个图形', () => {
    run('create rect r1 0 0 1 1');
    run('create rect r2 0 0 1 1');
    expect(run('group g1 r1 r2')).toEqual(['g#g1 created with 2 children']);
  });

  it('save 不带参数，canvas 查询', () => {
    run('init 400 200');
    expect(run('canvas')).toEqual(['canvas 400x200']);
    expect(run('save demo.svg')).toEqual(['saved to demo.svg (0 elements)']);
  });

  it('tree 和 show 用的是注入的格式化器', () => {
    run('init 400 300');
    expect(run('tree')).toEqual(['svg (400x300)']);
    run('create circle c1 10 10 5');
    expect(run('show c1')).toEqual(['circle#c1  parent=svg', '  cx=10 cy=10 r=5']);
  });

  it('未知命令', () => {
    expect(() => run('fly to the moon')).toThrow('unknown command: fly');
  });

  it('参数个数不对报 usage', () => {
    expect(() => run('create rect')).toThrow('usage: create <type> <id> [params…] [in <containerId>]');
    expect(() => run('move r1 0')).toThrow('usage: move <id> <dx> <dy>');
    expect(() => run('canvas 100')).toThrow('usage: canvas [w] [h]');
    expect(() => run('group g1')).toThrow('usage: group <newGid> <id1> <id2>…');
    expect(() => run('save a.svg b.svg')).toThrow('usage: save [file.svg]');
  });

  it('数字参数非法时带上参数名', () => {
    run('init');
    expect(() => run('move r1 0 abc')).toThrow('invalid number for dy: abc');
  });
});
