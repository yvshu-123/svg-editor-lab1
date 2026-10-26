import { AppError } from '../../shared/AppError.js';
import type { Document } from '../../domain/Document.js';
import { SnapshotCommand } from '../SnapshotCommand.js';

export type ReorderPosition = 'front' | 'back';

/** front / back：同级最前或最后；撤销靠快照回到原索引。 */
export class ReorderCommand extends SnapshotCommand {
  private label = '';

  constructor(
    private readonly shapeId: string,
    private readonly position: ReorderPosition,
  ) {
    super();
  }

  protected apply(document: Document): void {
    const shape = document.find(this.shapeId);
    this.label = `${shape.kind}#${shape.id}`;
    const parent = shape.parent;
    if (parent === null) {
      throw new AppError(`no such shape: ${this.shapeId}`);
    }
    parent.detach(shape);
    parent.insertAt(shape, this.position === 'front' ? parent.childCount : 0);
  }

  protected describe(): string[] {
    return [this.position === 'front' ? `${this.label} brought to front` : `${this.label} sent to back`];
  }

  protected override describeUndo(): string[] {
    return [`${this.label} moved back to original position`];
  }
}
