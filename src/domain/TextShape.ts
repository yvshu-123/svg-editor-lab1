import { type GeometryDefinition, Shape } from './Shape.js';
import { formatNumber } from '../shared/NumberFormat.js';

export interface TextShapeOptions {
  x: number;
  y: number;
  content: string;
  fill?: string;
}

export class TextShape extends Shape {
  private x: number;
  private y: number;
  private content: string;

  constructor(id: string, options: TextShapeOptions) {
    super(id);
    this.x = options.x;
    this.y = options.y;
    this.content = options.content;
    if (options.fill !== undefined) {
      this.setAttribute('fill', options.fill);
    }
  }

  override get kind(): string {
    return 'text';
  }

  override move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  override clone(): TextShape {
    const copy = new TextShape(this.id, { x: this.x, y: this.y, content: this.content });
    this.copyStyleTo(copy);
    return copy;
  }

  override textContent(): string | null {
    return this.content;
  }

  override getAttribute(name: string): string | undefined {
    return name === 'text' ? this.content : super.getAttribute(name);
  }

  override setAttribute(name: string, value: string): void {
    if (name === 'text') {
      this.content = value;
      return;
    }
    super.setAttribute(name, value);
  }

  override describe(): string {
    return `(${formatNumber(this.x)},${formatNumber(this.y)}) ${JSON.stringify(this.content)}${this.styleSuffix()}`;
  }

  protected override geometryDefinitions(): readonly GeometryDefinition[] {
    return [
      { name: 'x', treeAlias: 'x', value: () => this.x, assign: (next) => { this.x = next; } },
      { name: 'y', treeAlias: 'y', value: () => this.y, assign: (next) => { this.y = next; } },
    ];
  }
}
