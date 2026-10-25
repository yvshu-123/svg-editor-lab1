import { type GeometryDefinition, Shape } from './Shape.js';

export interface RectOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
}

export class Rect extends Shape {
  private x: number;
  private y: number;
  private width: number;
  private height: number;

  constructor(id: string, options: RectOptions) {
    super(id);
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;
    if (options.fill !== undefined) {
      this.setAttribute('fill', options.fill);
    }
  }

  override get kind(): string {
    return 'rect';
  }

  override move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  override clone(): Rect {
    const copy = new Rect(this.id, { x: this.x, y: this.y, width: this.width, height: this.height });
    this.copyStyleTo(copy);
    return copy;
  }

  protected override geometryDefinitions(): readonly GeometryDefinition[] {
    return [
      { name: 'x', treeAlias: 'x', value: () => this.x, assign: (next) => { this.x = next; } },
      { name: 'y', treeAlias: 'y', value: () => this.y, assign: (next) => { this.y = next; } },
      { name: 'width', treeAlias: 'w', value: () => this.width, assign: (next) => { this.width = next; } },
      { name: 'height', treeAlias: 'h', value: () => this.height, assign: (next) => { this.height = next; } },
    ];
  }
}
