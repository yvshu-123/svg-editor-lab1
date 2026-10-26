import type { FileSystemPort } from '../../src/io/FileSystemPort.js';

/** 内存文件系统：io 测试不碰真实磁盘。 */
export class MemoryFileSystem implements FileSystemPort {
  private readonly files = new Map<string, string>();

  seed(path: string, content: string): void {
    this.files.set(path, content);
  }

  readText(path: string): string {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`ENOENT: ${path}`);
    }
    return content;
  }

  writeText(path: string, content: string): void {
    this.files.set(path, content);
  }

  contentOf(path: string): string | undefined {
    return this.files.get(path);
  }
}
