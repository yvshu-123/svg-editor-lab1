import { type GeometryDefinition, Shape } from './Shape.js';

export interface EllipseOptions {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  fill?: string;
}

export class Ellipse extends Shape {
  private cx: number;
  private cy: number;
  private rx: number;
  private ry: number;

  constructor(id: string, options: EllipseOptions) {
    super(id);
    this.cx = options.cx;
    this.cy = options.cy;
    this.rx = options.rx;
    this.ry = options.ry;
    if (options.fill !== undefined) {
      this.setAttribute('fill', options.fill);
    }
  }

  override get kind(): string {
    return 'ellipse';
  }

  override move(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  override clone(): Ellipse {
    const copy = new Ellipse(this.id, { cx: this.cx, cy: this.cy, rx: this.rx, ry: this.ry });
    this.copyStyleTo(copy);
    return copy;
  }

  protected override geometryDefinitions(): readonly GeometryDefinition[] {
    return [
      { name: 'cx', treeAlias: 'cx', value: () => this.cx, assign: (next) => { this.cx = next; } },
      { name: 'cy', treeAlias: 'cy', value: () => this.cy, assign: (next) => { this.cy = next; } },
      { name: 'rx', treeAlias: 'rx', value: () => this.rx, assign: (next) => { this.rx = next; } },
      { name: 'ry', treeAlias: 'ry', value: () => this.ry, assign: (next) => { this.ry = next; } },
    ];
  }
}
