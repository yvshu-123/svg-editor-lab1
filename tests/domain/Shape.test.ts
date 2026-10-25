import { describe, expect, it } from 'vitest';
import { Circle } from '../../src/domain/Circle.js';
import { Rect } from '../../src/domain/Rect.js';
import { AppError } from '../../src/shared/AppError.js';

describe('Rect', () => {
  it('move 只挪位置，不动尺寸', () => {
    const rect = new Rect('r1', { x: 10, y: 20, width: 100, height: 50 });
    rect.move(5, -5);
    expect(rect.getAttribute('x')).toBe('15');
    expect(rect.getAttribute('y')).toBe('15');
    expect(rect.getAttribute('width')).toBe('100');
    expect(rect.getAttribute('height')).toBe('50');
  });

  it('scale 连位置一起乘', () => {
    const rect = new Rect('r1', { x: 10, y: 20, width: 100, height: 50 });
    rect.scale(2);
    expect(rect.describe()).toBe('x=20 y=40 w=200 h=100');
  });

  it('factor 不是正数就报错，且不改状态', () => {
    const rect = new Rect('r1', { x: 10, y: 20, width: 100, height: 50 });
    expect(() => rect.scale(0)).toThrow('scale factor must be positive');
    expect(() => rect.scale(-1)).toThrow('scale factor must be positive');
    expect(rect.getAttribute('x')).toBe('10');
  });

  it('可以改白名单里的几何属性', () => {
    const rect = new Rect('r1', { x: 0, y: 0, width: 10, height: 10 });
    rect.setAttribute('width', '42.5');
    expect(rect.getAttribute('width')).toBe('42.5');
  });

  it('白名单外的属性报 unknown attribute', () => {
    const rect = new Rect('r1', { x: 0, y: 0, width: 10, height: 10 });
    expect(() => rect.setAttribute('opacity', '0.5')).toThrow('unknown attribute: opacity');
  });

  it('写入的不是数字时，错误里带参数名', () => {
    const rect = new Rect('r1', { x: 0, y: 0, width: 10, height: 10 });
    expect(() => rect.setAttribute('width', 'abc')).toThrow('invalid number for width: abc');
  });

  it('没给 fill 就不要这个属性', () => {
    const rect = new Rect('r1', { x: 0, y: 0, width: 10, height: 10 });
    expect(rect.getAttribute('fill')).toBeUndefined();
    expect(rect.svgAttributes().map(([name]) => name)).not.toContain('fill');
  });

  it('describe 把几何和样式写在一起，宽度用 w/h', () => {
    const rect = new Rect('r1', { x: 0, y: 0, width: 800, height: 600, fill: '#ffffff' });
    expect(rect.describe()).toBe('x=0 y=0 w=800 h=600 fill=#ffffff');
  });
});

describe('Circle', () => {
  it('move 改圆心', () => {
    const circle = new Circle('c1', { cx: 100, cy: 100, r: 20 });
    circle.move(30, 0);
    expect(circle.getAttribute('cx')).toBe('130');
    expect(circle.getAttribute('cy')).toBe('100');
  });

  it('scale 同时改圆心和半径', () => {
    const circle = new Circle('c1', { cx: 100, cy: 100, r: 20 });
    circle.scale(2);
    expect(circle.describe()).toBe('cx=200 cy=200 r=40');
  });

  it('clone 之后改原对象，副本不受影响', () => {
    const circle = new Circle('c1', { cx: 10, cy: 10, r: 5, fill: 'red' });
    const copy = circle.clone();
    circle.move(100, 0);
    expect(copy.getAttribute('cx')).toBe('10');
    expect(copy.getAttribute('fill')).toBe('red');
  });
});

describe('错误类型', () => {
  it('几何校验失败抛的是 AppError', () => {
    const rect = new Rect('r1', { x: 0, y: 0, width: 1, height: 1 });
    expect(() => rect.setAttribute('nope', '1')).toThrow(AppError);
  });
});
