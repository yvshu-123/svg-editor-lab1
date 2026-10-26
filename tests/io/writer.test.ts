import { describe, expect, it } from 'vitest';
import { Circle } from '../../src/domain/Circle.js';
import { Document } from '../../src/domain/Document.js';
import { Group } from '../../src/domain/Group.js';
import { Rect } from '../../src/domain/Rect.js';
import { TextShape } from '../../src/domain/TextShape.js';
import { SvgWriter } from '../../src/io/SvgWriter.js';
import { MemoryFileSystem } from '../support/memoryFs.js';

const writer = new SvgWriter(new MemoryFileSystem());

const buildDocument = (): Document => {
  const doc = new Document(400, 200);
  doc.add(new Rect('r1', { x: 30, y: 70, width: 120, height: 60, fill: '#4a90d9' }));
  doc.add(new TextShape('t1', { x: 20, y: 40, content: 'A & B <ok>' }));
  const group = new Group('g1');
  doc.add(group);
  doc.add(new Circle('c1', { cx: 10, cy: 10, r: 5 }), group);
  return doc;
};

describe('SvgWriter', () => {
  it('输出完整的 SVG：声明、命名空间、viewBox、缩进', () => {
    expect(writer.toXml(buildDocument())).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">',
        '  <rect id="r1" x="30" y="70" width="120" height="60" fill="#4a90d9"/>',
        '  <text id="t1" x="20" y="40">A &amp; B &lt;ok&gt;</text>',
        '  <g id="g1">',
        '    <circle id="c1" cx="10" cy="10" r="5"/>',
        '  </g>',
        '</svg>',
        '',
      ].join('\n'),
    );
  });

  it('空容器写成自闭合', () => {
    const doc = new Document(100, 100);
    doc.add(new Group('empty'));
    expect(writer.toXml(doc)).toContain('  <g id="empty"/>');
  });

  it('浮点数走统一格式化，不留尾零', () => {
    const doc = new Document(100, 100);
    doc.add(new Rect('r1', { x: 10.5, y: 0.1 + 0.2, width: 3, height: 4 }));
    expect(writer.toXml(doc)).toContain('x="10.5" y="0.3"');
  });

  it('write 会经过 FileSystemPort', () => {
    const fs = new MemoryFileSystem();
    const doc = new Document(10, 10);
    doc.add(new Rect('r1', { x: 0, y: 0, width: 1, height: 1 }));

    new SvgWriter(fs).write(doc, 'demo.svg');

    expect(fs.contentOf('demo.svg')).toContain('<rect id="r1"');
  });

  it('写文件失败时包装成 cannot write file', () => {
    const failing = {
      readText: () => '',
      writeText: () => {
        throw new Error('EACCES');
      },
    };

    expect(() => new SvgWriter(failing).write(new Document(), 'a.svg')).toThrow('cannot write file: a.svg');
  });
});
