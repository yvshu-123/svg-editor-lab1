import { CommandRegistry } from './cli/CommandRegistry.js';
import { HELP_LINES } from './cli/HelpText.js';
import { LineTokenizer } from './cli/LineTokenizer.js';
import { Repl } from './cli/Repl.js';
import { ShowFormatter } from './cli/ShowFormatter.js';
import { TreeFormatter } from './cli/TreeFormatter.js';
import { CommandHistory } from './command/CommandHistory.js';
import { Document } from './domain/Document.js';
import { NodeFileSystem } from './io/NodeFileSystem.js';
import { SvgReader } from './io/SvgReader.js';
import { SvgWriter } from './io/SvgWriter.js';
import { ShapeFactory } from './shapes/ShapeFactory.js';

/**
 * 组装根：唯一允许 new 出各层实现、并把它们接起来的地方。
 * 依赖方向到这里收敛（cli → command / io / shapes / ports / domain）。
 */
const fileSystem = new NodeFileSystem();
const shapeFactory = new ShapeFactory();
const treeFormatter = new TreeFormatter();
const showFormatter = new ShowFormatter();

const registry = new CommandRegistry({
  factory: shapeFactory,
  reader: new SvgReader(fileSystem, shapeFactory),
  writer: new SvgWriter(fileSystem),
  treeRenderer: (document, rootId) => treeFormatter.render(document, rootId),
  shapeRenderer: (document, id) => showFormatter.render(document, id),
  helpLines: HELP_LINES,
});

const repl = new Repl({
  document: new Document(),
  history: new CommandHistory(),
  registry,
  tokenizer: new LineTokenizer(),
});

repl.start();
