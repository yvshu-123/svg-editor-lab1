import type { Document } from '../../domain/Document.js';
import { formatNumber } from '../../shared/NumberFormat.js';
import { SnapshotCommand } from '../SnapshotCommand.js';

/** scale <id> <factor>：factor 乘到全部几何属性，容器递归到每个子孙。 */
export class ScaleCommand extends SnapshotCommand {
  private label = '';

  constructor(
    private readonly shapeId: string,
    private readonly factor: number,
  ) {
    super();
  }

  protected apply(document: Document): void {
    const shape = document.find(this.shapeId);
    this.label = `${shape.kind}#${shape.id}`;
    shape.scale(this.factor);
  }

  protected describe(): string[] {
    return [`${this.label} scaled by ${formatNumber(this.factor)}`];
  }

  protected override describeUndo(): string[] {
    return [`${this.label} scale undone`];
  }
}
