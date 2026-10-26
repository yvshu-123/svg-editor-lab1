import type { Document } from '../../domain/Document.js';
import { SnapshotCommand } from '../SnapshotCommand.js';

/**
 * delete <id>：容器连同子孙一起删；撤销要靠快照还原
 * "原来挂在谁下面、第几个位置"。
 */
export class DeleteShapeCommand extends SnapshotCommand {
  private label = '';
  private parentLabel = 'svg';

  constructor(private readonly shapeId: string) {
    super();
  }

  protected apply(document: Document): void {
    const shape = document.find(this.shapeId);
    this.label = `${shape.kind}#${shape.id}`;
    const parent = shape.parent;
    this.parentLabel = parent === null || parent.id === '' ? 'svg' : `g#${parent.id}`;
    document.remove(this.shapeId);
  }

  protected describe(): string[] {
    return [`${this.label} deleted`];
  }

  protected override describeUndo(): string[] {
    return [`${this.label} restored into ${this.parentLabel}`];
  }
}
