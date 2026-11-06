# Implementation architecture

## Data flow

```text
Browser editor ──POST /api/compile──┐
                                  ↓
CLI source file ───────────→ compile_source
                                  ↓
                 lex → parse → analyze → generate
                    tokens   AST     IR       outputs
                                  ↓
                    CompilationResult dataclasses
                                  ↓
                  JSON UI / terminal / offline HTML
                                  ↓
                    Web Audio + visible signal light
```

`contracts.py` defines shared Position, Span, Token, Statement, Program, OperationIR, SignalEvent, Output, Diagnostic, and CompilationResult records. `dataclasses.asdict` serializes the same records for CLI inspection, browser inspection, and export. Nothing in the compiler depends on the browser.

## Phase responsibilities

- `lexer.lex`: scans characters, outside whitespace trivia, strings, newline variants, and source spans. Keyword recognition is case-sensitive. Printable unsupported Unicode reaches semantics; controls and forbidden whitespace are lexical errors. EOF is explicit.
- `parser.parse`: enforces keyword + horizontal gap + STRING and newline boundaries. It preserves original argument values. It does not interpret Morse.
- `semantic.analyze`: maps the authoritative repertoire, uppercases ASCII SEND text, validates edge spaces and groups, and preserves word structure. DECODE scans separators with offsets instead of losing positions through a simple split.
- `codegen.generate/lower`: renders canonical notation and lowers SEND groups to MARK/GAP units. DECODE displays text without playback. A word gap replaces a character gap.
- `compiler.compile_source`: completes phases in order. A CompilationError becomes one diagnostic; all executable outputs are suppressed. Unexpected programming exceptions remain visible to developers.

All 54 Morse mappings are specified in `morse.py`; the reverse map is derived. The language extensions are distinct from standard punctuation in the specification. The quote mapping is DECODE-only because source strings have no escaping.

## Frontend and server

The standard-library threaded server serves an explicit allowlist of twelve static resources, including local fonts and their licenses and the compile endpoint. It binds to 127.0.0.1. Requests accept JSON with a string `source`, bounded to 65,536 bytes, and reject a mismatching browser Origin. No source is evaluated as Python and no submitted filesystem path is accepted. Results and errors render through `textContent`.

`app.js` owns the editor lifecycle, samples, compiler requests, stage inspection, and download export. Large result sets render 12 statements at a time through the shared stage renderer. A monotonically increasing request identifier prevents an earlier response overwriting newer source. Editing stops sound and invalidates prior output. Empty programs and empty SEND are valid; empty DECODE is an error.

`player.js` is independent of the compiler. It schedules oscillator marks on one AudioContext clock. The visible lamp derives its state from the same timeline. Short gain ramps avoid clicks. Stop cancels oscillator nodes and animation callbacks; a generation identifier prevents stale asynchronous activation from restarting playback. Mute controls the shared gain. Runtime duration/frequency controls lock during playback.

The Python export renderer and browser export both embed the actual playback controller; neither reimplements Morse validation. Literal less-than characters are escaped when JSON is inserted into HTML so a message cannot close a data script. A separate 700 ms pause separates nonempty SEND operations.

## Complexity and practical limits

The lexer, parser, semantic scan, and lowering are linear in source size plus generated events, using linear storage. Reverse dictionary lookups are constant-time on average. Inspection JSON can be larger than the original source. UI request and playback event limits prevent unbounded browser scheduling. The Python API/CLI are intentionally reusable outside the server.

See TEST_REPORT.md for verified boundaries and limitations. File ownership is described separately in FILE_OWNERSHIP.md.

## Visual compiler explorer

`web/stages.js` renders compiler records as located token cards, a Program/statement tree, validated word/group containers paired with readable characters, and proportional unit-based MARK/GAP timelines. It does not duplicate semantic validation. Earlier phases remain visible after downstream failures; blocked stages explain why execution stopped. Empty programs, empty SEND, and DECODE-only outputs have distinct explanations. Large collections use bounded pagination, including nested word/group and event pages. Inspectors explain the exact selected records; the CLI --inspect option retains the complete JSON representation. Source is rendered with textContent, and pagination retains keyboard focus. The visualization and its tests belong to Member 5.

## Interactive AST explorer

The Syntax tree tab mounts the modular controller in `web/ast.js`. Its pure model projects the real Program/Statement dataclasses and explicitly labeled operation/value fields. Canvas culling and a bounded overview limit DOM work. SVG paths highlight selected relationships, native buttons expose node controls, an inspector explains actual data and positions, and scalar offsets convert safely into UTF-16 editor selections. Two layouts adapt to canvas width; drag/pinch, keyboard, and zoom/fit/reset controls support navigation. Stage replacement disposes observers, pending frames, and structural animations. See AST_VISUALIZER.md for feature details and supported language boundaries.

## Complete stage studios and typography

`web/studio.js` adds a shared canvas/inspector controller with distinct token, IR, and signal adapters. It projects published compiler records, annotates source provenance, validates annotation alignment against existing signal events, and uses bounded scene segments. Controlled walkthroughs visit existing records; the signal simulator uses generated duration units, prefix sums, and a scrubber. Lifecycle teardown cancels both rendering and simulation frames. `stages.js` dispatches controllers and exposes pause/timing refresh hooks used by the main audio controls.

Manrope and IBM Plex Mono are bundled and served locally. Shared CSS families and type scale cover the app, all inspectors, node cards, the editor, and exports. `web/export.js` and `player.py` inline font data and license text into offline players. See STAGE_EXPLORERS.md and FONTS.md.
