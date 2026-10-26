import { describe, expect, it } from 'vitest';
import { Ellipse } from '../../src/domain/Ellipse.js';
import { Line } from '../../src/domain/Line.js';
import { TextShape } from '../../src/domain/TextShape.js';

describe('Ellipse', () => {
  it('四个几何属性都参与缩放', () => {
    const ellipse = new Ellipse('e1', { cx: 1, cy: 2, rx: 3, ry: 4 });
    ellipse.scale(3);
    expect(ellipse.describe()).toBe('cx=3 cy=6 rx=9 ry=12');
  });

  it('move 只改圆心', () => {
    const ellipse = new Ellipse('e1', { cx: 1, cy: 2, rx: 3, ry: 4 });
    ellipse.move(10, 20);
    expect(ellipse.describe()).toBe('cx=11 cy=22 rx=3 ry=4');
  });
});

describe('Line', () => {
  it('四个端点都跟着动', () => {
    const line = new Line('l1', { x1: 280, y1: 130, x2: 520, y2: 130 });
    line.move(10, 5);
    expect(line.describe()).toBe('(290,135) -> (530,135)');
  });

  it('有 stroke 就写在后面', () => {
    const line = new Line('l1', { x1: 0, y1: 0, x2: 10, y2: 10, stroke: 'black' });
    expect(line.describe()).toBe('(0,0) -> (10,10) stroke=black');
  });

  it('scale 会把两端一起放大', () => {
    const line = new Line('l1', { x1: 10, y1: 10, x2: 20, y2: 20 });
    line.scale(2);
    expect(line.describe()).toBe('(20,20) -> (40,40)');
  });
});

describe('TextShape', () => {
  it('scale 只乘坐标，没有字号可乘', () => {
    const text = new TextShape('t1', { x: 20, y: 40, content: 'My Diagram' });
    text.scale(2);
    expect(text.describe()).toBe('(40,80) "My Diagram"');
  });

  it('文本内容用 text 这个属性名读写', () => {
    const text = new TextShape('t1', { x: 20, y: 40, content: 'My Diagram' });
    expect(text.getAttribute('text')).toBe('My Diagram');

    text.setAttribute('text', 'My Diagram v2');
    expect(text.textContent()).toBe('My Diagram v2');
    expect(text.describe()).toBe('(20,40) "My Diagram v2"');
  });

  it('内容里有引号时，describe 里要转义', () => {
    const text = new TextShape('t1', { x: 0, y: 0, content: 'say "hi"' });
    expect(text.describe()).toBe('(0,0) "say \\"hi\\""');
  });

  it('text 以外的属性仍然走白名单', () => {
    const text = new TextShape('t1', { x: 0, y: 0, content: 'a' });
    expect(() => text.setAttribute('font-size', '12')).toThrow('unknown attribute: font-size');
  });

  it('clone 保留内容', () => {
    const text = new TextShape('t1', { x: 1, y: 2, content: 'abc' });
    expect(text.clone().textContent()).toBe('abc');
  });
});
