# Four interactive compiler explorers

The Syntax tree experience now extends across the complete pipeline: each stage has its own visual language, a canvas with zoom/pan/fit/reset, selection feedback, an educational inspector, and navigation appropriate to its data. All records come from the real Python compiler. No second lexer, decoder, or semantic validator runs in the browser.

## Tokens — Follow the source

The canvas draws the actual token stream in connected, ordered rows. Keywords, strings, and newline/EOF boundaries have distinct treatments. Node indices preserve lexer order even when a row wraps or the stream spans multiple pages.

- Select a token for its type, value, original span, horizontal whitespace trivia, and string-content position.
- Previous/Next, a token-number jump, and 24-token pages reach every record.
- Auto step walks existing tokens, highlights source ranges, and follows selection through the canvas. It is a teaching walkthrough, not a simulated second lexical analysis.
- EOF is a real zero-width marker. Empty programs still have an EOF token.

## Syntax tree — Explore the structure

See AST_VISUALIZER.md for the Program/Statement tree, explicitly labeled field projections, branch controls, layouts, source reveal, large-tree navigation, and keyboard interaction. The larger typography is matched by resized node geometry.

## Semantic IR — Meaning, made visible

The graph projects the compiler's validated operation → word arrays → character groups. Each character card pairs the readable result with the exact Morse group. SEND normalization and DECODE lookup results come from Python.

- Choose a statement to inspect its own IR.
- Expand/collapse all words or individual word containers. Connections route above character rows so they do not imply that sibling groups are parents of one another.
- Select any operation, word, or group for its role, readable text, code, word/character indices, and source provenance.
- Walk the character groups, navigate parents/children, or jump to any global group number.
- Large data uses three words per page and 18 groups per expanded word. Inspector child lists are paginated; choosing a later group opens the necessary page/chunk. Nothing is dropped from the underlying IR.
- On smaller canvases, the hierarchy stacks vertically and the inspector moves below it.

Source spans are derived from the original argument and the validated word structure. SEND links preserve lowercase source and repeated spaces; DECODE links cover entire original dot/dash groups, including compact slash separators. Missing/misaligned provenance disables links rather than guessing a source range.

## Signal events — A message in time

This is an interactive timeline of actual MARK/GAP instructions, not an AST. Slot widths are proportional to units; marks show signal-on bars and gaps show silence. Each selected instruction has its own duration, cumulative interval, character provenance, signal state, and source link.

- Select an event, step through neighbors, jump by event number, or browse 48-event segments. Cumulative offsets remain global across segments.
- Run the **silent simulation**: the playhead, preview light, current instruction, and slider follow the real generated durations. Pause/resume, scrubbing, speed changes, completion, and reset are supported.
- The global dot-duration control updates millisecond values and pauses an active simulation without losing selection. Speed controls affect the walkthrough only.
- Silent simulation and real audio playback coordinate: starting one pauses/stops the other. Use **Play signal** for actual sound/light playback.
- Empty SEND has no marks or gaps. DECODE returns readable text and has no physical timeline.
- The 700 ms pause between separate SEND statements is runtime configuration, not part of one statement's Morse timeline.
- Simulation is bounded to 12,000 events. Every record remains inspectable beyond that limit.

Character provenance is checked against the actual output events before source links are offered. The timing prefix sums use the published event units; annotation never changes generated timing or accepts invalid source.

## Common controls and lifecycle

- Drag the background to pan; touch gestures support pan and pinch.
- Zoom controls or Ctrl/Cmd + wheel adjust the canvas. Focus the canvas for +/−, arrow-key pan, Home to fit, and 0 to reset.
- Node selection highlights direct relationships; inspector navigation/jumps move keyboard focus to the destination.
- Source reveal uses scalar-to-UTF-16 conversion, shared with the AST, to select the right editor range.
- Inspectors collapse on small screens. Main result lists remain bounded at 12 statements per page. The resizable source editor is height-bounded and its line-number gutter follows vertical scrolling.
- Switching tabs, editing/recompiling, changing statements, or leaving the page cancels the outgoing simulation/animation and disconnects observers.
- Error gates distinguish stages that completed from stages blocked by lexical, syntax, or semantic failure.

## Files and handoff

Member 5 owns studio.js, export.js, frontend integration/typography, bundled font assets/licenses, export rendering, and their tests. Member 4 owns the static asset allowlist and server tests. Member 3 reviews the IR/source-provenance boundary. Exact lists are maintained in FILE_OWNERSHIP.md and file_ownership.json.

## Tests

```sh
python3 -m unittest discover -s tests -v
node --test tests/test_playback.js tests/test_stages.js tests/test_ast.js tests/test_studio.js tests/test_export.js
```

The studio tests use a controlled animation clock to verify durations, pause/seek, completion, cleanup, limits, source annotation, statement switching, pagination, keyboard focus, and gestures. Browser verification and its limits are documented in TEST_REPORT.md. Typography and redistribution credits are in FONTS.md.
