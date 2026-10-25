import { AppError } from '../shared/AppError.js';
import type { Group } from './Group.js';
import { SvgRoot } from './SvgRoot.js';
import type { Shape } from './Shape.js';

/**
 * 文档：画布尺寸 + 根容器 + id 索引。
 * 所有结构变更都从这里走，保证 id 唯一和父指针一致只有一个入口。
 */
export class Document {
  width: number;
  height: number;
  readonly root: SvgRoot;

  private readonly index = new Map<string, Shape>();

  constructor(width = 800, height = 600) {
    this.width = width;
    this.height = height;
    this.root = new SvgRoot();
  }

  get children(): readonly Shape[] {
    return this.root.children;
  }

  count(): number {
    return this.index.size;
  }

  has(id: string): boolean {
    return this.index.has(id);
  }

  tryFind(id: string): Shape | undefined {
    return this.index.get(id);
  }

  find(id: string): Shape {
    const shape = this.index.get(id);
    if (shape === undefined) {
      throw new AppError(`no such shape: ${id}`);
    }
    return shape;
  }

  add(shape: Shape, parent: Group = this.root, index?: number): void {
    if (shape.id.length === 0) {
      throw new AppError('shape id must not be empty');
    }
    if (this.index.has(shape.id)) {
      throw new AppError(`id already exists: ${shape.id}`);
    }
    if (!parent.acceptsChildren()) {
      throw new AppError(`not a container: ${parent.id}`);
    }
    this.collectIds(shape);
    parent.insertAt(shape, index ?? parent.childCount);
  }

  remove(id: string): Shape {
    const shape = this.find(id);
    shape.parent?.detach(shape);
    this.dropIds(shape);
    return shape;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  private collectIds(shape: Shape): void {
    if (this.index.has(shape.id)) {
      throw new AppError(`id already exists: ${shape.id}`);
    }
    this.index.set(shape.id, shape);
    if (shape.acceptsChildren()) {
      for (const child of (shape as Group).children) {
        this.collectIds(child);
      }
    }
  }

  private dropIds(shape: Shape): void {
    this.index.delete(shape.id);
    if (shape.acceptsChildren()) {
      for (const child of (shape as Group).children) {
        this.dropIds(child);
      }
    }
  }
}
