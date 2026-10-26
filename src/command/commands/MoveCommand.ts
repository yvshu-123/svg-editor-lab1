import type { Document } from '../../domain/Document.js';
import { formatNumber } from '../../shared/NumberFormat.js';
import { SnapshotCommand } from '../SnapshotCommand.js';

/**
 * move <id> <dx> <dy>：增量平移。
 * 叶子回显绝对坐标，容器回显增量，跟作业 §6 的 transcript 对齐。
 */
export class MoveCommand extends SnapshotCommand {
  private label = '';
  private isContainer = false;

  constructor(
    private readonly shapeId: string,
    private readonly dx: number,
    private readonly dy: number,
  ) {
    super();
  }

  protected apply(document: Document): void {
    const shape = document.find(this.shapeId);
    this.label = `${shape.kind}#${shape.id}`;
    this.isContainer = shape.acceptsChildren();
    shape.move(this.dx, this.dy);
  }

  protected describe(document: Document): string[] {
    if (this.isContainer) {
      return [`${this.label} moved by (${formatNumber(this.dx)},${formatNumber(this.dy)})`];
    }
    const [x, y] = positionOf(document, this.shapeId);
    return [`${this.label} moved to (${formatNumber(x)},${formatNumber(y)})`];
  }

  protected override describeUndo(document: Document): string[] {
    if (this.isContainer) {
      return [`${this.label} moved back by (${formatNumber(-this.dx)},${formatNumber(-this.dy)})`];
    }
    const [x, y] = positionOf(document, this.shapeId);
    return [`${this.label} moved back to (${formatNumber(x)},${formatNumber(y)})`];
  }
}

/** 前两个几何属性就是位置：rect 的 x/y、circle 的 cx/cy、line 的 x1/y1。 */
function positionOf(document: Document, id: string): [number, number] {
  const pairs = document.find(id).geometryPairs();
  return [Number(pairs[0]?.[1] ?? 0), Number(pairs[1]?.[1] ?? 0)];
}
