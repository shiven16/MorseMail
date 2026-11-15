# Interactive syntax tree: implementation and usage

The syntax-tree tab now uses the real compiler's `Program` and `Statement` records in an interactive canvas. It follows Signal Studio's existing charcoal, sage, lime, amber, typography, and panel design. No frontend framework, graph dependency, service, or new language feature is required.

## Explore the tree

1. Compile source and open **Syntax tree**.
2. Click a node to select it. Its ancestor path and immediate children are highlighted; the inspector explains the node and its source range.
3. Use the small +/− branch buttons to expand/collapse an individual branch. Expand all and Collapse all act on the whole projection.
4. Zoom with the toolbar, +/− keys while the canvas is focused, or Ctrl/Cmd + wheel. Drag the background to pan. Touch pointers support drag and pinch gestures. Arrow keys pan a focused canvas; Home fits it and 0 resets it.
5. **Fit** frames the complete currently expanded tree. **Reset** restores the initial selection, expansion, automatic layout, and readable camera.
6. Choose Auto, Left → right, or Top → bottom layout. Auto uses the canvas width; mobile places the collapsible inspector below it.
7. In the inspector, navigate to the parent or a child. **Reveal in source** focuses the editor and selects exactly the corresponding source text. The inspector also highlights a source excerpt without requiring a jump back to the editor.
8. Programs with more than eight instructions have a statement-number jump control. Inspector child lists are paginated.

The initial camera prioritizes readable cards over shrinking a large program to illegible text. Bigger programs initially collapse statement fields. Fit/Expand all let you request an overview; selection/jump controls return to readable detail.

## What the nodes mean

| Visual category | Actual data | Meaning |
|---|---|---|
| Program / root | Parser `Program` dataclass | Contains statements in source order. There is no additional artificial root above it. |
| Instruction | Parser `Statement` dataclass | One SEND or DECODE instruction. |
| Command field | `Statement.operation` | A field projection showing SEND/DECODE, not a separate operator/expression node. |
| String value | `Statement.value` | A field projection preserving the raw argument contents, not an extra parser dataclass. |

The legend and inspector explicitly distinguish field projections. Node counts refer to visual nodes, including field cards. MorseScript v0.1 has no expressions, variables, identifiers, functions, declarations, or user-defined operators, so those categories are intentionally not fabricated. No execution trace is implied by a structural highlight.

Command spans are derived from the actual statement start and keyword length. Literal spans come from `argument_span`. Program ranges are explicitly described as derived from the first through last statement; leading/trailing blank lines are not AST nodes. Python scalar offsets are converted to JavaScript UTF-16 selection indices before highlighting, including supplementary Unicode characters.

## Architecture

- `web/ast.js`: pure model construction, visible-node/layout functions, camera math, source-range conversion, plus reusable node/edge/inspector renderers and an isolated mount controller.
- `web/stages.js`: owns stage lifecycle. A WeakMap disposes the old tree before replacing a stage, disconnecting observers, pending frames, and animations.
- `web/app.js`: supplies the exact source used by the compilation and handles source-editor reveal. Editing invalidates compiler records and tears down the old tree.
- `web/styles.css`: existing palette, category accents, canvas grid, subtle shadows, transitions/edge generation animation, responsive inspector, and reduced-motion behavior.
- `server.py`: explicit static allowlist includes the new AST module. Restart a running server after updating server-side files.

Model construction and layout are iterative rather than recursive. Panning reuses mounted node elements; culling limits rendering to the viewport. Dense overviews draw at most 320 representative nodes and visibly explain that zooming reveals detail. Complete source records remain in the model and can be reached through inspector navigation and statement jump. Hidden branches are never discarded from the AST. The main results panel also paginates at 12 statements so opening a large program does not first create thousands of result cards.

## Empty/error/missing states

- Empty programs retain their real zero-statement Program root, with no fabricated source range.
- Empty SEND remains a real instruction with an empty literal.
- Semantic failures retain an inspectable AST because parsing succeeded.
- Lexical/syntax failures explain why no completed AST is available.
- Missing/malformed AST data receives a graceful unavailable message.
- Rendering uses textContent; user values are never interpolated into executable HTML.

## Verification

```sh
python3 -m unittest discover -s tests -v
node --test tests/test_playback.js tests/test_stages.js tests/test_ast.js tests/test_studio.js tests/test_export.js
```

The AST-specific tests cover model fidelity, field distinctions, source ranges, layouts, camera anchors, selection, ancestor relationships, branch operations, pointer pan/cancel, touch-pinch camera math, large-tree culling/jump/navigation, input safety, cleanup, and reset. Browser checks and their limits are recorded in TEST_REPORT.md.

This feature and its tests belong to **Member 5** in the final ownership manifest. Member 4 owns the small static-allowlist change and the server regression test. Both review that integration boundary.
