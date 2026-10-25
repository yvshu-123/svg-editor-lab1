import { describe, expect, it } from 'vitest';
import { Circle } from '../../src/domain/Circle.js';
import { Group } from '../../src/domain/Group.js';
import { Rect } from '../../src/domain/Rect.js';

describe('Group', () => {
  it('kind 是 g，和叶子一样是 Shape', () => {
    const group = new Group('g1');
    expect(group.kind).toBe('g');
    expect(group.acceptsChildren()).toBe(true);
    expect(new Rect('r1', { x: 0, y: 0, width: 1, height: 1 }).acceptsChildren()).toBe(false);
  });

  it('move 会递归到每个子节点', () => {
    const outer = new Group('outer');
    const inner = new Group('inner');
    const rect = new Rect('r1', { x: 0, y: 0, width: 10, height: 10 });
    outer.append(inner);
    inner.append(rect);

    outer.move(100, 50);

    expect(rect.getAttribute('x')).toBe('100');
    expect(rect.getAttribute('y')).toBe('50');
  });

  it('scale 也递归', () => {
    const group = new Group('g1');
    const circle = new Circle('c1', { cx: 10, cy: 10, r: 5 });
    group.append(circle);

    group.scale(3);

    expect(circle.describe()).toBe('cx=30 cy=30 r=15');
  });

  it('容器自己也能带样式', () => {
    const group = new Group('g1');
    group.setAttribute('fill', 'red');
    expect(group.describe()).toBe('fill=red');
  });

  it('append / insertAt / indexOf / detach 维护父子指针', () => {
    const group = new Group('g1');
    const a = new Rect('a', { x: 0, y: 0, width: 1, height: 1 });
    const b = new Rect('b', { x: 0, y: 0, width: 1, height: 1 });

    group.append(a);
    group.insertAt(b, 0);

    expect(group.children.map((child) => child.id)).toEqual(['b', 'a']);
    expect(group.indexOf(a)).toBe(1);
    expect(a.parent).toBe(group);

    group.detach(a);
    expect(group.children.map((child) => child.id)).toEqual(['b']);
    expect(a.parent).toBeNull();
  });

  it('clone 是深拷贝', () => {
    const group = new Group('g1');
    const rect = new Rect('r1', { x: 0, y: 0, width: 10, height: 10 });
    group.append(rect);

    const copy = group.clone();
    rect.move(50, 50);

    expect(copy.children[0]?.getAttribute('x')).toBe('0');
    expect(copy.id).toBe('g1');
  });
});
