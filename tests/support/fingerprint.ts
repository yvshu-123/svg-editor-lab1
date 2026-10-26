import type { Document } from '../../src/domain/Document.js';
import type { Group } from '../../src/domain/Group.js';
import type { Shape } from '../../src/domain/Shape.js';

/** 把整棵树压成文本，用来断言"命令失败不改状态"。 */
export function fingerprint(doc: Document): string {
  const lines = [`canvas ${doc.width}x${doc.height}`];
  const walk = (shape: Shape, depth: number): void => {
    lines.push(`${'  '.repeat(depth)}${shape.kind}#${shape.id} ${shape.describe()}`);
    if (shape.acceptsChildren()) {
      for (const child of (shape as Group).children) {
        walk(child, depth + 1);
      }
    }
  };
  for (const child of doc.children) {
    walk(child, 0);
  }
  return lines.join('\n');
}
