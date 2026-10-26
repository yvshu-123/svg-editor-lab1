import { DOMParser } from '@xmldom/xmldom';
import type { Element as XmlElement } from '@xmldom/xmldom';
import { Document } from '../domain/Document.js';
import type { Group } from '../domain/Group.js';
import { IdAllocator } from '../domain/IdAllocator.js';
import type { Shape } from '../domain/Shape.js';
import { ShapeFactory } from '../shapes/ShapeFactory.js';
import { AppError } from '../shared/AppError.js';
import { parseNumber } from '../shared/NumberFormat.js';
import type { FileSystemPort } from './FileSystemPort.js';
import type { ReadResult } from '../ports/Ports.js';

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const STYLE_ATTRIBUTES = ['fill', 'stroke', 'stroke-width'] as const;

/**
 * SVG 反序列化：DOM → 领域对象。
 * 缺 id 的按 `标签名+序号` 补，不认识的标签跳过，两种都记警告。
 */
export class SvgReader {
  constructor(
    private readonly fileSystem: FileSystemPort,
    private readonly factory: ShapeFactory,
  ) {}

  read(path: string): ReadResult {
    let source: string;
    try {
      source = this.fileSystem.readText(path);
    } catch {
      throw new AppError(`cannot read file: ${path}`);
    }
    return this.parse(source, path);
  }

  parse(source: string, label = 'svg'): ReadResult {
    let fatal = false;
    let root: XmlElement | null = null;

    try {
      const parser = new DOMParser({
        onError: (level: string) => {
          if (level === 'fatalError') {
            fatal = true;
          }
        },
      });
      const xml = parser.parseFromString(source, 'image/svg+xml');
      root = xml.documentElement as XmlElement | null;
    } catch {
      throw new AppError(`invalid svg: ${label}`);
    }

    if (fatal || root === null || (root.localName ?? root.tagName) !== 'svg') {
      throw new AppError(`invalid svg: ${label}`);
    }

    const document = new Document(
      this.dimension(root, 'width') ?? this.viewBoxDimension(root, 0) ?? DEFAULT_WIDTH,
      this.dimension(root, 'height') ?? this.viewBoxDimension(root, 1) ?? DEFAULT_HEIGHT,
    );
    const warnings: string[] = [];
    const allocator = new IdAllocator((id) => document.has(id));

    for (const element of this.childElements(root)) {
      this.buildElement(element, document, document.root, allocator, warnings);
    }

    return { document, warnings };
  }

  private buildElement(
    element: XmlElement,
    document: Document,
    parent: Group,
    allocator: IdAllocator,
    warnings: string[],
  ): Shape | undefined {
    const kind = element.localName ?? element.tagName;
    if (!this.factory.has(kind)) {
      warnings.push(`warning: unsupported element <${kind}> skipped`);
      return undefined;
    }

    const id = this.resolveId(element, kind, allocator, warnings);
    const params = this.factory.svgAttributeNames(kind).map((name) => element.getAttribute(name) ?? '0');
    if (this.factory.usesTextContent(kind)) {
      params.push(element.textContent ?? '');
    }

    const shape = this.factory.create(kind, id, params);
    this.applyStyle(shape, element);
    document.add(shape, parent);

    if (shape.acceptsChildren()) {
      for (const child of this.childElements(element)) {
        this.buildElement(child, document, shape as Group, allocator, warnings);
      }
    }
    return shape;
  }

  private resolveId(element: XmlElement, kind: string, allocator: IdAllocator, warnings: string[]): string {
    const raw = element.getAttribute('id');
    if (raw !== null && raw.length > 0) {
      return raw;
    }
    const assigned = allocator.allocate(kind);
    warnings.push(`warning: assigned id ${assigned} to unnamed <${kind}>`);
    return assigned;
  }

  private applyStyle(shape: Shape, element: XmlElement): void {
    for (const name of STYLE_ATTRIBUTES) {
      const value = element.getAttribute(name);
      if (value !== null && value.length > 0) {
        shape.setAttribute(name, value);
      }
    }
  }

  private dimension(element: XmlElement, name: 'width' | 'height'): number | undefined {
    const raw = element.getAttribute(name);
    if (raw === null || raw.length === 0) {
      return undefined;
    }
    return parseNumber(raw, name);
  }

  private viewBoxDimension(element: XmlElement, index: 0 | 1): number | undefined {
    const raw = element.getAttribute('viewBox');
    if (raw === null) {
      return undefined;
    }
    const parts = raw.trim().split(/[\s,]+/);
    const value = parts[index + 2];
    return value === undefined ? undefined : parseNumber(value, 'viewBox');
  }

  private childElements(element: XmlElement): XmlElement[] {
    const result: XmlElement[] = [];
    const nodes = element.childNodes;
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes.item(index);
      if (node !== null && node.nodeType === 1) {
        result.push(node as XmlElement);
      }
    }
    return result;
  }
}
