import { AppError } from '../../shared/AppError.js';
import type { Document } from '../../domain/Document.js';
import type { Group } from '../../domain/Group.js';
import { SnapshotCommand } from '../SnapshotCommand.js';

/** addto <gid> <id>：把已有图形移进容器，放到最后。 */
export class AddToCommand extends SnapshotCommand {
  private label = '';
  private originalParent = 'svg';

  constructor(
    private readonly groupId: string,
    private readonly shapeId: string,
  ) {
    super();
  }

  protected apply(document: Document): void {
    const container = document.find(this.groupId);
    if (!container.acceptsChildren()) {
      throw new AppError(`not a container: ${this.groupId}`);
    }
    const shape = document.find(this.shapeId);
    this.label = `${shape.kind}#${shape.id}`;
    const parent = shape.parent;
    this.originalParent = parent === null || parent.id === '' ? 'svg' : `g#${parent.id}`;
    document.moveTo(shape, container as Group);
  }

  protected describe(): string[] {
    return [`${this.label} added to g#${this.groupId}`];
  }

  protected override describeUndo(): string[] {
    return [`${this.label} moved back to ${this.originalParent}`];
  }
}
