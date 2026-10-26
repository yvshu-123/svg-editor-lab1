import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddToCommand } from '../../src/command/commands/AddToCommand.js';
import { CanvasCommand } from '../../src/command/commands/CanvasCommand.js';
import { CreateShapeCommand } from '../../src/command/commands/CreateShapeCommand.js';
import { DeleteShapeCommand } from '../../src/command/commands/DeleteShapeCommand.js';
import { GroupCommand } from '../../src/command/commands/GroupCommand.js';
import { HelpCommand } from '../../src/command/commands/HelpCommand.js';
import { InitCommand } from '../../src/command/commands/InitCommand.js';
import { MoveCommand } from '../../src/command/commands/MoveCommand.js';
import { ReadCommand } from '../../src/command/commands/ReadCommand.js';
import { ReorderCommand } from '../../src/command/commands/ReorderCommand.js';
import { SaveCommand } from '../../src/command/commands/SaveCommand.js';
import { ScaleCommand } from '../../src/command/commands/ScaleCommand.js';
import { SetAttributeCommand } from '../../src/command/commands/SetAttributeCommand.js';
import { ShowCommand } from '../../src/command/commands/ShowCommand.js';
import { TreeCommand } from '../../src/command/commands/TreeCommand.js';
import { UngroupCommand } from '../../src/command/commands/UngroupCommand.js';
import { Document } from '../../src/domain/Document.js';
import { Group } from '../../src/domain/Group.js';
import { Rect } from '../../src/domain/Rect.js';
import { ShapeFactory } from '../../src/shapes/ShapeFactory.js';
import type { SvgReaderPort, SvgWriterPort } from '../../src/ports/Ports.js';
import { fingerprint } from '../support/fingerprint.js';

let doc: Document;
let factory: ShapeFactory;

beforeEach(() => {
  doc = new Document();
  factory = new ShapeFactory();
});

const create = (type: string, id: string, params: string[], containerId?: string): CreateShapeCommand =>
  new CreateShapeCommand(factory, type, id, params, containerId);

describe('create', () => {
  it('在根上创建', () => {
    expect(create('rect', 'r1', ['10', '20', '100', '50']).execute(doc).lines).toEqual(['rect#r1 created']);
    expect(doc.count()).toBe(1);
  });

  it('给了 fill 就写进属性', () => {
    create('rect', 'r1', ['0', '0', '10', '10', '#eee']).execute(doc);
    expect(doc.find('r1').getAttribute('fill')).toBe('#eee');
  });

  it('in 子句把图形直接挂进容器', () => {
    create('g', 'node1', []).execute(doc);
    const result = create('text', 'start-label', ['155', '135', '开始'], 'node1').execute(doc);

    expect(result.lines).toEqual(['text#start-label created in g#node1']);
    expect(doc.find('start-label').parent?.id).toBe('node1');
  });

  it('in 的目标不存在', () => {
    expect(() => create('rect', 'r1', ['0', '0', '1', '1'], 'node9').execute(doc)).toThrow(
      'no such container: node9',
    );
  });

  it('in 的目标不是容器', () => {
    create('rect', 'start', ['0', '0', '10', '10']).execute(doc);
    expect(() => create('rect', 'r1', ['0', '0', '1', '1'], 'start').execute(doc)).toThrow(
      'not a container: start',
    );
  });

  it('id 重复时报错，且状态没变', () => {
    create('rect', 'r1', ['0', '0', '10', '10']).execute(doc);
    const before = fingerprint(doc);

    expect(() => create('circle', 'r1', ['1', '1', '1']).execute(doc)).toThrow('id already exists: r1');
    expect(fingerprint(doc)).toBe(before);
  });

  it('未知类型提示插件', () => {
    expect(() => create('hexagon', 'h1', ['0', '0', '1']).execute(doc)).toThrow(
      'unknown shape type: hexagon (is the plugin loaded?)',
    );
  });

  it('撤销把新建的整棵子树拿掉', () => {
    const command = create('g', 'g1', []);
    command.execute(doc);

    expect(command.undo(doc).lines).toEqual(['g#g1 creation undone']);
    expect(doc.count()).toBe(0);
  });
});

describe('delete', () => {
  it('删除之后撤销，回到原父容器和原位置', () => {
    create('g', 'markers', []).execute(doc);
    create('rect', 'box', ['200', '80', '60', '60'], 'markers').execute(doc);
    create('rect', 'bg', ['0', '0', '800', '600']).execute(doc);

    const command = new DeleteShapeCommand('box');
    expect(command.execute(doc).lines).toEqual(['rect#box deleted']);
    expect(doc.has('box')).toBe(false);

    expect(command.undo(doc).lines).toEqual(['rect#box restored into g#markers']);
    expect(doc.find('box').parent?.id).toBe('markers');
    expect(doc.children.map((shape) => shape.id)).toEqual(['markers', 'bg']);
  });

  it('撤销恢复到原来的前后顺序', () => {
    create('rect', 'a', ['0', '0', '1', '1']).execute(doc);
    create('rect', 'b', ['0', '0', '1', '1']).execute(doc);
    create('rect', 'c', ['0', '0', '1', '1']).execute(doc);

    const command = new DeleteShapeCommand('b');
    command.execute(doc);
    command.undo(doc);

    expect(doc.children.map((shape) => shape.id)).toEqual(['a', 'b', 'c']);
  });

  it('删除不存在的 id', () => {
    expect(() => new DeleteShapeCommand('r9').execute(doc)).toThrow('no such shape: r9');
  });
});

describe('move', () => {
  it('叶子图形回显绝对坐标', () => {
    create('circle', 'c1', ['100', '100', '20']).execute(doc);
    const command = new MoveCommand('c1', 30, 0);

    expect(command.execute(doc).lines).toEqual(['circle#c1 moved to (130,100)']);
    expect(command.undo(doc).lines).toEqual(['circle#c1 moved back to (100,100)']);
    expect(doc.find('c1').getAttribute('cx')).toBe('100');
  });

  it('容器回显增量，子节点跟着走', () => {
    create('g', 'node2', []).execute(doc);
    create('rect', 'process', ['520', '100', '160', '60'], 'node2').execute(doc);

    const command = new MoveCommand('node2', 0, 100);
    expect(command.execute(doc).lines).toEqual(['g#node2 moved by (0,100)']);
    expect(doc.find('process').getAttribute('y')).toBe('200');
    expect(command.undo(doc).lines).toEqual(['g#node2 moved back by (0,-100)']);
  });

  it('目标不存在', () => {
    expect(() => new MoveCommand('r9', 1, 1).execute(doc)).toThrow('no such shape: r9');
  });
});

describe('scale', () => {
  it('缩放之后能精确还原', () => {
    create('rect', 'r1', ['10', '20', '100', '50']).execute(doc);
    const command = new ScaleCommand('r1', 2);

    expect(command.execute(doc).lines).toEqual(['rect#r1 scaled by 2']);
    expect(doc.find('r1').describe()).toBe('x=20 y=40 w=200 h=100');
    expect(command.undo(doc).lines).toEqual(['rect#r1 scale undone']);
    expect(doc.find('r1').describe()).toBe('x=10 y=20 w=100 h=50');
  });

  it('factor 非正数，状态不变', () => {
    create('rect', 'r1', ['10', '20', '100', '50']).execute(doc);
    const before = fingerprint(doc);

    expect(() => new ScaleCommand('r1', 0).execute(doc)).toThrow('scale factor must be positive');
    expect(fingerprint(doc)).toBe(before);
  });

  it('容器缩放会递归', () => {
    create('g', 'g1', []).execute(doc);
    create('rect', 'r1', ['10', '20', '30', '40'], 'g1').execute(doc);

    new ScaleCommand('g1', 2).execute(doc);

    expect(doc.find('r1').describe()).toBe('x=20 y=40 w=60 h=80');
  });
});

describe('set', () => {
  it('改文本内容，撤销回到旧值', () => {
    create('text', 'title', ['20', '40', 'My Diagram']).execute(doc);
    const command = new SetAttributeCommand('title', 'text', 'My Diagram v2');

    expect(command.execute(doc).lines).toEqual(['text#title updated: text="My Diagram v2"']);
    expect(command.undo(doc).lines).toEqual(['text#title updated: text="My Diagram"']);
    expect(doc.find('title').textContent()).toBe('My Diagram');
  });

  it('改样式属性', () => {
    create('rect', 'r1', ['0', '0', '10', '10']).execute(doc);
    expect(new SetAttributeCommand('r1', 'fill', '#f5a623').execute(doc).lines).toEqual([
      'rect#r1 updated: fill=#f5a623',
    ]);
  });

  it('白名单外的属性', () => {
    create('rect', 'r1', ['0', '0', '10', '10']).execute(doc);
    expect(() => new SetAttributeCommand('r1', 'opacity', '0.5').execute(doc)).toThrow(
      'unknown attribute: opacity',
    );
  });
});

describe('group / ungroup', () => {
  it('group 建容器、收编成员，撤销还原', () => {
    create('circle', 'c1', ['100', '100', '20']).execute(doc);
    create('rect', 'box', ['200', '80', '60', '60']).execute(doc);

    const command = new GroupCommand('markers', ['c1', 'box']);
    expect(command.execute(doc).lines).toEqual(['g#markers created with 2 children']);
    expect(doc.children.map((shape) => shape.id)).toEqual(['markers']);
    expect((doc.find('markers') as Group).children.map((shape) => shape.id)).toEqual(['c1', 'box']);

    expect(command.undo(doc).lines).toEqual(['g#markers ungrouped (2 children restored)']);
    expect(doc.children.map((shape) => shape.id)).toEqual(['c1', 'box']);
  });

  it('把容器收进自己的子孙要报错', () => {
    create('g', 'markers', []).execute(doc);
    create('circle', 'c1', ['0', '0', '1'], 'markers').execute(doc);

    expect(() => new GroupCommand('bad', ['c1', 'markers']).execute(doc)).toThrow(
      'cannot group a container into its own descendant: markers',
    );
  });

  it('成员不存在', () => {
    create('rect', 'r1', ['0', '0', '1', '1']).execute(doc);
    expect(() => new GroupCommand('g1', ['r1', 'r404']).execute(doc)).toThrow('no such shape: r404');
  });

  it('ungroup 把子节点提升到容器原来的位置', () => {
    create('g', 'outer', []).execute(doc);
    create('g', 'inner', [], 'outer').execute(doc);
    create('rect', 'r1', ['0', '0', '1', '1'], 'inner').execute(doc);
    create('rect', 'r2', ['0', '0', '1', '1'], 'inner').execute(doc);

    const command = new UngroupCommand('inner');
    expect(command.execute(doc).lines).toEqual(['g#inner ungrouped (2 children)']);
    expect(doc.has('inner')).toBe(false);
    expect(doc.find('r1').parent?.id).toBe('outer');
    expect(doc.find('r1').parent?.children.map((shape) => shape.id)).toEqual(['r1', 'r2']);
  });

  it('根级容器不许 ungroup（作业 §4.2 的规定）', () => {
    create('g', 'scene', []).execute(doc);
    expect(() => new UngroupCommand('scene').execute(doc)).toThrow('cannot ungroup top-level container: scene');
  });

  it('叶子节点不能 ungroup', () => {
    create('rect', 'r1', ['0', '0', '1', '1']).execute(doc);
    expect(() => new UngroupCommand('r1').execute(doc)).toThrow('not a container: r1');
  });
});

describe('addto', () => {
  it('移到容器末尾，撤销回到原来的父级', () => {
    create('g', 'g1', []).execute(doc);
    create('rect', 'r1', ['0', '0', '1', '1']).execute(doc);
    create('rect', 'r2', ['0', '0', '1', '1'], 'g1').execute(doc);

    const command = new AddToCommand('g1', 'r1');
    expect(command.execute(doc).lines).toEqual(['rect#r1 added to g#g1']);
    expect(doc.find('r1').parent?.id).toBe('g1');
    expect(command.undo(doc).lines).toEqual(['rect#r1 moved back to svg']);
  });

  it('移进自己的子孙要报错', () => {
    create('g', 'g1', []).execute(doc);
    create('g', 'g2', [], 'g1').execute(doc);

    expect(() => new AddToCommand('g2', 'g1').execute(doc)).toThrow(
      'cannot move a container into its own descendant: g1',
    );
  });

  it('目标不是容器', () => {
    create('rect', 'r1', ['0', '0', '1', '1']).execute(doc);
    create('rect', 'r2', ['0', '0', '1', '1']).execute(doc);

    expect(() => new AddToCommand('r1', 'r2').execute(doc)).toThrow('not a container: r1');
  });
});

describe('front / back', () => {
  it('front 移到同级最后，撤销回原位', () => {
    create('rect', 'a', ['0', '0', '1', '1']).execute(doc);
    create('rect', 'b', ['0', '0', '1', '1']).execute(doc);
    create('rect', 'c', ['0', '0', '1', '1']).execute(doc);

    const command = new ReorderCommand('a', 'front');
    expect(command.execute(doc).lines).toEqual(['rect#a brought to front']);
    expect(doc.children.map((shape) => shape.id)).toEqual(['b', 'c', 'a']);
    expect(command.undo(doc).lines).toEqual(['rect#a moved back to original position']);
    expect(doc.children.map((shape) => shape.id)).toEqual(['a', 'b', 'c']);
  });

  it('back 移到同级最前', () => {
    create('rect', 'a', ['0', '0', '1', '1']).execute(doc);
    create('rect', 'b', ['0', '0', '1', '1']).execute(doc);
    create('rect', 'c', ['0', '0', '1', '1']).execute(doc);

    new ReorderCommand('c', 'back').execute(doc);
    expect(doc.children.map((shape) => shape.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('文档类命令', () => {
  it('init 新建画布并清空内容', () => {
    create('rect', 'r1', ['0', '0', '1', '1']).execute(doc);
    const command = new InitCommand(400, 200);

    expect(command.kind).toBe('io');
    expect(command.execute(doc).lines).toEqual(['canvas 400x200 created']);
    expect(doc.count()).toBe(0);
    expect(doc.width).toBe(400);
    expect(doc.sourcePath).toBeNull();
  });

  it('read 先输出警告再输出计数，并替换当前文档', () => {
    const source = new Document(400, 300);
    source.add(new Rect('rect1', { x: 0, y: 0, width: 400, height: 300 }));
    const reader: SvgReaderPort = {
      read: vi.fn(() => ({ document: source, warnings: ['warning: assigned id rect1 to unnamed <rect>'] })),
    };

    const result = new ReadCommand('other.svg', reader).execute(doc);

    expect(result.lines).toEqual(['warning: assigned id rect1 to unnamed <rect>', 'read other.svg (1 elements)']);
    expect(doc.width).toBe(400);
    expect(doc.count()).toBe(1);
    expect(doc.sourcePath).toBe('other.svg');
  });

  it('save 写出文件并记下路径', () => {
    create('rect', 'r1', ['0', '0', '1', '1']).execute(doc);
    create('rect', 'r2', ['0', '0', '1', '1']).execute(doc);
    const write = vi.fn();
    const writer: SvgWriterPort = { write };

    const result = new SaveCommand('demo.svg', writer).execute(doc);

    expect(result.lines).toEqual(['saved to demo.svg (2 elements)']);
    expect(write).toHaveBeenCalledTimes(1);
    expect(doc.sourcePath).toBe('demo.svg');
  });

  it('save 不给路径时用读入路径', () => {
    create('rect', 'r1', ['0', '0', '1', '1']).execute(doc);
    doc.sourcePath = 'other.svg';

    expect(new SaveCommand(null, { write: vi.fn() }).execute(doc).lines).toEqual(['saved to other.svg (1 elements)']);
  });

  it('既没参数也没来源路径', () => {
    expect(() => new SaveCommand(null, { write: vi.fn() }).execute(doc)).toThrow(
      "no file path: use 'save <file.svg>'",
    );
  });

  it('canvas 不带参数只显示尺寸', () => {
    const command = new CanvasCommand();
    expect(command.kind).toBe('display');
    expect(command.execute(doc).lines).toEqual(['canvas 800x600']);
  });

  it('canvas 带参数改尺寸，算 io 命令', () => {
    const command = new CanvasCommand(1024, 768);
    expect(command.kind).toBe('io');
    expect(command.execute(doc).lines).toEqual(['canvas 1024x768']);
    expect(doc.width).toBe(1024);
  });
});

describe('显示类命令', () => {
  it('tree 交给注入的渲染函数', () => {
    const renderer = vi.fn(() => ['svg (800x600)']);
    expect(new TreeCommand(renderer).execute(doc).lines).toEqual(['svg (800x600)']);
    expect(renderer).toHaveBeenCalledWith(doc, undefined);
  });

  it('tree <id> 把根 id 传下去', () => {
    const renderer = vi.fn(() => ['line']);
    new TreeCommand(renderer, 'g1').execute(doc);
    expect(renderer).toHaveBeenCalledWith(doc, 'g1');
  });

  it('show 交给注入的渲染函数', () => {
    const renderer = vi.fn(() => ['circle#c1  parent=svg']);
    expect(new ShowCommand(renderer, 'c1').execute(doc).lines).toEqual(['circle#c1  parent=svg']);
    expect(renderer).toHaveBeenCalledWith(doc, 'c1');
  });

  it('help 直接输出给定的行', () => {
    expect(new HelpCommand(['help', 'undo']).execute(doc).lines).toEqual(['help', 'undo']);
  });
});
