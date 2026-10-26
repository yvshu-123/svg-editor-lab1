import type { Document } from '../domain/Document.js';
import type { Group } from '../domain/Group.js';
import type { Shape } from '../domain/Shape.js';
import { AppError } from '../shared/AppError.js';
import { formatNumber } from '../shared/NumberFormat.js';
import type { FileSystemPort } from './FileSystemPort.js';

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

const escapeXml = (text: string): string => text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);

/**
 * SVG 序列化。属性顺序固定（id → 几何 → 样式），
 * 这样 round-trip 和快照断言才是稳定的。
 * 这里没有 `implements SvgWriterPort`：结构类型已经满足契约，
 * 省掉一条 io → command 的依赖。
 */
export class SvgWriter {
  constructor(private readonly fileSystem: FileSystemPort) {}

  write(document: Document, path: string): void {
    try {
      this.fileSystem.writeText(path, this.toXml(document));
    } catch {
      throw new AppError(`cannot write file: ${path}`);
    }
  }

  toXml(document: Document): string {
    const width = formatNumber(document.width);
    const height = formatNumber(document.height);
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    ];
    for (const child of document.children) {
      this.renderShape(child, 1, lines);
    }
    lines.push('</svg>');
    return `${lines.join('\n')}\n`;
  }

  private renderShape(shape: Shape, depth: number, lines: string[]): void {
    const indent = '  '.repeat(depth);
    const attributes = [
      `id="${escapeXml(shape.id)}"`,
      ...shape.svgAttributes().map(([name, value]) => `${name}="${escapeXml(value)}"`),
    ].join(' ');
    const tag = shape.kind;

    if (shape.acceptsChildren()) {
      const children = (shape as Group).children;
      if (children.length === 0) {
        lines.push(`${indent}<${tag} ${attributes}/>`);
        return;
      }
      lines.push(`${indent}<${tag} ${attributes}>`);
      for (const child of children) {
        this.renderShape(child, depth + 1, lines);
      }
      lines.push(`${indent}</${tag}>`);
      return;
    }

    const text = shape.textContent();
    if (text === null) {
      lines.push(`${indent}<${tag} ${attributes}/>`);
    } else {
      lines.push(`${indent}<${tag} ${attributes}>${escapeXml(text)}</${tag}>`);
    }
  }
}
