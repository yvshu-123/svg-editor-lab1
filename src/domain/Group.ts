import { AppError } from '../shared/AppError.js';
import { type GeometryDefinition, Shape } from './Shape.js';

/**
 * 容器。move / scale 不写 transform，而是逐个改子孙的坐标，
 * 这样 tree 和 show 看到的永远是绝对坐标。
 */
export class Group extends Shape {
  private readonly childList: Shape[] = [];

  constructor(id: string) {
    super(id);
  }

  override get kind(): string {
    return 'g';
  }

  get children(): readonly Shape[] {
    return this.childList;
  }

  get childCount(): number {
    return this.childList.length;
  }

  override acceptsChildren(): boolean {
    return true;
  }

  override move(dx: number, dy: number): void {
    for (const child of this.childList) {
      child.move(dx, dy);
    }
  }

  override scale(factor: number): void {
    if (!(factor > 0)) {
      throw new AppError('scale factor must be positive');
    }
    for (const child of this.childList) {
      child.scale(factor);
    }
  }

  append(child: Shape): void {
    child.parent = this;
    this.childList.push(child);
  }

  insertAt(child: Shape, index: number): void {
    const position = Math.max(0, Math.min(index, this.childList.length));
    child.parent = this;
    this.childList.splice(position, 0, child);
  }

  indexOf(child: Shape): number {
    return this.childList.indexOf(child);
  }

  /** 摘下子节点，返回它原来的索引；本来就不在这里就返回 -1。 */
  detach(child: Shape): number {
    const index = this.childList.indexOf(child);
    if (index >= 0) {
      this.childList.splice(index, 1);
      child.parent = null;
    }
    return index;
  }

  override clone(): Group {
    const copy = new Group(this.id);
    this.copyStyleTo(copy);
    for (const child of this.childList) {
      copy.append(child.clone());
    }
    return copy;
  }

  protected override geometryDefinitions(): readonly GeometryDefinition[] {
    return [];
  }
}
