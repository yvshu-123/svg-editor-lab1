import { AppError } from '../../shared/AppError.js';
import type { Document } from '../../domain/Document.js';
import type { Group } from '../../domain/Group.js';
import type { ShapeFactory } from '../../shapes/ShapeFactory.js';
import { SnapshotCommand } from '../SnapshotCommand.js';

/**
 * create <type> <id> [params…] [in <containerId>]
 * 容器是否存在、是不是容器、类型有没有注册、id 有没有被占，
 * 都要在动文档之前查完。
 */
export class CreateShapeCommand extends SnapshotCommand {
  private label = '';

  constructor(
    private readonly factory: ShapeFactory,
    private readonly type: string,
    private readonly shapeId: string,
    private readonly params: string[],
    private readonly containerId?: string,
  ) {
    super();
  }

  protected apply(document: Document): void {
    if (this.containerId !== undefined) {
      if (!document.has(this.containerId)) {
        throw new AppError(`no such container: ${this.containerId}`);
      }
      if (!document.find(this.containerId).acceptsChildren()) {
        throw new AppError(`not a container: ${this.containerId}`);
      }
    }

    const shape = this.factory.create(this.type, this.shapeId, this.params);
    this.label = `${shape.kind}#${shape.id}`;

    if (this.containerId === undefined) {
      document.add(shape);
    } else {
      document.add(shape, document.find(this.containerId) as Group);
    }
  }

  protected describe(): string[] {
    return [
      this.containerId === undefined ? `${this.label} created` : `${this.label} created in g#${this.containerId}`,
    ];
  }

  protected override describeUndo(): string[] {
    return [`${this.label} creation undone`];
  }
}
