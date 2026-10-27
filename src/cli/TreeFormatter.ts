import type { Document } from '../domain/Document.js';
import type { Group } from '../domain/Group.js';
import type { Shape } from '../domain/Shape.js';
import { formatNumber } from '../shared/NumberFormat.js';

interface Row {
  readonly prefix: string;
  readonly label: string;
  readonly summary: string;
}

const PADDING = 2;

/**
 * tree 的渲染。属性必须内联在树上，否则脱离画布就没法工作（作业 §5.1）。
 * 列宽按当前子树里最长的「前缀+标签」算，不硬编码空格。
 */
export class TreeFormatter {
  render(document: Document, rootId?: string): string[] {
    if (rootId === undefined) {
      const rows: Row[] = [];
      this.collect(document.children, '', rows);
      return [`svg (${formatNumber(document.width)}x${formatNumber(document.height)})`, ...this.align(rows)];
    }

    const root = document.find(rootId);
    const summary = root.describe();
    const head = summary.length === 0 ? `${root.kind}#${root.id}` : `${root.kind}#${root.id} ${summary}`;
    const rows: Row[] = [];
    if (root.acceptsChildren()) {
      this.collect((root as Group).children, '', rows);
    }
    return [head, ...this.align(rows)];
  }

  private collect(children: readonly Shape[], prefix: string, rows: Row[]): void {
    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      rows.push({
        prefix: `${prefix}${isLast ? '└── ' : '├── '}`,
        label: `${child.kind}#${child.id}`,
        summary: child.describe(),
      });
      if (child.acceptsChildren()) {
        this.collect((child as Group).children, `${prefix}${isLast ? '    ' : '│   '}`, rows);
      }
    });
  }

  private align(rows: readonly Row[]): string[] {
    const width = rows.reduce((max, row) => Math.max(max, row.prefix.length + row.label.length), 0);
    return rows.map((row) => {
      const head = `${row.prefix}${row.label}`;
      if (row.summary.length === 0) {
        return head;
      }
      return `${head}${' '.repeat(width - head.length + PADDING)}${row.summary}`;
    });
  }
}
