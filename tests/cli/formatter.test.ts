import { beforeEach, describe, expect, it } from 'vitest';
import { ShowFormatter } from '../../src/cli/ShowFormatter.js';
import { TreeFormatter } from '../../src/cli/TreeFormatter.js';
import { Circle } from '../../src/domain/Circle.js';
import { Document } from '../../src/domain/Document.js';
import { Group } from '../../src/domain/Group.js';
import { Rect } from '../../src/domain/Rect.js';
import { TextShape } from '../../src/domain/TextShape.js';

let doc: Document;

beforeEach(() => {
  doc = new Document(800, 600);
  doc.add(new Rect('bg', { x: 0, y: 0, width: 800, height: 600, fill: '#ffffff' }));
  doc.add(new TextShape('title', { x: 20, y: 40, content: 'My Diagram' }));
  const markers = new Group('markers');
  doc.add(markers);
  doc.add(new Circle('c1', { cx: 100, cy: 100, r: 20, fill: 'red' }), markers);
  doc.add(new Rect('box', { x: 200, y: 80, width: 60, height: 60, fill: '#3366ff' }), markers);
});

describe('TreeFormatter', () => {
  it('画布尺寸一行，下面带树形符号和内联属性', () => {
    expect(new TreeFormatter().render(doc)).toEqual([
      'svg (800x600)',
      '├── rect#bg        x=0 y=0 w=800 h=600 fill=#ffffff',
      '├── text#title     (20,40) "My Diagram"',
      '└── g#markers',
      '    ├── circle#c1  cx=100 cy=100 r=20 fill=red',
      '    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff',
    ]);
  });

  it('tree <id> 只渲染这一棵子树', () => {
    expect(new TreeFormatter().render(doc, 'markers')).toEqual([
      'g#markers',
      '├── circle#c1  cx=100 cy=100 r=20 fill=red',
      '└── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff',
    ]);
  });

  it('id 不存在', () => {
    expect(() => new TreeFormatter().render(doc, 'nope')).toThrow('no such shape: nope');
  });

  it('空文档只有根这一行', () => {
    expect(new TreeFormatter().render(new Document(400, 300))).toEqual(['svg (400x300)']);
  });
});

describe('ShowFormatter', () => {
  it('父容器、几何、样式各占一行', () => {
    expect(new ShowFormatter().render(doc, 'c1')).toEqual([
      'circle#c1  parent=g#markers',
      '  cx=100 cy=100 r=20',
      '  fill=red',
    ]);
  });

  it('根上的元素 parent 写 svg', () => {
    expect(new ShowFormatter().render(doc, 'title')).toEqual([
      'text#title  parent=svg',
      '  x=20 y=40',
      '  text="My Diagram"',
    ]);
  });

  it('容器只显示自己的属性', () => {
    expect(new ShowFormatter().render(doc, 'markers')).toEqual(['g#markers  parent=svg']);
  });

  it('id 不存在', () => {
    expect(() => new ShowFormatter().render(doc, 'nope')).toThrow('no such shape: nope');
  });
});
