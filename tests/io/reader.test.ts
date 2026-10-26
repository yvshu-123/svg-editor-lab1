import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { Group } from '../../src/domain/Group.js';
import { SvgReader } from '../../src/io/SvgReader.js';
import { ShapeFactory } from '../../src/shapes/ShapeFactory.js';
import { MemoryFileSystem } from '../support/memoryFs.js';

const fixturePath = fileURLToPath(new URL('../fixtures/other.svg', import.meta.url));
const otherSvg = readFileSync(fixturePath, 'utf8');

let fs: MemoryFileSystem;
let reader: SvgReader;

beforeEach(() => {
  fs = new MemoryFileSystem();
  reader = new SvgReader(fs, new ShapeFactory());
});

describe('SvgReader', () => {
  it('读 other.svg：7 个元素，缺的那个自动补 id 并警告', () => {
    fs.seed('other.svg', otherSvg);
    const result = reader.read('other.svg');

    expect(result.warnings).toEqual(['warning: assigned id rect1 to unnamed <rect>']);
    expect(result.document.count()).toBe(7);
    expect(result.document.width).toBe(400);
    expect(result.document.height).toBe(300);
    expect(result.document.children.map((shape) => shape.id)).toEqual(['rect1', 't1', 'c1', 'g1', 'e1']);
  });

  it('嵌套容器的父子关系对得上', () => {
    fs.seed('other.svg', otherSvg);
    const doc = reader.read('other.svg').document;

    expect((doc.find('g1') as Group).children.map((shape) => shape.id)).toEqual(['r2', 'c2']);
    expect(doc.find('r2').parent?.id).toBe('g1');
  });

  it('几何和样式属性都保留下来', () => {
    fs.seed('other.svg', otherSvg);
    const doc = reader.read('other.svg').document;

    expect(doc.find('rect1').describe()).toBe('x=0 y=0 w=400 h=300 fill=#ffffff');
    expect(doc.find('e1').describe()).toBe('cx=1 cy=2 rx=3 ry=4');
    expect(doc.find('t1').textContent()).toBe('imported');
  });

  it('没有 width/height 时用 viewBox 推画布', () => {
    const doc = reader.parse(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect id="r1" x="0" y="0" width="1" height="1"/></svg>',
    ).document;
    expect(doc.width).toBe(320);
    expect(doc.height).toBe(240);
  });

  it('两个都没有就回落到 800x600', () => {
    const doc = reader.parse(
      '<svg xmlns="http://www.w3.org/2000/svg"><rect id="r1" x="0" y="0" width="1" height="1"/></svg>',
    ).document;
    expect(doc.width).toBe(800);
    expect(doc.height).toBe(600);
  });

  it('不认识的标签跳过并警告', () => {
    const result = reader.parse(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path d="M0 0"/><rect id="r1" x="0" y="0" width="1" height="1"/></svg>',
    );

    expect(result.warnings).toEqual(['warning: unsupported element <path> skipped']);
    expect(result.document.count()).toBe(1);
  });

  it('XML 实体能正确还原', () => {
    const doc = reader.parse(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><text id="t1" x="0" y="0">A &amp; B</text></svg>',
    ).document;
    expect(doc.find('t1').textContent()).toBe('A & B');
  });

  it('根元素不是 svg 就报 invalid svg', () => {
    expect(() => reader.parse('<html></html>', 'a.svg')).toThrow('invalid svg: a.svg');
  });

  it('XML 语法错误也报 invalid svg', () => {
    expect(() => reader.parse('<svg><rect', 'broken.svg')).toThrow('invalid svg: broken.svg');
  });

  it('文件不存在报 cannot read file', () => {
    expect(() => reader.read('missing.svg')).toThrow('cannot read file: missing.svg');
  });
});
