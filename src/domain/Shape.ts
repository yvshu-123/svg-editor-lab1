import { AppError } from '../shared/AppError.js';
import { formatNumber, parseNumber } from '../shared/NumberFormat.js';
import type { Group } from './Group.js';

/**
 * 一个几何属性的声明：名字、树里显示的短名、怎么读写。
 * 用一张表代替 `switch (attr)`，子类加属性只要多写一行。
 */
export interface GeometryDefinition {
  readonly name: string;
  readonly treeAlias?: string;
  readonly value: () => number;
  readonly assign: (next: number) => void;
}

/**
 * 所有图形的基类。容器和叶子都继承它，命令层因此不用区分类型。
 * 样式属性（fill / stroke / stroke-width）每种图形都有，放在这里；
 * 几何属性由子类用 GeometryDefinition 声明，move / scale / set 在基类统一实现。
 */
export abstract class Shape {
  readonly id: string;
  parent: Group | null = null;

  private fillValue: string | undefined;
  private strokeValue: string | undefined;
  private strokeWidthValue: number | undefined;

  protected constructor(id: string) {
    this.id = id;
  }

  abstract get kind(): string;

  abstract clone(): Shape;

  abstract move(dx: number, dy: number): void;

  protected abstract geometryDefinitions(): readonly GeometryDefinition[];

  acceptsChildren(): boolean {
    return false;
  }

  textContent(): string | null {
    return null;
  }

  /** 等比缩放：factor 乘到全部几何属性上。先校验，再修改。 */
  scale(factor: number): void {
    if (!(factor > 0)) {
      throw new AppError('scale factor must be positive');
    }
    for (const definition of this.geometryDefinitions()) {
      definition.assign(definition.value() * factor);
    }
  }

  getAttribute(name: string): string | undefined {
    const style = this.readStyle(name);
    if (style !== undefined || this.isStyleName(name)) {
      return style;
    }
    const definition = this.geometryDefinitions().find((item) => item.name === name);
    return definition === undefined ? undefined : formatNumber(definition.value());
  }

  setAttribute(name: string, value: string): void {
    if (this.assignStyle(name, value)) {
      return;
    }
    const definition = this.geometryDefinitions().find((item) => item.name === name);
    if (definition === undefined) {
      throw new AppError(`unknown attribute: ${name}`);
    }
    definition.assign(parseNumber(value, name));
  }

  /** 序列化和 show 用的完整属性，顺序固定：几何 → fill → stroke → stroke-width。 */
  svgAttributes(): Array<[string, string]> {
    return [...this.geometryPairs(), ...this.stylePairs()];
  }

  geometryPairs(): Array<[string, string]> {
    return this.geometryDefinitions().map((definition) => [definition.name, formatNumber(definition.value())]);
  }

  stylePairs(): Array<[string, string]> {
    const pairs: Array<[string, string]> = [];
    if (this.fillValue !== undefined) {
      pairs.push(['fill', this.fillValue]);
    }
    if (this.strokeValue !== undefined) {
      pairs.push(['stroke', this.strokeValue]);
    }
    if (this.strokeWidthValue !== undefined) {
      pairs.push(['stroke-width', formatNumber(this.strokeWidthValue)]);
    }
    return pairs;
  }

  /** tree 里那一行摘要，不带前缀也不管对齐。 */
  describe(): string {
    const geometry = this.geometryDefinitions().map(
      (definition) => `${definition.treeAlias ?? definition.name}=${formatNumber(definition.value())}`,
    );
    const style = this.stylePairs().map(([name, value]) => `${name}=${value}`);
    return [...geometry, ...style].join(' ');
  }

  protected styleSuffix(): string {
    const style = this.stylePairs().map(([name, value]) => `${name}=${value}`);
    return style.length === 0 ? '' : ` ${style.join(' ')}`;
  }

  protected copyStyleTo(target: Shape): void {
    target.fillValue = this.fillValue;
    target.strokeValue = this.strokeValue;
    target.strokeWidthValue = this.strokeWidthValue;
  }

  private readStyle(name: string): string | undefined {
    if (name === 'fill') {
      return this.fillValue;
    }
    if (name === 'stroke') {
      return this.strokeValue;
    }
    if (name === 'stroke-width') {
      return this.strokeWidthValue === undefined ? undefined : formatNumber(this.strokeWidthValue);
    }
    return undefined;
  }

  private isStyleName(name: string): boolean {
    return name === 'fill' || name === 'stroke' || name === 'stroke-width';
  }

  private assignStyle(name: string, value: string): boolean {
    if (name === 'fill') {
      this.fillValue = value;
      return true;
    }
    if (name === 'stroke') {
      this.strokeValue = value;
      return true;
    }
    if (name === 'stroke-width') {
      this.strokeWidthValue = parseNumber(value, name);
      return true;
    }
    return false;
  }
}
