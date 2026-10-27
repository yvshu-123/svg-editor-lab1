import { AppError } from '../shared/AppError.js';

/**
 * 命令行分词：空白分隔、双引号保留空格、`#` 开头的整行是注释。
 * `#` 只在行首算注释，否则 `#ffffff` 这种颜色没法用。
 */
export class LineTokenizer {
  tokenize(line: string): string[] | null {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      return null;
    }

    const tokens: string[] = [];
    let current = '';
    let started = false;
    let quoting = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index]!;

      if (quoting) {
        if (char === '\\' && index + 1 < line.length) {
          const next = line[index + 1]!;
          if (next === '"' || next === '\\') {
            current += next;
            index += 1;
            continue;
          }
          current += char;
          continue;
        }
        if (char === '"') {
          quoting = false;
          continue;
        }
        current += char;
        continue;
      }

      if (char === '"') {
        quoting = true;
        started = true;
        continue;
      }

      if (/\s/.test(char)) {
        if (started || current.length > 0) {
          tokens.push(current);
          current = '';
          started = false;
        }
        continue;
      }

      current += char;
    }

    if (quoting) {
      throw new AppError('unterminated quoted string');
    }
    if (started || current.length > 0) {
      tokens.push(current);
    }
    return tokens;
  }
}
