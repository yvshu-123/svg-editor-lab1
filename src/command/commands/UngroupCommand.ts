import { AppError } from '../../shared/AppError.js';
import type { Document } from '../../domain/Document.js';
import type { Group } from '../../domain/Group.js';
import { SnapshotCommand } from '../SnapshotCommand.js';

/**
 * ungroup <gid>：子节点提升到原容器的父级，占据原容器的位置。
 * 根级容器直接拒绝——这是作业 §4.2 的硬性文案。
 */
export class UngroupCommand extends SnapshotCommand {
  private count = 0;

  constructor(private readonly groupId: string) {
    super();
  }

  protected apply(document: Document): void {
    const group = document.find(this.groupId);
    if (!group.acceptsChildren()) {
      throw new AppError(`not a container: ${this.groupId}`);
    }
    const container = group as Group;
    const parent = group.parent;
    if (parent === null || parent.id === '') {
      throw new AppError(`cannot ungroup top-level container: ${this.groupId}`);
    }

    const index = parent.indexOf(group);
    const children = [...container.children];

    // 先把孩子摘出来，再把空壳删掉，最后按原索引插回去。
    for (const child of children) {
      container.detach(child);
    }
    document.remove(this.groupId);
    children.forEach((child, offset) => {
      parent.insertAt(child, index + offset);
    });
    this.count = children.length;
  }

  protected describe(): string[] {
    return [`g#${this.groupId} ungrouped (${this.count} children)`];
  }

  protected override describeUndo(): string[] {
    return [`g#${this.groupId} regrouped`];
  }
}
