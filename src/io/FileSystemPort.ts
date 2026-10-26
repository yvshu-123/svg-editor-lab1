/**
 * 文件读写端口。io 层依赖它而不是直接依赖 node:fs，
 * 测试里换成内存实现就不用碰真实磁盘。
 */
export interface FileSystemPort {
  readText(path: string): string;
  writeText(path: string, content: string): void;
}
