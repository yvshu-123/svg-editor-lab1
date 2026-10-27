import { AddToCommand } from '../command/commands/AddToCommand.js';
import { CanvasCommand } from '../command/commands/CanvasCommand.js';
import { CreateShapeCommand } from '../command/commands/CreateShapeCommand.js';
import { DeleteShapeCommand } from '../command/commands/DeleteShapeCommand.js';
import { GroupCommand } from '../command/commands/GroupCommand.js';
import { HelpCommand } from '../command/commands/HelpCommand.js';
import { InitCommand } from '../command/commands/InitCommand.js';
import { MoveCommand } from '../command/commands/MoveCommand.js';
import { ReadCommand } from '../command/commands/ReadCommand.js';
import { ReorderCommand } from '../command/commands/ReorderCommand.js';
import { SaveCommand } from '../command/commands/SaveCommand.js';
import { ScaleCommand } from '../command/commands/ScaleCommand.js';
import { SetAttributeCommand } from '../command/commands/SetAttributeCommand.js';
import { ShowCommand } from '../command/commands/ShowCommand.js';
import { TreeCommand } from '../command/commands/TreeCommand.js';
import { UngroupCommand } from '../command/commands/UngroupCommand.js';
import type { Command } from '../command/Command.js';
import type { ShapeFactory } from '../shapes/ShapeFactory.js';
import { AppError } from '../shared/AppError.js';
import { parseNumber } from '../shared/NumberFormat.js';
import type { ShapeRenderer, SvgReaderPort, SvgWriterPort, TreeRenderer } from '../ports/Ports.js';

export interface CommandRegistryDependencies {
  factory: ShapeFactory;
  reader: SvgReaderPort;
  writer: SvgWriterPort;
  treeRenderer: TreeRenderer;
  shapeRenderer: ShapeRenderer;
  helpLines: readonly string[];
}

type Handler = (args: string[]) => Command;

const usage = (text: string): AppError => new AppError(`usage: ${text}`);

/**
 * 按名分派点 ①（作业允许的两处之一）。
 * 这里只做「命令名 → 命令对象」的翻译和参数个数校验，业务规则都在命令类里。
 */
export class CommandRegistry {
  private readonly handlers = new Map<string, Handler>();

  constructor(private readonly deps: CommandRegistryDependencies) {
    this.registerDocumentCommands();
    this.registerEditCommands();
    this.registerViewCommands();
  }

  build(tokens: string[]): Command {
    const name = tokens[0];
    if (name === undefined) {
      throw new AppError('empty command');
    }
    const handler = this.handlers.get(name);
    if (handler === undefined) {
      throw new AppError(`unknown command: ${name}`);
    }
    return handler(tokens.slice(1));
  }

  private registerDocumentCommands(): void {
    this.handlers.set('init', (args) => {
      this.expect(args, 0, 2, 'init [w] [h]');
      const width = args[0] === undefined ? 800 : this.number(args[0], 'width');
      const height = args[1] === undefined ? 600 : this.number(args[1], 'height');
      return new InitCommand(width, height);
    });

    this.handlers.set('read', (args) => {
      this.expect(args, 1, 1, 'read <file.svg>');
      return new ReadCommand(args[0]!, this.deps.reader);
    });

    this.handlers.set('save', (args) => {
      this.expect(args, 0, 1, 'save [file.svg]');
      return new SaveCommand(args[0] ?? null, this.deps.writer);
    });

    this.handlers.set('canvas', (args) => {
      if (args.length === 0) {
        return new CanvasCommand();
      }
      this.expect(args, 2, 2, 'canvas [w] [h]');
      return new CanvasCommand(this.number(args[0], 'width'), this.number(args[1], 'height'));
    });
  }

  private registerEditCommands(): void {
    this.handlers.set('create', (args) => {
      if (args.length < 2) {
        throw usage('create <type> <id> [params…] [in <containerId>]');
      }
      const type = args[0]!;
      const id = args[1]!;
      let params = args.slice(2);
      let containerId: string | undefined;
      if (params.length >= 2 && params[params.length - 2] === 'in') {
        containerId = params[params.length - 1];
        params = params.slice(0, -2);
      }
      return new CreateShapeCommand(this.deps.factory, type, id, params, containerId);
    });

    this.handlers.set('delete', (args) => {
      this.expect(args, 1, 1, 'delete <id>');
      return new DeleteShapeCommand(args[0]!);
    });

    this.handlers.set('move', (args) => {
      this.expect(args, 3, 3, 'move <id> <dx> <dy>');
      return new MoveCommand(args[0]!, this.number(args[1], 'dx'), this.number(args[2], 'dy'));
    });

    this.handlers.set('scale', (args) => {
      this.expect(args, 2, 2, 'scale <id> <factor>');
      return new ScaleCommand(args[0]!, this.number(args[1], 'factor'));
    });

    this.handlers.set('set', (args) => {
      this.expect(args, 3, 3, 'set <id> <attr> <value>');
      return new SetAttributeCommand(args[0]!, args[1]!, args[2]!);
    });

    this.handlers.set('group', (args) => {
      if (args.length < 2) {
        throw usage('group <newGid> <id1> <id2>…');
      }
      return new GroupCommand(args[0]!, args.slice(1));
    });

    this.handlers.set('ungroup', (args) => {
      this.expect(args, 1, 1, 'ungroup <gid>');
      return new UngroupCommand(args[0]!);
    });

    this.handlers.set('addto', (args) => {
      this.expect(args, 2, 2, 'addto <gid> <id>');
      return new AddToCommand(args[0]!, args[1]!);
    });

    this.handlers.set('front', (args) => {
      this.expect(args, 1, 1, 'front <id>');
      return new ReorderCommand(args[0]!, 'front');
    });

    this.handlers.set('back', (args) => {
      this.expect(args, 1, 1, 'back <id>');
      return new ReorderCommand(args[0]!, 'back');
    });
  }

  private registerViewCommands(): void {
    this.handlers.set('tree', (args) => {
      this.expect(args, 0, 1, 'tree [id]');
      return new TreeCommand(this.deps.treeRenderer, args[0]);
    });

    this.handlers.set('show', (args) => {
      this.expect(args, 1, 1, 'show <id>');
      return new ShowCommand(this.deps.shapeRenderer, args[0]!);
    });

    this.handlers.set('help', (args) => {
      this.expect(args, 0, 0, 'help');
      return new HelpCommand([...this.deps.helpLines]);
    });
  }

  private expect(args: string[], min: number, max: number, text: string): void {
    if (args.length < min || args.length > max) {
      throw usage(text);
    }
  }

  private number(token: string | undefined, label: string): number {
    return parseNumber(token ?? '', label);
  }
}
