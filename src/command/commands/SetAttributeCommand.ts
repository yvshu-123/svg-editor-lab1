import type { Document } from '../../domain/Document.js';
import { SnapshotCommand } from '../SnapshotCommand.js';

/** set <id> <attr> <value>：白名单和语义由各自的 Shape 子类负责。 */
export class SetAttributeCommand extends SnapshotCommand {
  private label = '';

  constructor(
    private readonly shapeId: string,
    private readonly attribute: string,
    private readonly value: string,
  ) {
    super();
  }

  protected apply(document: Document): void {
    const shape = document.find(this.shapeId);
    this.label = `${shape.kind}#${shape.id}`;
    shape.setAttribute(this.attribute, this.value);
  }

  protected describe(document: Document): string[] {
    const current = document.find(this.shapeId).getAttribute(this.attribute) ?? '';
    const shown = this.attribute === 'text' ? JSON.stringify(current) : current;
    return [`${this.label} updated: ${this.attribute}=${shown}`];
  }
}
