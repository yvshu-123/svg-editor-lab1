import { describe, expect, it } from 'vitest';
import { Circle } from '../../src/domain/Circle.js';
import { Document } from '../../src/domain/Document.js';
import { Ellipse } from '../../src/domain/Ellipse.js';
import { Group } from '../../src/domain/Group.js';
import { Line } from '../../src/domain/Line.js';
import { Rect } from '../../src/domain/Rect.js';
import { TextShape } from '../../src/domain/TextShape.js';
import { SvgReader } from '../../src/io/SvgReader.js';
import { SvgWriter } from '../../src/io/SvgWriter.js';
import { ShapeFactory } from '../../src/shapes/ShapeFactory.js';
import { MemoryFileSystem } from '../support/memoryFs.js';
import { fingerprint } from '../support/fingerprint.js';

describe('round-trip', () => {
  it('写出去再读回来，结构和属性完全一样', () => {
    const fs = new MemoryFileSystem();
    const writer = new SvgWriter(fs);
    const reader = new SvgReader(fs, new ShapeFactory());

    const doc = new Document(640, 480);
    doc.add(new Rect('bg', { x: 0, y: 0, width: 640, height: 480, fill: '#ffffff' }));
    doc.add(new TextShape('title', { x: 20, y: 40, content: 'A & B "quoted"' }));
    doc.add(new Line('edge', { x1: 0, y1: 0, x2: 100, y2: 100, stroke: 'black' }));
    doc.add(new Ellipse('e1', { cx: 10, cy: 20, rx: 3, ry: 4 }));
    const group = new Group('g1');
    doc.add(group);
    doc.add(new Circle('c1', { cx: 5, cy: 5, r: 2, fill: 'red' }), group);

    writer.write(doc, 'roundtrip.svg');
    const restored = reader.read('roundtrip.svg');

    expect(restored.warnings).toEqual([]);
    expect(fingerprint(restored.document)).toBe(fingerprint(doc));
  });

  it('写两次结果一致（属性顺序稳定）', () => {
    const writer = new SvgWriter(new MemoryFileSystem());
    const doc = new Document(10, 10);
    doc.add(new Rect('r1', { x: 1, y: 2, width: 3, height: 4, fill: '#000' }));

    expect(writer.toXml(doc)).toBe(writer.toXml(doc));
  });
});
