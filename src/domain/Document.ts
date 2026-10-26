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
  /** 上一次 read/save 用的路径，`save` 不带参数时用它。 */
  sourcePath: string | null = null;
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

  /** 把已有节点连同子树挪到新容器下面（addto / ungroup / front / back 都靠它）。 */
  moveTo(shape: Shape, parent: Group, index?: number): void {
    if (!parent.acceptsChildren()) {
      throw new AppError(`not a container: ${parent.id}`);
    }
    if (shape === parent || this.isAncestorOf(shape, parent)) {
      throw new AppError(`cannot move a container into its own descendant: ${shape.id}`);
    }
    shape.parent?.detach(shape);
    parent.insertAt(shape, index ?? parent.childCount);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  clear(): void {
    for (const child of [...this.root.children]) {
      this.root.detach(child);
    }
    this.index.clear();
  }

  /** 整篇文档的深拷贝，撤销快照用。 */
  clone(): Document {
    const copy = new Document(this.width, this.height);
    copy.sourcePath = this.sourcePath;
    for (const child of this.children) {
      copy.add(child.clone());
    }
    return copy;
  }

  /** 用快照覆盖当前内容。会重新 clone 一遍，避免快照被后面的编辑改掉。 */
  restoreFrom(snapshot: Document): void {
    this.width = snapshot.width;
    this.height = snapshot.height;
    this.sourcePath = snapshot.sourcePath;
    this.clear();
    for (const child of snapshot.children) {
      this.add(child.clone());
    }
  }

  /** target 是不是在 ancestor 的子树里（含 target === ancestor）。 */
  isAncestorOf(ancestor: Shape, target: Shape): boolean {
    let node: Shape | null = target;
    while (node !== null) {
      if (node === ancestor) {
        return true;
      }
      node = node.parent;
    }
    return false;
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
