import { describe, expect, it } from 'vitest';
import { Document } from '../../src/domain/Document.js';
import { Group } from '../../src/domain/Group.js';
import { Rect } from '../../src/domain/Rect.js';

const rect = (id: string, x = 0): Rect => new Rect(id, { x, y: 0, width: 10, height: 10 });

describe('Document', () => {
  it('默认 800x600，根节点的 kind 是 svg', () => {
    const doc = new Document();
    expect(doc.width).toBe(800);
    expect(doc.height).toBe(600);
    expect(doc.root.kind).toBe('svg');
    expect(doc.count()).toBe(0);
  });

  it('add 之后能按 id 找到，父指针指向根', () => {
    const doc = new Document(400, 200);
    doc.add(rect('r1'));
    expect(doc.count()).toBe(1);
    expect(doc.find('r1').parent).toBe(doc.root);
  });

  it('id 重复直接拒绝', () => {
    const doc = new Document();
    doc.add(rect('r1'));
    expect(() => doc.add(rect('r1'))).toThrow('id already exists: r1');
  });

  it('计数不含根节点，容器的子节点也算', () => {
    const doc = new Document();
    const group = new Group('g1');
    doc.add(group);
    doc.add(rect('r1'), group);
    expect(doc.count()).toBe(2);
  });

  it('按索引插入能控制前后顺序', () => {
    const doc = new Document();
    doc.add(rect('a'));
    doc.add(rect('b'));
    doc.add(rect('c'), doc.root, 1);
    expect(doc.children.map((shape) => shape.id)).toEqual(['a', 'c', 'b']);
  });

  it('删除容器时子孙一起从索引里消失', () => {
    const doc = new Document();
    const group = new Group('g1');
    doc.add(group);
    doc.add(rect('r1'), group);
    doc.add(rect('r2'));

    doc.remove('g1');

    expect(doc.count()).toBe(1);
    expect(doc.has('r1')).toBe(false);
    expect(() => doc.find('r1')).toThrow('no such shape: r1');
  });

  it('删除不存在的 id 报 no such shape', () => {
    const doc = new Document();
    expect(() => doc.remove('r9')).toThrow('no such shape: r9');
  });

  it('删掉之后 id 可以再用', () => {
    const doc = new Document();
    doc.add(rect('r1'));
    doc.remove('r1');
    doc.add(rect('r1'));
    expect(doc.count()).toBe(1);
  });

  it('不能把图形挂到叶子节点下面', () => {
    const doc = new Document();
    const leaf = rect('r1');
    doc.add(leaf);
    expect(() => doc.add(rect('r2'), leaf as unknown as Group)).toThrow('not a container: r1');
  });

  it('resize 只改画布尺寸，不动内容', () => {
    const doc = new Document(400, 300);
    doc.add(rect('r1'));
    doc.resize(1024, 768);
    expect(doc.width).toBe(1024);
    expect(doc.height).toBe(768);
    expect(doc.count()).toBe(1);
  });
});
