import { describe, expect, it } from 'vitest';
import { Circle } from '../../src/domain/Circle.js';
import { Document } from '../../src/domain/Document.js';
import { Group } from '../../src/domain/Group.js';
import { Rect } from '../../src/domain/Rect.js';

const rect = (id: string, x = 0): Rect => new Rect(id, { x, y: 0, width: 10, height: 10 });

describe('快照', () => {
  it('clone 是深拷贝，改原文档不影响副本', () => {
    const doc = new Document();
    doc.add(rect('r1', 10));

    const snapshot = doc.clone();
    doc.find('r1').move(100, 0);

    expect(doc.find('r1').getAttribute('x')).toBe('110');
    expect(snapshot.find('r1').getAttribute('x')).toBe('10');
  });

  it('restoreFrom 把内容和画布尺寸都还原', () => {
    const doc = new Document(400, 200);
    doc.add(new Circle('c1', { cx: 100, cy: 100, r: 20 }));
    const snapshot = doc.clone();

    doc.find('c1').move(30, 0);
    doc.resize(800, 600);
    doc.restoreFrom(snapshot);

    expect(doc.find('c1').getAttribute('cx')).toBe('100');
    expect(doc.width).toBe(400);
    expect(doc.height).toBe(200);
  });

  it('还原之后再编辑，不会污染快照', () => {
    const doc = new Document();
    doc.add(rect('r1', 10));
    const snapshot = doc.clone();

    doc.restoreFrom(snapshot);
    doc.find('r1').move(999, 999);

    expect(snapshot.find('r1').getAttribute('x')).toBe('10');
  });

  it('快照里的父子关系和原文档一致', () => {
    const doc = new Document();
    const group = new Group('g1');
    doc.add(group);
    doc.add(rect('r1'), group);

    const snapshot = doc.clone();

    expect(snapshot.find('r1').parent?.id).toBe('g1');
    expect(snapshot.count()).toBe(2);
  });
});

describe('moveTo', () => {
  it('把节点从原来的父级摘下来再挂过去', () => {
    const doc = new Document();
    const group = new Group('g1');
    doc.add(group);
    doc.add(rect('r1'));
    doc.add(rect('r2'));

    doc.moveTo(doc.find('r1'), group);

    expect(doc.children.map((shape) => shape.id)).toEqual(['g1', 'r2']);
    expect(doc.find('r1').parent).toBe(group);
    expect(doc.count()).toBe(3);
  });

  it('拒绝把容器移进自己的子孙', () => {
    const doc = new Document();
    const outer = new Group('outer');
    const inner = new Group('inner');
    doc.add(outer);
    doc.add(inner, outer);

    expect(() => doc.moveTo(outer, inner)).toThrow('cannot move a container into its own descendant: outer');
  });

  it('拒绝把容器挂到自己身上', () => {
    const doc = new Document();
    const group = new Group('g1');
    doc.add(group);

    expect(() => doc.moveTo(group, group)).toThrow(/own descendant/);
  });

  it('目标不是容器就报错', () => {
    const doc = new Document();
    const leaf = rect('r1');
    doc.add(leaf);
    doc.add(rect('r2'));

    expect(() => doc.moveTo(doc.find('r2'), leaf as unknown as Group)).toThrow('not a container: r1');
  });
});

describe('clear', () => {
  it('清空内容但保留画布尺寸', () => {
    const doc = new Document(400, 300);
    doc.add(rect('r1'));
    doc.clear();

    expect(doc.count()).toBe(0);
    expect(doc.children.length).toBe(0);
    expect(doc.width).toBe(400);
  });
});
