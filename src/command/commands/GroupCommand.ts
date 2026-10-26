import { AppError } from '../../shared/AppError.js';
import type { Document } from '../../domain/Document.js';
import { Group } from '../../domain/Group.js';
import { SnapshotCommand } from '../SnapshotCommand.js';

/**
 * group <newGid> <id1> <id2>…
 * 新容器插在第一个成员原来的位置，这样 z-order 不会突然跑到最上面。
 */
export class GroupCommand extends SnapshotCommand {
  private count = 0;

  constructor(
    private readonly groupId: string,
    private readonly memberIds: string[],
  ) {
    super();
  }

  protected apply(document: Document): void {
    if (this.memberIds.length === 0) {
      throw new AppError('group needs at least one shape');
    }

    const members = this.memberIds.map((id) => document.find(id));

    for (const container of members) {
      for (const other of members) {
        if (container !== other && document.isAncestorOf(container, other)) {
          throw new AppError(`cannot group a container into its own descendant: ${container.id}`);
        }
      }
    }

    const first = members[0]!;
    const parent = first.parent;
    if (parent === null) {
      throw new AppError(`no such shape: ${first.id}`);
    }
    const index = parent.indexOf(first);

    const group = new Group(this.groupId);
    document.add(group, parent, index);
    for (const member of members) {
      document.moveTo(member, group);
    }
    this.count = members.length;
  }

  protected describe(): string[] {
    return [`g#${this.groupId} created with ${this.count} children`];
  }

  protected override describeUndo(): string[] {
    return [`g#${this.groupId} ungrouped (${this.count} children restored)`];
  }
}
