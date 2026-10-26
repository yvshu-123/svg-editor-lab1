import { AppError } from '../shared/AppError.js';
import { parseNumber } from '../shared/NumberFormat.js';
import { Circle } from '../domain/Circle.js';
import { Ellipse } from '../domain/Ellipse.js';
import { Group } from '../domain/Group.js';
import { Line } from '../domain/Line.js';
import { Rect } from '../domain/Rect.js';
import type { Shape } from '../domain/Shape.js';
import { TextShape } from '../domain/TextShape.js';

export type ShapeBuilder = (id: string, params: string[]) => Shape;

export interface ShapeRegistration {
  /** 这个类型在 SVG 里的几何属性顺序，read 的时候按这个顺序取值。 */
  readonly svgAttributes: readonly string[];
  /** 只有 text 会把文本内容当成最后一个位置参数。 */
  readonly hasTextContent?: boolean;
  readonly build: ShapeBuilder;
}

const usage = (text: string): AppError => new AppError(`usage: ${text}`);
const num = (params: string[], index: number, name: string): number => parseNumber(params[index] ?? '', name);

/**
 * 按名分派点 ②（作业允许的两处之一）。
 * 类型名到构造器、属性顺序都集中在这张表里：加内核类型只改这里，
 * 命令层和读入层都不用动。以后的 box 插件也从同一个口进来。
 */
export class ShapeFactory {
  private readonly registrations = new Map<string, ShapeRegistration>();

  constructor() {
    this.registerBuiltins();
  }

  register(kind: string, registration: ShapeRegistration): void {
    this.registrations.set(kind, registration);
  }

  has(kind: string): boolean {
    return this.registrations.has(kind);
  }

  svgAttributeNames(kind: string): readonly string[] {
    return this.registration(kind).svgAttributes;
  }

  usesTextContent(kind: string): boolean {
    return this.registration(kind).hasTextContent === true;
  }

  create(kind: string, id: string, params: string[]): Shape {
    return this.registration(kind).build(id, params);
  }

  private registration(kind: string): ShapeRegistration {
    const registration = this.registrations.get(kind);
    if (registration === undefined) {
      throw new AppError(`unknown shape type: ${kind} (is the plugin loaded?)`);
    }
    return registration;
  }

  private registerBuiltins(): void {
    this.register('rect', {
      svgAttributes: ['x', 'y', 'width', 'height'],
      build: (id, params) => {
        this.expectCount(params, 4, 5, 'create rect <id> <x> <y> <w> <h> [fill]');
        return new Rect(id, {
          x: num(params, 0, 'x'),
          y: num(params, 1, 'y'),
          width: num(params, 2, 'width'),
          height: num(params, 3, 'height'),
          fill: params[4],
        });
      },
    });

    this.register('circle', {
      svgAttributes: ['cx', 'cy', 'r'],
      build: (id, params) => {
        this.expectCount(params, 3, 4, 'create circle <id> <cx> <cy> <r> [fill]');
        return new Circle(id, {
          cx: num(params, 0, 'cx'),
          cy: num(params, 1, 'cy'),
          r: num(params, 2, 'r'),
          fill: params[3],
        });
      },
    });

    this.register('ellipse', {
      svgAttributes: ['cx', 'cy', 'rx', 'ry'],
      build: (id, params) => {
        this.expectCount(params, 4, 5, 'create ellipse <id> <cx> <cy> <rx> <ry> [fill]');
        return new Ellipse(id, {
          cx: num(params, 0, 'cx'),
          cy: num(params, 1, 'cy'),
          rx: num(params, 2, 'rx'),
          ry: num(params, 3, 'ry'),
          fill: params[4],
        });
      },
    });

    this.register('line', {
      svgAttributes: ['x1', 'y1', 'x2', 'y2'],
      build: (id, params) => {
        this.expectCount(params, 4, 5, 'create line <id> <x1> <y1> <x2> <y2> [stroke]');
        return new Line(id, {
          x1: num(params, 0, 'x1'),
          y1: num(params, 1, 'y1'),
          x2: num(params, 2, 'x2'),
          y2: num(params, 3, 'y2'),
          stroke: params[4],
        });
      },
    });

    this.register('text', {
      svgAttributes: ['x', 'y'],
      hasTextContent: true,
      build: (id, params) => {
        this.expectCount(params, 3, 3, 'create text <id> <x> <y> "content"');
        return new TextShape(id, {
          x: num(params, 0, 'x'),
          y: num(params, 1, 'y'),
          content: params[2] ?? '',
        });
      },
    });

    this.register('g', {
      svgAttributes: [],
      build: (id, params) => {
        this.expectCount(params, 0, 0, 'create g <id>');
        return new Group(id);
      },
    });
  }

  private expectCount(params: string[], min: number, max: number, text: string): void {
    if (params.length < min || params.length > max) {
      throw usage(text);
    }
  }
}
