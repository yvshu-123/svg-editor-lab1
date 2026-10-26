import { describe, expect, it } from 'vitest';
import { IdAllocator } from '../../src/domain/IdAllocator.js';

describe('IdAllocator', () => {
  it('按 标签名+序号 生成，每个标签各自从 1 开始', () => {
    const allocator = new IdAllocator(() => false);
    expect(allocator.allocate('rect')).toBe('rect1');
    expect(allocator.allocate('rect')).toBe('rect2');
    expect(allocator.allocate('circle')).toBe('circle1');
  });

  it('跳过已经被占用的 id', () => {
    const taken = new Set(['rect1', 'rect2']);
    const allocator = new IdAllocator((id) => taken.has(id));
    expect(allocator.allocate('rect')).toBe('rect3');
  });
});
