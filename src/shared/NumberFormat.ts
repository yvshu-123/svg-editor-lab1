import { AppError } from './AppError.js';

const DECIMALS = 6;

/**
 * 统一的数字输出格式。
 * SVG 属性和 transcript 都只接受 `130` 这种写法，
 * 不能出现 `130.0`、`0.30000000000000004`、`1e+21`。
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new AppError(`not a finite number: ${String(value)}`);
  }

  const rounded = Math.round(value * 10 ** DECIMALS) / 10 ** DECIMALS;
  if (Object.is(rounded, -0)) {
    return '0';
  }

  const text = String(rounded);
  return /e/i.test(text) ? expandExponential(text) : text;
}

/** 把 `1e+21` 这类写法展开成普通十进制。 */
function expandExponential(text: string): string {
  const [mantissa = '', exponentText = '0'] = text.split(/e/i);
  const negative = mantissa.startsWith('-');
  const body = negative ? mantissa.slice(1) : mantissa;

  const dot = body.indexOf('.');
  const digits = body.replace('.', '');
  const point = (dot === -1 ? body.length : dot) + Number(exponentText);

  let integer: string;
  let fraction: string;
  if (point <= 0) {
    integer = '0';
    fraction = '0'.repeat(-point) + digits;
  } else if (point >= digits.length) {
    integer = digits + '0'.repeat(point - digits.length);
    fraction = '';
  } else {
    integer = digits.slice(0, point);
    fraction = digits.slice(point);
  }

  fraction = fraction.replace(/0+$/, '');
  const value = fraction.length > 0 ? `${integer}.${fraction}` : integer;
  return negative ? `-${value}` : value;
}

/**
 * 解析用户敲的数字。失败时把参数名也带上，
 * 让人知道是 `dx` 还是 `width` 错了。
 */
export function parseNumber(text: string, label: string): number {
  const value = Number(text);
  if (text.trim().length === 0 || !Number.isFinite(value)) {
    throw new AppError(`invalid number for ${label}: ${text}`);
  }
  return value;
}
