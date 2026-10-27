# svg-editor-lab1

Lab1 Phase 1：用 TypeScript 写的 SVG 命令行编辑器。在终端里敲命令建图，`save` 出来是标准 SVG，浏览器直接打开就能看。

架构、变化点、过程记录、一致性自查都在 [doc/README.md](doc/README.md)。

## 跑起来

```bash
npm install
npm run cli
```

```text
$ npm run cli
svg-editor 0.1 — type 'help' for commands

svg> init 400 200
canvas 400x200 created
svg> create rect start 30 70 120 60 #4a90d9
rect#start created
svg> create line edge 150 100 250 100 black
line#edge created
svg> create rect end 250 70 120 60 #f5a623
rect#end created
svg> save demo.svg
saved to demo.svg (3 elements)
```

把 `demo.svg` 拖进浏览器就能看到图。命令序列可以存成脚本，`#` 开头是注释：

```bash
npm run cli < script.txt
```

## 命令

| 类别 | 命令 |
|---|---|
| 文档 | `init [w] [h]`、`read <file.svg>`、`save [file.svg]`、`canvas [w] [h]` |
| 编辑 | `create <type> <id> … [in <容器id>]`、`delete`、`move`、`scale`、`set`、`group`、`ungroup`、`addto`、`front`、`back` |
| 显示 | `tree [id]`、`show <id>`、`help` |
| 撤销 | `undo`、`redo` |

图形类型：`rect`、`circle`、`ellipse`、`line`、`text`、`g`。所有图形（包括容器）都用唯一的 `id` 定位。

## 测试

```bash
npm test           # 188 个测试
npm run coverage   # 行覆盖 92.4%
npm run typecheck
```

`tests/acceptance` 里回放了作业给的两段会话，`tree` 的输出是逐字符比对的。

## 目录

```text
src/
├── domain/    图形树、几何、id 索引（不依赖任何业务模块）
├── command/   Command 模式：16 个命令 + 撤销栈
├── ports/     reader / writer / renderer 接口
├── io/        SVG 读写（不依赖 command）
├── cli/       分词、分发、格式化、REPL
├── shapes/    ShapeFactory（按名分派 R2）
└── shared/    AppError、NumberFormat
```

依赖是单向的：`cli → command / io / shapes / ports / domain → shared`。

## 阶段说明

本阶段只做作业要求的 6 种图形和 19 条命令。`box` 复合图形和插件加载器属于后面的插件化阶段，现在 `create box` 会报 `unknown shape type: box (is the plugin loaded?)`，`ShapeFactory` 里已经留了注册的口子。
