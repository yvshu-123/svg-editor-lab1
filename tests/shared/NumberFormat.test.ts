import { describe, expect, it } from 'vitest';
import { formatNumber, parseNumber } from '../../src/shared/NumberFormat.js';

describe('formatNumber', () => {
  it('整数不带小数点', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(130)).toBe('130');
    expect(formatNumber(-45)).toBe('-45');
  });

  it('把浮点误差吃掉', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
    expect(formatNumber(1.1 * 3)).toBe('3.3');
  });

  it('最多留 6 位小数，末尾的 0 不要', () => {
    expect(formatNumber(1 / 3)).toBe('0.333333');
    expect(formatNumber(2.5)).toBe('2.5');
  });

  it('-0 输出 0', () => {
    expect(formatNumber(-0)).toBe('0');
  });

  it('大数不要写成 1e+21', () => {
    expect(formatNumber(1e21)).toBe('1000000000000000000000');
  });

  it('NaN / Infinity 算程序 bug，直接抛', () => {
    expect(() => formatNumber(Number.NaN)).toThrow();
    expect(() => formatNumber(Number.POSITIVE_INFINITY)).toThrow();
  });
});

describe('parseNumber', () => {
  it('正常数字', () => {
    expect(parseNumber('12.5', 'x')).toBe(12.5);
    expect(parseNumber('0', 'x')).toBe(0);
  });

  it('非法输入要带上是哪个参数', () => {
    expect(() => parseNumber('abc', 'x')).toThrow('invalid number for x: abc');
    expect(() => parseNumber('  ', 'width')).toThrow(/invalid number for width/);
  });
});
