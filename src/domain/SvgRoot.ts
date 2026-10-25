import { Group } from './Group.js';

/**
 * 文档根。本质上还是个容器，但没有 id、不参与寻址，
 * 在 tree 里显示成 `svg (w x h)`。
 */
export class SvgRoot extends Group {
  constructor() {
    super('');
  }

  override get kind(): string {
    return 'svg';
  }

  override clone(): SvgRoot {
    const copy = new SvgRoot();
    for (const child of this.children) {
      copy.append(child.clone());
    }
    return copy;
  }
}
