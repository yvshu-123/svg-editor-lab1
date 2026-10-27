import { describe, expect, it } from 'vitest';
import { LineTokenizer } from '../../src/cli/LineTokenizer.js';

const tokenizer = new LineTokenizer();

describe('LineTokenizer', () => {
  it('按空白切分', () => {
    expect(tokenizer.tokenize('create rect r1 0 0 10 10')).toEqual(['create', 'rect', 'r1', '0', '0', '10', '10']);
  });

  it('双引号里保留空格', () => {
    expect(tokenizer.tokenize('create text t1 20 40 "My Diagram"')).toEqual([
      'create',
      'text',
      't1',
      '20',
      '40',
      'My Diagram',
    ]);
  });

  it('引号可以转义', () => {
    expect(tokenizer.tokenize('set t1 text "a \\"b\\" c"')).toEqual(['set', 't1', 'text', 'a "b" c']);
  });

  it('连续空白和制表符只算一个分隔', () => {
    expect(tokenizer.tokenize('  move   c1\t0   30 ')).toEqual(['move', 'c1', '0', '30']);
  });

  it('# 开头的整行是注释', () => {
    expect(tokenizer.tokenize('# 注释')).toBeNull();
    expect(tokenizer.tokenize('   # 缩进也算')).toBeNull();
  });

  it('行内的 # 是普通字符，颜色值要用', () => {
    expect(tokenizer.tokenize('create rect r1 0 0 10 10 #ffffff')).toEqual([
      'create',
      'rect',
      'r1',
      '0',
      '0',
      '10',
      '10',
      '#ffffff',
    ]);
  });

  it('空行返回 null', () => {
    expect(tokenizer.tokenize('')).toBeNull();
    expect(tokenizer.tokenize('   ')).toBeNull();
  });

  it('引号没闭合要报错', () => {
    expect(() => tokenizer.tokenize('create text t1 0 0 "abc')).toThrow('unterminated quoted string');
  });

  it('引号紧贴别的字符也能用', () => {
    expect(tokenizer.tokenize('set t1 text "a"b')).toEqual(['set', 't1', 'text', 'ab']);
  });
});
