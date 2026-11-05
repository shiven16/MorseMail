# Morse Mail: implementation and five-person team guide

> **Implementation complete:** this is historical planning material. Use [FILE_OWNERSHIP.md](FILE_OWNERSHIP.md), [TEST_REPORT.md](TEST_REPORT.md), and the root README for the current implementation and five-person handoff.

> **Team allocation update:** follow [TEAM_EXECUTION_BLUEPRINT.md](TEAM_EXECUTION_BLUEPRINT.md) for the active assignments and contracts. It replaces the dedicated-integrator allocation with shared boundary ownership and independent fixture-driven development.

> **Deadline update:** submission is November 6, 2026. Follow [the one-day submission plan](ONE_DAY_PLAN.md) for scope, assignments, and sequencing. Its deadline-specific decisions supersede the four-week schedule and optional features below. Use this document as architecture reference.

## 1. Repository assessment

At the time of this review, the repository contains one project file: `docs/LANGUAGE_SPECIFICATION.md`. The current commit is `ad29ef9` (`added language_specification doc`). There is no compiler implementation, interface, dependency configuration, test suite, or hardware integration yet.

The specification is unusually complete for a starting point: it defines tokens, grammar, source locations, Morse mappings, semantic rules, an intermediate representation (IR), timing, and conformance examples. Use it as the language contract, after resolving the inconsistencies in section 3 of this guide. This guide proposes an implementation; it does not silently amend that contract.

## 2. What the project should demonstrate

Build a small compiler called **Morse Mail**, whose source language is **MorseScript**. It should accept a source file or editor input, expose the compiler stages, report useful errors, and turn valid messages into readable results, blinking light, and beeps.

```text
SEND "SOS HELP"
DECODE "... --- ..."
```

Expected results:

```text
... --- ... / .... . .-.. .--.
SOS
```

The informal idea `send SOS HELP` is not valid under the existing specification. Version 0.1 uses uppercase commands and quoted arguments. Explain this in the UI and report.

The compiler pipeline is the academic core:

```text
Source → lexer → tokens → parser → AST → semantic analysis → IR
                                                        ↓
                                      text and signal code generation
                                                        ↓
                                          browser light/audio runtime
```

Do not implement only a text-to-Morse dictionary lookup and label it a compiler. Make the stages separate, inspectable, and testable. The target output can be text and signal instructions; generating machine code is unnecessary for this project.

### Required deliverables

- A compiler implementing SEND and DECODE, including multiple statements.
- Explicit lexer, parser, semantic analyzer, IR, and code generation modules.
- Diagnostics with phase, message, and 1-based line/column.
- A CLI that compiles `.ms` files and supports inspection of intermediate stages.
- A small browser interface with editor, results, diagnostics, stage inspection, and synchronized light/audio playback for SEND.
- Automated conformance and integration tests.
- README, architecture explanation, team contribution record, sample programs, and a reliable demonstration.

### Keep outside the first release

Email delivery, accounts, network messaging, live microphone decoding, image recognition, variables, loops, functions, comments, escape sequences, physical Arduino/LED wiring, and advanced optimization. “Mail” means a message encoded as Morse in this project; actual email infrastructure is unnecessary.

A physical LED can be an extension after software playback works. DECODE consumes written Morse, not recorded audio.

## 3. Resolve these specification inconsistencies first

Create a small specification-fix PR before coding the affected behavior. All five teammates should review the final examples. The recommendations below are proposed decisions, not existing guarantees.

| Issue in current specification | Why it matters | Recommended resolution |
|---|---|---|
| Section 3.2 permits only printable ASCII inside strings, but sections 7, 11, and 12 expect `SEND "é"` and `SEND "CAFÉ"` to pass lexing and fail semantically. | Changes phase ownership and lexer behavior. | Allow non-control Unicode scalar values in strings at the lexical layer; reject characters outside the operation's repertoire semantically. Continue rejecting tabs, physical newlines, and control characters lexically. Amend the character rule explicitly. |
| Section 3.1 requires a separator after keywords, while `SEND"A"` is expected to produce a parser whitespace error. | A strict lexer would fail before the parser. | Recognize a complete keyword before a quote as well as before whitespace/newline/EOF. Preserve trivia so the parser rejects the missing gap at column 5. Keep `SENDX` an unknown command. |
| `DECODE 123` is expected to produce a syntax error, but there is no token type for `123`, and unexpected source lexemes are lexical errors. | The parser cannot report on a token that never exists. | Keep the minimal token set and classify this case as lexical at column 8. Alternatively add an explicit unexpected-lexeme token, but document that larger change. |
| Section 6 says `.- -.-.-` means A followed by a period. | `-.-.-` is not the period mapping. | Replace with `.- .-.-.-`, which decodes to `A.`. |
| Section 12.3 expects `DECODE "..."` to produce `E`. | `...` is S; `.` is E. | Change the expected output to `S`. |
| Section 12.7 encodes `!&;=_$@` with only six groups. | Seven input characters require seven groups. | Use `-.-.-- .-... -.-.-. -...- ..--.- ...-..- .--.-.`; the equals sign was omitted. |
| Section 11 locates the second command in `SEND "A" DECODE ".-"` at column 11, while section 12.5 uses 10. | Exact diagnostic tests would disagree. | Use column 10, the D of DECODE. |
| Leading-slash diagnostics point to the opening quote (`1:8`), despite the rule that separator errors point at the separator. | Affects spans and editor highlighting. | Point `DECODE "/ ..."` at column 9, the slash. Reserve the quote position for an empty argument with no offending content character. |
| In `DECODE "... / / ---"`, the specified location is column 13, although the second slash is column 15. | A scanner needs a consistent policy for malformed boundaries. | Report the second slash at column 15: it is encountered while a group is required. Explicitly document this choice. |

Also define these implementation policies in the same PR:

- **Error precedence:** lex the complete file, then parse it, then analyze it. Stop at the first error in the earliest failing phase; within that phase use source order. A lexical error later in the file therefore takes precedence over an earlier semantic error.
- **No partial execution:** compile and validate the entire program before exposing executable output. Any compilation error prevents all playback, even if earlier statements are valid.
- **Empty DECODE location:** report the opening quote for empty/all-space DECODE input.
- **Normalized SEND input:** uppercase ASCII letters and collapse internal runs of spaces in the IR; retain the original source separately for diagnostics.
- **Playback policy:** SEND statements play in source order. DECODE displays readable output and does not play by default. Insert a configurable runtime pause between separate SEND statements; do not mistake it for a language word gap.
- **Signal boundaries:** generate no leading or trailing GAP instructions. `SEND ""` produces an empty word list, empty notation, and no signal events.

Do not turn contradictory examples directly into tests. Resolve the rules first and make the corrected specification the single source of truth.

## 4. Recommended implementation stack

Use **Python for the compiler and CLI**, **pytest for tests**, and a small **HTML/CSS/JavaScript browser interface** for light and audio playback. Python dataclasses suit tokens, AST nodes, and IR records; a recursive-descent parser is sufficient for this grammar. No parser generator or frontend framework is required.

Serve the UI and a thin compile endpoint from one local Python process using the standard-library HTTP server. Bind to `127.0.0.1`, serve only the intended static directory, and accept source text through the compile API. The endpoint must not execute submitted source as Python or accept arbitrary filesystem paths.

Use browser Web Audio for tones and a visible element for the light. Keep every Morse rule in Python; JavaScript receives validated results and signal events. This keeps the compiler reusable and avoids two conflicting implementations of the language.

If the course mandates C/C++, Java, Flex/Bison, or a particular parser technique, translate the same module contracts into that stack before implementation. Confirm course constraints at kickoff. This guide assumes there is no such requirement.

## 5. Five-person responsibility split

Replace Member 1–5 with names at kickoff. Each member owns implementation, tests, documentation, and a demonstration of their part. Ownership means accountability, not exclusive permission to edit files.

| Member | Primary responsibility | Owned modules / artifacts | Completion evidence | Reviewer |
|---|---|---|---|---|
| **1 — source and lexer** | Source scanning, tokens, positions, lexical diagnostics | `source.py`, `tokens.py`, `lexer.py`, lexer tests | Correct tokens/trivia/spans for LF, CRLF, CR, tabs, quotes, blank input, and malformed source | Member 2 |
| **2 — parser and AST** | Grammar, required whitespace, statement boundaries | `ast_nodes.py`, `parser.py`, parser tests, grammar explanation | Correct AST for valid programs; syntax errors for missing strings and extra tokens | Member 3 |
| **3 — semantics and dictionaries** | Exact repertoire, encoding/decoding validation, IR construction | `morse.py`, `semantic.py`, `ir.py`, semantic and dictionary tests | Validated SEND/DECODE IR; exhaustive mapping checks; precise content diagnostics | Member 4 |
| **4 — code generation and playback** | Text output, timed signal generation, browser audio/light controller | `codegen.py`, `signals.py`, `web/player.js`, timing tests | Exact 1/3/7-unit events; synchronized play, pause, resume, stop, and replay | Member 5 |
| **5 — integration, CLI, and interface** | Package setup, compiler orchestration, local server, editor UI, end-to-end verification | `compiler.py`, `cli.py`, `server.py`, `web/index.html`, `web/app.js`, `web/styles.css`, integration tests | One-command startup; file compilation; diagnostics and stage inspection; working complete demo | Member 1 |

Member 5 coordinates integration but must not become responsible for fixing everyone's modules. Member 4 owns playback-related UI controls; Member 5 owns the editor and results layout. Members 1–3 each contribute examples and report sections for their phase. All five help run the final integration and manual checks.

Workload balancing: once contracts stabilize, Member 1 takes ownership of source-location regression fixtures; Member 2 maintains the corrected conformance fixture set; Member 3 adds round-trip property checks; Member 4 records timing traces; Member 5 maintains startup and CLI integration checks. These are part of each role, not a separate testing person's responsibility.

## 6. Proposed repository layout

```text
MorseMail/
├── README.md
├── pyproject.toml
├── src/morsemail/
│   ├── __init__.py
│   ├── source.py
│   ├── diagnostics.py
│   ├── tokens.py
│   ├── lexer.py
│   ├── ast_nodes.py
│   ├── parser.py
│   ├── morse.py
│   ├── semantic.py
│   ├── ir.py
│   ├── codegen.py
│   ├── signals.py
│   ├── compiler.py
│   ├── cli.py
│   ├── server.py
│   └── web/
│       ├── index.html
│       ├── app.js
│       ├── player.js
│       └── styles.css
├── examples/
│   ├── sos.ms
│   ├── hello_world.ms
│   ├── mixed.ms
│   └── invalid/
├── tests/
│   ├── fixtures/conformance.json
│   ├── test_lexer.py
│   ├── test_parser.py
│   ├── test_semantic.py
│   ├── test_codegen.py
│   ├── test_signals.py
│   └── test_integration.py
└── docs/
    ├── LANGUAGE_SPECIFICATION.md
    ├── PROJECT_GUIDE.md
    ├── ARCHITECTURE.md
    └── DEMO.md
```

The structure above is proposed; these files do not exist yet. Include web assets in package configuration so installation does not break the server.

## 7. Shared contracts: agree before parallel implementation

Write the shared dataclasses and signatures together during the first integration session. Avoid independently inventing incompatible dictionaries. Member 1 initially owns source spans and diagnostics; changes to shared contracts require affected teammates' review.

### Source and token contract

```text
Position(offset, line, column)
Span(start, end)                         # end-exclusive
Diagnostic(phase, code, message, span)
Token(kind, value, span, leading_hws, content_start?)
```

Offsets are Python string indices, not UTF-8 byte offsets. Lines/columns are 1-based; tabs advance to the next 8-column stop. `leading_hws` counts actual adjacent outside-string spaces/tabs, independently of their display width. STRING tokens preserve the raw body and its starting position. The full token span includes quotes. CRLF is one newline token spanning both source characters.

Do not compute a content diagnostic by adding a byte count to a column. Provide a shared position helper, and test tabs preceding a command and Unicode characters inside strings under the corrected rule.

### AST contract

```text
Program(statements)
SendStatement(argument, span, argument_span, content_start)
DecodeStatement(argument, span, argument_span, content_start)
```

AST arguments retain original text; semantic normalization does not rewrite source. The parser checks grammar only.

### IR and output contract

```text
EncodeIR(operation="ENCODE", input, words, source_span)
DecodeIR(operation="DECODE", input, words, text, source_span)
# words: list[list[str]], where each str is one validated Morse group

SignalEvent(kind="MARK" | "GAP", units: positive integer)
StatementOutput(operation, text, notation, events, source_span)
CompilationResult(ok, diagnostics, tokens?, ast?, ir?, outputs)
```

For ENCODE, `text` is normalized readable input; `notation` is the encoded result. For DECODE, `text` is the decoded result and `notation` is canonical notation rebuilt from validated words. Only SEND has playback events by default. Preserve statement ordering.

These are proposed implementation records. The existing spec illustrates notation inside SEND IR; either retain that field for conformance or explicitly document the chosen separation of validated IR from generated notation. Do not let different modules assume different shapes.

### Public functions

```python
lex(source: str) -> list[Token]
parse(tokens: list[Token]) -> Program
analyze(program: Program) -> list[OperationIR]
generate(ir: list[OperationIR]) -> list[StatementOutput]
build_signals(words: list[list[str]]) -> list[SignalEvent]
compile_source(source: str, *, inspect: bool = False) -> CompilationResult
```

Phase functions can raise one shared `CompilationError` containing a Diagnostic. The orchestrator catches expected compilation errors and returns `ok=False`; unexpected programming errors must remain visible in development. Do not return success after silently swallowing exceptions.

### CLI and local API

Proposed command contract:

```text
morsemail compile examples/sos.ms
morsemail compile examples/mixed.ms --json
morsemail compile examples/sos.ms --inspect
morsemail serve
```

Normal compile output prints one result per statement; JSON preserves empty SEND output and statement boundaries unambiguously. Diagnostics go to stderr. Exit status: 0 success, 1 compilation failure, 2 invocation/file-read failure. The CLI must not play sound automatically.

`POST /api/compile` accepts `{ "source": "SEND \"SOS\"", "inspect": true }` and returns the same serialized CompilationResult used by the CLI. Valid requests with invalid MorseScript return a normal compiler result with `ok=false`; malformed JSON gets an HTTP client error. Set a small documented source-size limit and request-body limit. No compile-time side effects.

## 8. How each compiler phase works

### Lexer

Scan source once. Skip horizontal whitespace while retaining trivia; emit newline tokens; recognize complete command words; scan quoted strings without escapes; emit exactly one EOF. Keep source spans throughout. Strings can contain punctuation that later fails semantic analysis, so do not use the Morse dictionary here.

Use a simple state machine: outside string / inside string. A physical newline or EOF inside a string reports an unterminated string at its opening quote. Do not implement comments: `#` outside strings is invalid source.

### Parser

Consume optional blank lines, then repeatedly parse `keyword HWS STRING`, followed by newline or EOF. Require a positive `leading_hws` count on the argument. Reject extra strings or commands on that line. Build an ordered Program AST, including the empty program.

This grammar needs no precedence table, expression parser, or backtracking. A small recursive-descent implementation is enough.

### Semantic analyzer

Keep one authoritative forward dictionary and derive the reverse dictionary from it. Check that codes are unique. Include all 26 letters, 10 digits, and 18 punctuation entries: 54 mappings total. The quote entry supports DECODE even though SEND cannot express it in a v0.1 string.

For SEND, validate each character, uppercase only ASCII a–z, reject leading/trailing spaces, collapse internal runs into word boundaries, and build groups. Empty SEND yields zero words.

For DECODE, scan the body while retaining each group's source offset. Only dots, dashes, ASCII spaces, and slash are legal. Ignore outer ASCII spaces, collapse group-separating spaces, and treat slash as a word delimiter even without adjacent spaces. Require a group on each side of every slash, look up each complete group, and reject empty/all-space input. Avoid a single `split()` that loses separator positions or accepts malformed slashes.

The dictionary is the semantic authority: a dot-dash sequence is not valid merely because it has a plausible length.

### Code generator and signal lowering

Render canonical notation by joining groups with ` ` and words with ` / `. Decode output joins decoded characters within each word and words with one space.

For each SEND character group:

1. Emit MARK(1) for a dot or MARK(3) for a dash.
2. Emit GAP(1) only between marks of that character.
3. Emit GAP(3) only between characters in the same word.
4. Emit GAP(7) only between words.

A word boundary replaces the character boundary; never add 3 + 7 units or append an extra intra-character gap. Do not transmit the written `/` separator as a mark.

Useful exact checks:

| Input | Expected signal events / duration |
|---|---|
| `SEND "E"` | MARK(1); total 1u |
| `SEND "T"` | MARK(3); total 3u |
| `SEND "EE"` | MARK(1), GAP(3), MARK(1); total 5u |
| `SEND "E E"` | MARK(1), GAP(7), MARK(1); total 9u |
| `SEND "SOS"` | 9 marks, 6 intra-character gaps, 2 character gaps; total 27u |
| `SEND ""` | No events; total 0u |

## 9. Browser experience and playback

Keep the interface small: source editor, sample selector, Compile button, result list, diagnostic area, and expandable Tokens / AST / IR / Signals views. Display the distinction between language source, written Morse, and physical playback. Examples must use valid quoted uppercase syntax.

Playback controls: Play, Pause/Resume, Stop, unit-duration control, tone-frequency control, mute, and a clearly visible light. A reasonable initial demo configuration is 100 ms per unit and a 600 Hz tone; these are runtime defaults, not language semantics.

Compile first, then play only a successful result after an explicit user gesture. Browsers require user interaction to start/resume audio. A failed compilation must disable playback of the current source; label an earlier successful result clearly if retained.

Use one event timeline for both light and sound. Schedule audio against the Web Audio clock and render the light against the same playback position; do not run independent chained timers that drift apart. Physical display refresh and audio latency mean visual synchronization is approximate, but both outputs must derive from identical event boundaries.

Maintain an explicit playback state: idle, playing, paused, complete. Stop cancels pending audio, turns the light off, clears timers, and resets position. Pause stores elapsed playback time and silences output; resume reconstructs the remaining timeline, including a partially consumed event. Replay starts a fresh timeline. Lock timing controls during active playback or apply changes only on the next play. Test stopping and pausing during both marks and gaps.

Use text labels alongside light state and keyboard-accessible buttons. Provide audio-only playback and a way to hide the flashing indicator. Render source and diagnostic text as text, never as unsanitized HTML.

## 10. Suggested four-week schedule

This is a relative schedule because no submission date has been supplied. For a two-week deadline, preserve the sequence and cut stage-view polish, pause/resume, and hardware extensions before cutting compiler validation or basic light/audio playback.

| Period | Work for all five | Exit gate |
|---|---|---|
| **Week 1, days 1–2** | Resolve section 3; confirm course requirements; name owners; define shared records, fixtures, and CLI/API contract; set up packaging and tests | Corrected specification and shared contracts merged |
| **Week 1, days 3–5** | Members 1–3 build lexer/parser/semantics; Member 4 builds lowering and player from a known SOS event fixture; Member 5 builds CLI/server/UI against a mock compile response | Every module has a minimal working path and its own tests |
| **Week 2** | Connect real compiler stages; implement both commands and diagnostics; connect browser to real output; integrate frequently | CLI and browser compile SEND/DECODE end to end; all corrected spec fixtures pass |
| **Week 3** | Complete audio/light controls; verify timing, positions, separators, and empty cases; add inspection views and regression tests | Complete mandatory demo works on two teammates' machines |
| **Week 4** | Freeze language scope; fix defects; finish report and contribution record; rehearse; capture backup screen recording | Clean installation, passing tests, prepared presentation, tagged submission |

Dependency path: shared contracts → lexer → parser → semantic IR → code generation → full integration. Player and UI development can proceed in parallel using agreed fixtures. Replace mocks as soon as the real upstream module works.

Run a short daily check-in: what merged, what is blocked, and which contract changed. Integrate at least every two working days; do not wait for five finished branches at the end.

## 11. Testing and acceptance checklist

Each owner writes tests alongside their module. Use fixtures derived from the corrected specification with explicit expected phase and source position.

| Area | Required checks |
|---|---|
| Lexing | Exact keywords, SENDX, lowercase commands, quote boundaries, forbidden controls, missing quotes, tabs outside strings, LF/CRLF/CR, EOF locations |
| Parsing | Empty program, blank lines, final newline optional, multiple statements, missing string, missing HWS, two commands on a line, extra string |
| SEND semantics | All encodable mappings, ASCII lowercase, digits, punctuation, repeated spaces, leading/trailing spaces, unsupported printable characters and Unicode, empty SEND |
| DECODE semantics | Every dictionary mapping including quote, unknown groups, illegal symbols, adjacent/leading/trailing slashes, compact slashes, repeated spaces, outer spaces, empty/all-space body |
| Code generation | Canonical notation, statement order, punctuation slash versus word separator, decoded uppercase text |
| Timing | Exact event sequences and totals, all 1/3/7-unit boundaries, no leading/trailing gap, empty playback |
| Integration | CLI success/failure/status codes, UTF-8 file loading, JSON schema, malformed API request, no partial outputs/playback on failure |
| Manual browser | First-click audio activation, light/audio share timeline, mute, stop, replay, pause/resume, multiple SEND statements, recompilation while playing, supported browsers |

Add an exhaustive dictionary round trip: decoding the code of each supported character returns that character. For SEND-representable text, assert `decode(encode(text)) == normalize(text)`, where normalization uppercases ASCII and collapses internal spaces. Exclude the source quote from SEND generation and reject invalid edge spaces rather than normalizing them away.

Do not round-trip raw decoded quote text back into a quoted v0.1 source string; the language has no escape syntax.

The release is ready when all of the following hold:

- A clean checkout can install, run tests, compile an example, and launch the UI using README commands.
- Every corrected specification case passes with the correct phase and location.
- No invalid input is silently skipped, substituted, or executed partially.
- `SEND "SOS HELP"` produces correct notation and audible/visible Morse.
- DECODE shows correct readable output, including punctuation.
- Tokens, AST, IR, and signal events can be shown during the presentation.
- Stop reliably silences audio and turns off the light.
- Each teammate can explain their own phase and its connection to the next.

## 12. Git and integration workflow

Use short branches such as `feat/lexer`, `feat/parser`, `feat/semantics`, `feat/signals`, and `feat/interface`. Open small PRs with a description, example input/output, and the tests run. Use the reviewer rotation in section 5. Keep main runnable and merge shared contract changes before dependent implementations.

Add CI that installs the package and runs pytest. Agree on one Python version supported by all teammates and record it in project configuration and README. Pin or constrain development dependencies consistently. Avoid committing virtual environments, generated caches, or local machine paths.

When a bug is discovered, record a reproducible `.ms` input and expected result, add a focused regression test, and fix the owning module. Do not patch the browser to compensate for a compiler semantic bug.

## 13. Report and presentation outline

The report should contain: problem statement, scope, language design, corrected grammar, token definitions, architecture, semantic checks, IR, timing/code generation, implementation decisions, test evidence, limitations, contribution table, and future work. Cite the language specification's standard references when discussing Morse mappings; distinguish its explicit repertoire extensions from standard entries.

Suggested 8–10 minute demonstration, with each member presenting their responsibility:

1. **Member 5:** launch the app; explain source input and output targets.
2. **Member 1:** compile `SEND "SOS"`; show tokens, strings, and source spans.
3. **Member 2:** show AST and reject a same-line second statement.
4. **Member 3:** show IR, encode mixed-case text, decode Morse, reject `DECODE "..--"`, and explain syntax versus semantics.
5. **Member 4:** show signal events; play `SEND "SOS HELP"`; explain 1/3/7 timing and demonstrate Stop.
6. **Member 5:** run a mixed multi-line example and show the passing automated test suite.

Include one lexical failure (`send "SOS"`), one syntax failure (`SEND`), and one semantic failure (`DECODE "..--"`). Keep a known-good source file and backup recording available. Test the actual presentation machine's browser and audio output before the session.

## 14. First implementation session checklist

1. Read the specification together and merge the agreed corrections from section 3.
2. Fill in the five names, course constraints, deadline, Python version, and supported demo browser.
3. Add packaging, README startup commands, shared types, and a minimal test runner.
4. Commit fixtures for SOS, HELLO WORLD, empty input, and one error per phase.
5. Give each module owner the interfaces in section 7 and create small initial issues.
6. Wire an early vertical slice: `SEND "SOS"` → tokens → AST → IR → notation → signals → player.
7. Then expand conformance coverage and finish DECODE, diagnostics, and controls.

The best first milestone is a small, complete SOS demonstration whose intermediate stages are real. Every later feature should extend that same pipeline.
