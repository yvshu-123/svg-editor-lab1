import { type GeometryDefinition, Shape } from './Shape.js';
import { formatNumber } from '../shared/NumberFormat.js';

export interface LineOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
}

export class Line extends Shape {
  private x1: number;
  private y1: number;
  private x2: number;
  private y2: number;

  constructor(id: string, options: LineOptions) {
    super(id);
    this.x1 = options.x1;
    this.y1 = options.y1;
    this.x2 = options.x2;
    this.y2 = options.y2;
    if (options.stroke !== undefined) {
      this.setAttribute('stroke', options.stroke);
    }
  }

  override get kind(): string {
    return 'line';
  }

  override move(dx: number, dy: number): void {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
  }

  override clone(): Line {
    const copy = new Line(this.id, { x1: this.x1, y1: this.y1, x2: this.x2, y2: this.y2 });
    this.copyStyleTo(copy);
    return copy;
  }

  override describe(): string {
    const from = `(${formatNumber(this.x1)},${formatNumber(this.y1)})`;
    const to = `(${formatNumber(this.x2)},${formatNumber(this.y2)})`;
    return `${from} -> ${to}${this.styleSuffix()}`;
  }

  protected override geometryDefinitions(): readonly GeometryDefinition[] {
    return [
      { name: 'x1', treeAlias: 'x1', value: () => this.x1, assign: (next) => { this.x1 = next; } },
      { name: 'y1', treeAlias: 'y1', value: () => this.y1, assign: (next) => { this.y1 = next; } },
      { name: 'x2', treeAlias: 'x2', value: () => this.x2, assign: (next) => { this.x2 = next; } },
      { name: 'y2', treeAlias: 'y2', value: () => this.y2, assign: (next) => { this.y2 = next; } },
    ];
  }
}
