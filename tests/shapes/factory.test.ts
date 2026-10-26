import { describe, expect, it } from 'vitest';
import { Line } from '../../src/domain/Line.js';
import { TextShape } from '../../src/domain/TextShape.js';
import { ShapeFactory } from '../../src/shapes/ShapeFactory.js';

const factory = new ShapeFactory();

describe('ShapeFactory', () => {
  it('rect 带 fill 和不带 fill', () => {
    expect(factory.create('rect', 'r1', ['10', '20', '100', '50', '#eee']).describe()).toBe(
      'x=10 y=20 w=100 h=50 fill=#eee',
    );
    expect(factory.create('rect', 'r2', ['0', '0', '1', '1']).getAttribute('fill')).toBeUndefined();
  });

  it('circle / ellipse / g', () => {
    expect(factory.create('circle', 'c1', ['100', '100', '20', 'red']).describe()).toBe(
      'cx=100 cy=100 r=20 fill=red',
    );
    expect(factory.create('ellipse', 'e1', ['1', '2', '3', '4']).describe()).toBe('cx=1 cy=2 rx=3 ry=4');
    expect(factory.create('g', 'g1', []).kind).toBe('g');
  });

  it('line 的第五个参数是 stroke', () => {
    const line = factory.create('line', 'l1', ['0', '0', '10', '10', 'black']);
    expect(line).toBeInstanceOf(Line);
    expect(line.getAttribute('stroke')).toBe('black');
  });

  it('text 的内容可以带空格', () => {
    const text = factory.create('text', 't1', ['20', '40', 'My Diagram']);
    expect(text).toBeInstanceOf(TextShape);
    expect(text.textContent()).toBe('My Diagram');
  });

  it('没注册的类型要报 unknown shape type，并提示插件', () => {
    expect(() => factory.create('hexagon', 'h1', ['0', '0', '1'])).toThrow(
      'unknown shape type: hexagon (is the plugin loaded?)',
    );
    expect(() => factory.create('box', 'b1', ['0', '0', '1', '1', 'x'])).toThrow(
      'unknown shape type: box (is the plugin loaded?)',
    );
  });

  it('参数个数不对报 usage', () => {
    expect(() => factory.create('rect', 'r1', ['10', '20'])).toThrow(
      'usage: create rect <id> <x> <y> <w> <h> [fill]',
    );
    expect(() => factory.create('text', 't1', ['20'])).toThrow('usage: create text <id> <x> <y> "content"');
  });

  it('参数不是数字时报 invalid number', () => {
    expect(() => factory.create('rect', 'r1', ['a', '0', '1', '1'])).toThrow('invalid number for x: a');
  });

  it('注册表里带着 SVG 属性顺序，读入时会用到', () => {
    expect(factory.svgAttributeNames('rect')).toEqual(['x', 'y', 'width', 'height']);
    expect(factory.usesTextContent('text')).toBe(true);
    expect(factory.has('circle')).toBe(true);
    expect(factory.has('box')).toBe(false);
  });
});
