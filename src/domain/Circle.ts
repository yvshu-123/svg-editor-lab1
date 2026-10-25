import { type GeometryDefinition, Shape } from './Shape.js';

export interface CircleOptions {
  cx: number;
  cy: number;
  r: number;
  fill?: string;
}

export class Circle extends Shape {
  private cx: number;
  private cy: number;
  private r: number;

  constructor(id: string, options: CircleOptions) {
    super(id);
    this.cx = options.cx;
    this.cy = options.cy;
    this.r = options.r;
    if (options.fill !== undefined) {
      this.setAttribute('fill', options.fill);
    }
  }

  override get kind(): string {
    return 'circle';
  }

  override move(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  override clone(): Circle {
    const copy = new Circle(this.id, { cx: this.cx, cy: this.cy, r: this.r });
    this.copyStyleTo(copy);
    return copy;
  }

  protected override geometryDefinitions(): readonly GeometryDefinition[] {
    return [
      { name: 'cx', treeAlias: 'cx', value: () => this.cx, assign: (next) => { this.cx = next; } },
      { name: 'cy', treeAlias: 'cy', value: () => this.cy, assign: (next) => { this.cy = next; } },
      { name: 'r', treeAlias: 'r', value: () => this.r, assign: (next) => { this.r = next; } },
    ];
  }
}
