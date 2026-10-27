import type { Document } from '../domain/Document.js';

/** show 的渲染：头行给类型/id/父级，之后缩进给几何、文本、样式。 */
export class ShowFormatter {
  render(document: Document, id: string): string[] {
    const shape = document.find(id);
    const parent = shape.parent === null || shape.parent.id === '' ? 'svg' : `g#${shape.parent.id}`;
    const lines = [`${shape.kind}#${shape.id}  parent=${parent}`];

    const geometry = shape.geometryPairs().map(([name, value]) => `${name}=${value}`);
    if (geometry.length > 0) {
      lines.push(`  ${geometry.join(' ')}`);
    }

    const text = shape.textContent();
    if (text !== null) {
      lines.push(`  text=${JSON.stringify(text)}`);
    }

    const style = shape.stylePairs().map(([name, value]) => `${name}=${value}`);
    if (style.length > 0) {
      lines.push(`  ${style.join(' ')}`);
    }

    return lines;
  }
}
