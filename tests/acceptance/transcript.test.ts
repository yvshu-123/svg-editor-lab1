import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CommandRegistry } from '../../src/cli/CommandRegistry.js';
import { HELP_LINES } from '../../src/cli/HelpText.js';
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

const fixturePath = fileURLToPath(new URL('../fixtures/other.svg', import.meta.url));

const createSession = (fs = new MemoryFileSystem()) => {
  const factory = new ShapeFactory();
  const tree = new TreeFormatter();
  const show = new ShowFormatter();
  const registry = new CommandRegistry({
    factory,
    reader: new SvgReader(fs, factory),
    writer: new SvgWriter(fs),
    treeRenderer: (document, rootId) => tree.render(document, rootId),
    shapeRenderer: (document, id) => show.render(document, id),
    helpLines: HELP_LINES,
  });
  const repl = new Repl({
    document: new Document(),
    history: new CommandHistory(),
    registry,
    tokenizer: new LineTokenizer(),
  });
  return { repl, fs };
};

describe('回放作业 §6 的主会话', () => {
  it('每一步的输出都对得上', () => {
    const { repl } = createSession();
    const run = (line: string): string[] => repl.handleLine(line);

    expect(run('init 800 600')).toEqual(['canvas 800x600 created']);
    expect(run('create rect bg 0 0 800 600 #ffffff')).toEqual(['rect#bg created']);
    expect(run('create text title 20 40 "My Diagram"')).toEqual(['text#title created']);
    expect(run('create circle c1 100 100 20 red')).toEqual(['circle#c1 created']);
    expect(run('create rect box 200 80 60 60 #3366ff')).toEqual(['rect#box created']);

    expect(run('group markers c1 box')).toEqual(['g#markers created with 2 children']);
    expect(run('tree')).toEqual([
      'svg (800x600)',
      '├── rect#bg        x=0 y=0 w=800 h=600 fill=#ffffff',
      '├── text#title     (20,40) "My Diagram"',
      '└── g#markers',
      '    ├── circle#c1  cx=100 cy=100 r=20 fill=red',
      '    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff',
    ]);

    expect(run('move c1 30 0')).toEqual(['circle#c1 moved to (130,100)']);
    expect(run('undo')).toEqual(['circle#c1 moved back to (100,100)']);
    expect(run('redo')).toEqual(['circle#c1 moved to (130,100)']);

    expect(run('set title text "My Diagram v2"')).toEqual(['text#title updated: text="My Diagram v2"']);
    expect(run('undo')).toEqual(['text#title updated: text="My Diagram"']);

    expect(run('group bad c1 markers')).toEqual([
      'error: cannot group a container into its own descendant: markers',
    ]);
    expect(run('delete box')).toEqual(['rect#box deleted']);
    expect(run('undo')).toEqual(['rect#box restored into g#markers']);

    expect(run('save demo.svg')).toEqual(['saved to demo.svg (5 elements)']);
    expect(run('undo')).toEqual(['error: undo not allowed after io command']);
  });

  it('保存出来的 SVG 结构对，浏览器能直接打开', () => {
    const { repl, fs } = createSession();
    repl.handleLine('init 400 200');
    repl.handleLine('create rect start 30 70 120 60 #4a90d9');
    repl.handleLine('create line edge 150 100 250 100 black');
    repl.handleLine('create rect end 250 70 120 60 #f5a623');
    repl.handleLine('save demo.svg');

    const xml = fs.contentOf('demo.svg') ?? '';
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(xml).toContain('viewBox="0 0 400 200"');
    expect(xml).toContain('<rect id="start" x="30" y="70" width="120" height="60" fill="#4a90d9"/>');
    expect(xml).toContain('<line id="edge" x1="150" y1="100" x2="250" y2="100" stroke="black"/>');
  });
});

describe('回放作业 §6.1 的两节点流程图', () => {
  it('用 in 子句自顶向下建，tree 和元素数都对', () => {
    const { repl, fs } = createSession();
    const run = (line: string): string[] => repl.handleLine(line);

    expect(run('init 800 600')).toEqual(['canvas 800x600 created']);
    expect(run('create g flowchart')).toEqual(['g#flowchart created']);
    expect(run('create g node1 in flowchart')).toEqual(['g#node1 created in g#flowchart']);
    expect(run('create rect start 120 100 160 60 #4a90d9 in node1')).toEqual([
      'rect#start created in g#node1',
    ]);
    expect(run('create text start-label 155 135 "开始" in node1')).toEqual([
      'text#start-label created in g#node1',
    ]);
    expect(run('create g node2 in flowchart')).toEqual(['g#node2 created in g#flowchart']);
    expect(run('create rect process 520 100 160 60 #f5a623 in node2')).toEqual([
      'rect#process created in g#node2',
    ]);
    expect(run('create text process-label 545 135 "处理数据" in node2')).toEqual([
      'text#process-label created in g#node2',
    ]);
    expect(run('create line arrow1 280 130 520 130 black in flowchart')).toEqual([
      'line#arrow1 created in g#flowchart',
    ]);

    expect(run('tree')).toEqual([
      'svg (800x600)',
      '└── g#flowchart',
      '    ├── g#node1',
      '    │   ├── rect#start          x=120 y=100 w=160 h=60 fill=#4a90d9',
      '    │   └── text#start-label    (155,135) "开始"',
      '    ├── g#node2',
      '    │   ├── rect#process        x=520 y=100 w=160 h=60 fill=#f5a623',
      '    │   └── text#process-label  (545,135) "处理数据"',
      '    └── line#arrow1             (280,130) -> (520,130) stroke=black',
    ]);

    expect(run('move node2 0 100')).toEqual(['g#node2 moved by (0,100)']);
    expect(run('undo')).toEqual(['g#node2 moved back by (0,-100)']);
    expect(run('set process-label text "处理数据 v2"')).toEqual([
      'text#process-label updated: text="处理数据 v2"',
    ]);
    expect(run('save flowchart.svg')).toEqual(['saved to flowchart.svg (8 elements)']);
    expect(fs.contentOf('flowchart.svg')).toContain('<text id="process-label" x="545" y="135">处理数据 v2</text>');
  });
});

describe('读外部 SVG', () => {
  it('缺 id 自动补全并警告，读回来的树和作业一致', () => {
    const fs = new MemoryFileSystem();
    fs.seed('other.svg', readFileSync(fixturePath, 'utf8'));
    const { repl } = createSession(fs);
    const run = (line: string): string[] => repl.handleLine(line);

    expect(run('read other.svg')).toEqual([
      'warning: assigned id rect1 to unnamed <rect>',
      'read other.svg (7 elements)',
    ]);
    expect(run('tree')).toEqual([
      'svg (400x300)',
      '├── rect#rect1     x=0 y=0 w=400 h=300 fill=#ffffff',
      '├── text#t1        (10,290) "imported"',
      '├── circle#c1      cx=50 cy=50 r=10',
      '├── g#g1',
      '│   ├── rect#r2    x=0 y=0 w=10 h=10',
      '│   └── circle#c2  cx=5 cy=5 r=2',
      '└── ellipse#e1     cx=1 cy=2 rx=3 ry=4',
    ]);
  });
});

describe('错误文案', () => {
  const cases: Array<{ name: string; setup: string[]; line: string; expected: string }> = [
    {
      name: 'id 已存在',
      setup: ['init', 'create rect r1 0 0 1 1'],
      line: 'create rect r1 0 0 1 1',
      expected: 'error: id already exists: r1',
    },
    { name: 'id 不存在', setup: ['init'], line: 'delete r9', expected: 'error: no such shape: r9' },
    {
      name: 'in 目标不存在',
      setup: ['init'],
      line: 'create rect r1 0 0 1 1 in node9',
      expected: 'error: no such container: node9',
    },
    {
      name: 'in 目标不是容器',
      setup: ['init', 'create rect start 0 0 1 1'],
      line: 'create rect r1 0 0 1 1 in start',
      expected: 'error: not a container: start',
    },
    {
      name: '没注册的类型',
      setup: ['init'],
      line: 'create box b1 0 0 10 10 "x"',
      expected: 'error: unknown shape type: box (is the plugin loaded?)',
    },
    {
      name: '把容器收进自己的子孙',
      setup: ['init', 'create g markers', 'create circle c1 0 0 1 in markers'],
      line: 'group bad c1 markers',
      expected: 'error: cannot group a container into its own descendant: markers',
    },
    {
      name: '根级容器不能 ungroup',
      setup: ['init', 'create g scene'],
      line: 'ungroup scene',
      expected: 'error: cannot ungroup top-level container: scene',
    },
    {
      name: 'scale 非正数',
      setup: ['init', 'create circle c1 0 0 1'],
      line: 'scale c1 0',
      expected: 'error: scale factor must be positive',
    },
    { name: '文件不存在', setup: [], line: 'read nope.svg', expected: 'error: cannot read file: nope.svg' },
    {
      name: 'save 没路径',
      setup: ['init'],
      line: 'save',
      expected: "error: no file path: use 'save <file.svg>'",
    },
    { name: '没 init / read', setup: [], line: 'tree', expected: "error: no document. use 'init' or 'read' first" },
    {
      name: 'io 之后 undo',
      setup: ['init', 'create rect r1 0 0 1 1', 'save a.svg'],
      line: 'undo',
      expected: 'error: undo not allowed after io command',
    },
    {
      name: '空撤销栈',
      setup: ['init', 'create rect r1 0 0 1 1', 'undo'],
      line: 'undo',
      expected: 'error: nothing to undo',
    },
    {
      name: '空重做栈',
      setup: ['init', 'create rect r1 0 0 1 1', 'undo', 'redo'],
      line: 'redo',
      expected: 'error: nothing to redo',
    },
    { name: '未知命令', setup: [], line: 'dance', expected: 'error: unknown command: dance' },
    {
      name: '未知属性',
      setup: ['init', 'create rect r1 0 0 1 1'],
      line: 'set r1 opacity 0.5',
      expected: 'error: unknown attribute: opacity',
    },
  ];

  for (const item of cases) {
    it(item.name, () => {
      const { repl } = createSession();
      for (const line of item.setup) {
        repl.handleLine(line);
      }
      expect(repl.handleLine(item.line)).toEqual([item.expected]);
    });
  }
});
