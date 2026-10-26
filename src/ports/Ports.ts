import type { Document } from '../domain/Document.js';

/** read 的结果：新文档 + 非致命警告（比如缺 id 自动补了）。 */
export interface ReadResult {
  document: Document;
  warnings: string[];
}

/**
 * 端口放中立模块，只依赖 domain。
 * command 和 io 各自依赖这些接口，互相之间不产生依赖。
 */
export interface SvgReaderPort {
  read(path: string): ReadResult;
}

export interface SvgWriterPort {
  write(document: Document, path: string): void;
}

/** tree 的渲染，实现放在 cli 层。 */
export type TreeRenderer = (document: Document, rootId?: string) => string[];

/** show 的渲染，实现放在 cli 层。 */
export type ShapeRenderer = (document: Document, id: string) => string[];
