import { readFileSync, writeFileSync } from 'node:fs';
import type { FileSystemPort } from './FileSystemPort.js';

/** 生产实现。出错交给上层包装成 cannot read/write file。 */
export class NodeFileSystem implements FileSystemPort {
  readText(path: string): string {
    return readFileSync(path, 'utf8');
  }

  writeText(path: string, content: string): void {
    writeFileSync(path, content, 'utf8');
  }
}
