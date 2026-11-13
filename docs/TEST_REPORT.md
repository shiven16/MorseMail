# Verification report — November 5, 2026

## Story verified

A user types MorseScript in the browser, submits it to the local compile API, receives results from the real Python compiler, inspects compiler stages, and plays generated signal instructions through the browser controller. CLI compilation and standalone HTML export use the same compiler.

## Automated evidence

- `python3 -m unittest discover -s tests -v`: **51 tests passed**.
- `node --test tests/test_playback.js tests/test_stages.js tests/test_ast.js tests/test_studio.js tests/test_export.js`: **82 tests passed** (8 playback + 18 stage/result rendering + 20 AST + 31 studio + 5 export tests).
- Both JavaScript application files and the inline scripts in the CLI-generated and UI-downloaded exports passed `node --check`.
- Python tests include all 54 dictionary entries, unique reverse mappings, and **200 deterministic randomized SEND/DECODE round trips** inside one test method.
- An independent exact timing check verifies SOS is 17 events and 27 units; E, T, EE, and E E verify gap selection.
- HTTP tests start an ephemeral real server and cover static assets, successful/failed compiler requests, malformed JSON/types, body limits, unknown routes, and cross-origin rejection.
- CLI tests cover readable output, inspection/JSON, invalid UTF-8, missing files, export creation, and preservation of an earlier export after a compile failure.
- Playback tests exercise the production JavaScript controller with a controlled fake audio clock: exact mark times, lamp transitions, Stop, replay, mute, completion, audio activation failure, multi-statement pause, pending-activation cancellation, and the event-count limit.

A duplicated U/V code in the first implementation was caught by dictionary uniqueness and round-trip checks and corrected before final verification.

The final submission ZIP was extracted into a fresh directory. Both test suites, the ownership audit, and CLI-generated HTML export passed from that extracted copy. The supplied GitHub Actions workflow has not been executed remotely.

## Manual browser verification

Tested through the Codex in-app browser, using actual UI clicks and source edits:

| Scenario | Observed result |
|---|---|
| Initial page | Editor, results placeholder, settings, and stage tabs render |
| Compile SOS | `... --- ...`, 17 events, 2.7-second duration at 100 ms/unit |
| Play | Transmitting status; browser audio activation succeeded; runtime settings lock |
| Stop during long SEND | Stopped status; lamp off; Stop disabled; settings unlock |
| Mixed demo | Five outputs in source order; normalized HELLO WORLD; SOS and S O decoded correctly |
| AST / IR / events | Real located AST records, validated word/group records, and generated signal events visible |
| Lexical failure | `send "SOS"` reports lexical error at 1:1 |
| Syntax failure | `SEND` reports missing STRING at 1:5 |
| Semantic failure after valid statement | `DECODE "..--"` on line 2 reports 2:9; no partial results; Play and Export disabled |
| Edit source while playing | Playback stops immediately; results become stale; Play/Export disable |
| Keyboard compile / natural completion | Ctrl+Enter compiles; short E transmission completes and resets controls |
| DECODE-only program | SOS displayed; Play disabled |
| Empty source | Successful empty program; no playback |
| Mute and Hide light | Checkboxes update, hidden lamp disappears, playback continues and completes |
| UI export | Browser downloaded `morse-mail-player.html`; embedded JavaScript syntax checked |
| Browser console | No error or warning entries at final inspection |
| Narrow viewport | Stacked panels, wrapped controls, stage tabs, and results render without observed clipping |

## Verification limits

The browser automation policy blocks navigating to `file://` URLs. Consequently, opening the downloaded HTML **offline in a browser was not manually verified**. Its data payload, script escaping, self-contained assets, and JavaScript syntax were checked. The same production playback engine was exercised in the live browser and controlled-clock tests.

No physical speaker capture or human listening measurement was performed. Successful AudioContext activation and transmission state verify software playback; physical audibility depends on device volume/output. Screen/audio latency and background-tab throttling were not measured. No cross-browser certification, hardware output test, load benchmark, or exhaustive test over all possible inputs is claimed.

## Repeat before submission

1. Run both automated commands above from the extracted submission folder.
2. Start `python3 -m morsemail serve` and open http://127.0.0.1:8765.
3. Load full demo, compile, inspect stages, play, and stop.
4. Check a lexical, syntax, and semantic failure.
5. Export a player, open the downloaded file manually in your browser, and confirm sound at a comfortable device volume.
6. Have a second teammate confirm the archive and upload receipt.

## Visual explorer follow-up verification

Replaced the default stage JSON dumps with token cards, a branching syntax tree, validated word/group cards with readable characters, and proportional signal timing bars. Exact records remain available through collapsed details.

Manual browser checks after the redesign verified all four views, IR statement navigation, empty-program Program root, empty SEND, DECODE quote output without events, valid upstream AST after semantic failure, and blocked downstream-stage explanations. A 12-statement token stream paginated from tokens 1–24 to 25–36. A 100-character SEND signal paginated to events 49–96 with the correct global offsets 96u–192u. Keyboard focus remains within the explorer after navigation. Source edits clear old visualization state. The narrow layout and timing-bar horizontal scrolling were visually inspected.

Automated visualization tests additionally cover lexical/syntax/semantic phase gates, lazy exact-record rendering, untrusted markup as text, 10,000 tokens, 100 words of 1,000 groups each, event offset continuity, and Unicode-safe previews. The browser console was checked again for errors. These checks cover the identified boundary cases; they do not claim mathematical proof of bug-free behavior.

## Interactive AST follow-up verification

Implemented the attached syntax-tree brief using the existing vanilla JavaScript stack and theme. The view projects real Program/Statement records, explicitly labels command/string field projections, and does not invent unsupported expression, identifier, or function nodes.

### Automated checks

Twenty AST tests cover model fidelity, immutable parser input, empty/missing/malformed data, derived spans, Unicode scalar-to-UTF-16 source ranges, expansion/collapse/reset, horizontal/vertical layout, camera anchors/fit/limits, node selection, parent/child paths, pointer pan/cancel, pinch camera math and extra-pointer handling, paginated children, statement jump, reset of the jump input, safe text rendering, lifecycle cleanup, and a synthetic 10,000-statement / 30,001-visual-node model. Dense overview rendering is capped at 320 cards. Touch behavior is tested through synthetic controller events; no physical touchscreen was used.

### Browser checks

Tested on a separate loopback server at port 8766 because port 8765 was already occupied. The existing process on 8765 was left untouched. The browser verified:

- Real SOS and mixed SEND/DECODE ASTs, selected node details, highlighted structural relationships, and source ranges.
- Expand All / Collapse All, an individual statement branch, zoom in/out, Fit, Reset, and layout switching.
- Actual pointer drag changed camera translation by the drag delta; Fit restored the frame.
- Keyboard navigation moved from a string field to its parent and then to the command field.
- Reveal selected exactly `"SOS"` (UTF-16 indices 5–10), and exactly `"😀"` (indices 5–9) after a semantic failure with valid syntax.
- A syntax failure removed the tree and displayed a blocked-stage explanation. An empty program retained its single Program root.
- Mobile viewport requested at 375×900: automatic vertical layout, responsive toolbar, inspector collapse/reopen, and no document-level horizontal overflow. Desktop viewport requested at 1440×1000: canvas and inspector displayed side by side.
- A 20-statement program jumped to statement 20, navigated to its literal with source range L20:6–L20:9, and collapsed the containing branch correctly.
- Tokens, semantic IR, signal timeline, and Play/Stop still worked after switching away from the new AST view.
- The results panel now renders at most 12 statements per page. A real 20-statement program showed 12 results on page 1, eight on page 2 starting with statement 13, while its complete AST remained available. Browser console checks returned no errors/warnings.

The UI follows reduced-motion preferences in CSS and structural animations. Physical touch input, every browser/device combination, and a universal absence of bugs are not claimed. The prior offline-file and physical-speaker verification limits still apply.

## Full studio and typography follow-up

All three remaining stages now use a shared interactive canvas/inspector controller. Tokens have a connected stream and teaching walkthrough; semantic IR has expandable operation/word/character graphs; signal events have exact unit-based timelines, silent simulation, pause/resume, scrubbing, event navigation, and character/source provenance. The earlier simple stage displays were replaced rather than left as a second disconnected implementation.

The complete type system now uses locally bundled Manrope and IBM Plex Mono, with larger UI, source, inspector, and node text. Both CLI and browser exports embed exact font bytes and font license texts. The static allowlist serves twelve resources including fonts and licenses.

### Automated coverage added

- 31 studio tests verify real token records, original spans/trivia, EOF, source provenance, repeated SEND spaces and literal slash, compact DECODE separators, missing/misaligned annotation, precise MARK/GAP intervals and source boundaries, proportional widths, global offsets, bounded large scenes, context switching, keyboard focus, branch operations, parent/child navigation, camera gestures, simulation completion/seeking/cleanup, unit refresh, audio coordination callback, explicit Fit across resizing, and the 12,000-event limit.
- 5 export tests cover exact font encoding, request failures, font-license inclusion path, safe JSON embedding, failed compile rejection, and browser base64 conversion of buffers above ordinary argument limits.
- Python regression checks now include local font MIME/magic bytes and font-complete offline exports. Existing compiler/dictionary/CLI/API tests continue to pass.
- AST node geometry was resized for the larger type and all existing AST tests still pass.

Testing caught and fixed a scrubber value being reset during pause, stale cards when switching statements, a stale empty SEND canvas when switching to DECODE, stale counters after IR collapse, keyboard focus after cross-page jumps, and a resize callback that could override an explicitly chosen Fit.

### Actual browser checks

Verified through the in-app browser on a separate local server at port 8767:

- The document reported both bundled fonts loaded. Computed UI/code font families were Morse Manrope and Morse Plex; desktop document width matched viewport width.
- Token selection revealed exactly `"SOS"`; Auto step ended at EOF with a completed walkthrough.
- IR switched between HELLO WORLD and SOS without stale values, expanded/collapsed words, and selected H with its exact source range.
- An E E timeline completed at 9/9 units with its preview light off. Word-gap details were 7 units / 700 ms at 100 ms per unit.
- The scrubber reached the end, returned to 0, and moved to 0.1 units through real keyboard interactions. Changing dot duration to 60 ms preserved the selected gap and changed its duration to 420 ms.
- Starting silent simulation stopped active audio playback. Real Play/Stop still worked afterwards. Editing/compiling a semantic failure tore down the outgoing view and disabled playback/export.
- A mobile viewport requested at 375 px showed responsive controls, a vertically arranged IR, collapsible inspectors, empty SEND, DECODE quote output, and no document-level horizontal overflow.
- A 50-line editor stayed 228 px high. A real wheel scroll moved both source and gutter to scrollTop 1300, verifying synchronization.
- Browser export downloaded successfully. A static check of that exact downloaded file confirmed both embedded fonts matched their source bytes, included SIL license text, required no font URLs, and had valid inline JavaScript.
- Final desktop previews were saved for tokens, IR, and signal events. Browser console inspection returned no warnings/errors.

The previously recorded offline-file browser restriction and physical audio/touch measurement limits remain. Touch gesture math is unit-tested; no physical touchscreen was used. The provided CI workflow has not been run remotely.

Desktop follow-up: reloaded the complete asset set, compiled 50 statements, jumped to token 149, and revealed the final quoted string on line 50. The editor selected exactly `"A"`; editor and line-number gutter both scrolled to 1300px. Further work and verification focus on desktop web, per the project owner’s request.
