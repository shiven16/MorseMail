# Morse Mail: submit tomorrow

> **Implementation complete:** this is historical planning material. Use [FILE_OWNERSHIP.md](FILE_OWNERSHIP.md), [TEST_REPORT.md](TEST_REPORT.md), and the root README for the current implementation and five-person handoff.

> **Team allocation update:** follow [TEAM_EXECUTION_BLUEPRINT.md](TEAM_EXECUTION_BLUEPRINT.md) for the active assignments and contracts. It replaces the dedicated-integrator allocation with shared boundary ownership and independent fixture-driven development.

**Submission date: November 6, 2026 (India time).**

The repository has a specification but no implementation. The four-week plan is too broad for this deadline. Use this plan as the active scope; the longer project guide is reference material. Budget approximately **8–10 focused working hours**, with all five people available together. This is a target, not a guarantee: confirm the actual submission time and preserve a final buffer. If fewer hours remain, use the fallback cuts below.

## What to submit

A Python compiler that reads a `.ms` file, shows its compiler stages, prints encoded/decoded results, and generates a standalone HTML player with blinking light and beeps for SEND. The user opens that generated file in a browser and clicks Play.

```text
python -m morsemail examples/demo.ms --inspect --html output/demo.html
python -m unittest discover -s tests
```

These are the commands the team should implement, not commands available in the repository today. A clean checkout should run without third-party Python packages or internet access. Pick one Python version already installed on everyone's machines.

**Deliberate simplification:** generate the player HTML from the CLI. Do not build a local API server, frontend framework, live browser editor, database, login, actual email service, or hardware integration. The browser only renders compiler-generated output and plays events. This removes an entire integration boundary while still delivering the requested compiler, light, and beeps.

The required flow is:

```text
.ms file → lexer → tokens → parser → AST → semantic analyzer → IR
                                                               ↓
                                               text + timed signal events
                                                               ↓
                                                  standalone HTML player
```

Mandatory features:

- SEND and DECODE with uppercase commands and quoted strings.
- Multiple newline-separated instructions.
- The specified dictionary, normalization, and separator validation.
- Clear lexical, syntax, and semantic errors with locations.
- Inspectable tokens, AST, and IR via `--inspect`.
- Text results and generated HTML with Play, Stop, mute, and a light indicator.
- Focused automated tests, runnable examples, README, short report, and backup demo recording.

Cut pause/resume, speed sliders, frequency sliders, live editing, animations beyond the light, exhaustive styling, and deployment. A fixed 100 ms unit and 600 Hz tone are sufficient runtime defaults. Play must require a click for browser audio activation.

## Five assignments: start together

| Person | Deliver by hour 2 | Deliver by hour 4 | Final responsibility |
|---|---|---|---|
| **1: lexer** | Token/span types and working SEND tokenization | Complete lexer, trivia, newline handling, lexical errors, tests | Check source positions; write lexer report section |
| **2: parser** | AST types and parser for one statement using agreed token fixtures | Complete multi-line grammar and syntax tests | Maintain valid/invalid examples; write grammar/AST section |
| **3: semantics** | Dictionary, IR types, SOS encoding using AST fixtures | SEND/DECODE validation, canonical text, semantic tests | Audit mappings and semantic diagnostics; write semantic/IR section |
| **4: signals and player** | Signal event type, SOS event fixture, working light and audio | Event generation and standalone HTML template with Play/Stop/mute | Verify timing and playback; capture backup demo; write output section |
| **5: integration** | Package skeleton, compiler orchestration skeleton, CLI, shared diagnostic type | Real pipeline wired through available modules, HTML export, end-to-end tests | README, report assembly, clean-checkout verification, submission packaging |

Every person tests their own part. Person 5 integrates; they do not take over unfinished modules. Person 4 owns the HTML template and playback code; Person 5 only injects serialized compiler output and writes the file. Use one working repository/branch with agreed file ownership if Git branching is unfamiliar. Otherwise use short branches and merge working increments at hours 2, 4, and 6.

Do not let separate branches develop different interfaces. Spend the first 30 minutes on these contracts together.

## Freeze interfaces in the first 30 minutes

Use Python dataclasses and standard-library `unittest`. Keep interfaces small:

```text
Token(kind, value, start_offset, line, column, leading_hws)
Statement(operation, value, line, column, content_offset, content_line, content_column)
OperationIR(operation, words, text)
SignalEvent(kind, units)
Diagnostic(phase, message, line, column)
```

- Token kinds: SEND, DECODE, STRING, NEWLINE, EOF.
- Token value for STRING excludes quotes; its token location points at the opening quote.
- `leading_hws` counts spaces/tabs immediately preceding the token outside a string.
- Statement `line`/`column` point at the command; content fields point just after the opening quote. Keep original source available to calculate diagnostic positions.
- IR operation is SEND or DECODE; `words` is `list[list[str]]` of validated Morse groups; `text` is normalized SEND text or decoded DECODE text.
- Empty SEND has `words=[]` and `text=""`.
- Signal kind is MARK or GAP; units are positive integers.
- Use one shared `CompilationError` carrying a Diagnostic; the CLI catches it and exits nonzero.

Proposed module functions:

```text
lexer.lex(source) → list[Token]
parser.parse(tokens) → list[Statement]
semantic.analyze(statements, source) → list[OperationIR]
signals.lower(words) → list[SignalEvent]
compiler.compile_source(source) → compilation result
player.render(compilation_result) → HTML string
```

The compilation result includes tokens, AST, IR, and ordered outputs. Each output includes readable text, canonical notation, and events for SEND. Compile the complete file before writing a playable result. DECODE displays text and has no playback events.

Avoid designing a generic framework. If these records need one extra field for correct locations, agree on it in the shared chat and update all callers immediately.

## Resolve spec conflicts quickly

Spend at most 20 minutes agreeing on the corrections already identified in section 3 of PROJECT_GUIDE.md. Record them in the specification rather than implementing incompatible interpretations.

Use these decisions for this sprint:

1. Printable non-ASCII string content is tokenized and then rejected semantically when unsupported; literal tabs, newlines, and control characters remain lexical failures.
2. Recognize SEND immediately before a quote so `SEND"A"` gets the required parser whitespace error. SENDX remains an unknown command.
3. `DECODE 123` is a lexical failure because there is no numeric token.
4. Correct wrong mappings/examples: period is `.-.-.-`; `...` decodes to S; include the missing equals-sign group in the punctuation example.
5. Diagnostic positions point to the actual offending character or separator. The second command in `SEND "A" DECODE ".-"` starts at column 10. The leading slash in `DECODE "/ ..."` is column 9; the second slash in `DECODE "... / / ---"` is column 15.
6. Lex the whole file, then parse, then analyze; fail on the first error within the first failing phase. Do not execute valid earlier statements if compilation fails.

Keep the strict uppercase, quoted syntax. Adding the informal `send SOS HELP` form creates unnecessary language work today.

## Hour-by-hour integration gates

Hours are elapsed work time from the team's actual start, not clock times.

| Time | Required outcome |
|---|---|
| **0–0.5 h** | Assign names, confirm submission time, freeze scope and interfaces, commit spec corrections and skeleton |
| **0.5–2 h** | Everyone builds their module using shared fixtures; Person 4 gets a fixed SOS player working immediately |
| **2 h gate** | Merge a real source → tokens → AST → IR → notation slice for `SEND "SOS"`; identify any missing stage immediately |
| **2–4 h** | Complete SEND, DECODE, errors, signal lowering, and generated HTML integration |
| **4 h gate** | One command compiles demo.ms and creates a playable HTML file. If incomplete, all effort goes to closing this path |
| **4–6 h** | Correct semantics, exact timing, locations, multi-line programs, and focused tests |
| **6 h gate** | Freeze features. Both commands, diagnostics, light, beeps, and Stop must work |
| **6–8 h** | Fix remaining defects; finish README/report; verify on another laptop; rehearse and record |
| **8–10 h** | Submission buffer for machine issues, packaging, final checks, and upload |

If your remaining time is shorter, compress implementation blocks and remove cosmetic work. Do not use the upload buffer for new features. If a course report template exists, use it immediately rather than inventing a report format at the end.

## Minimum tests before submission

Use at least these focused checks; add location assertions to the invalid cases after the corrected rules are frozen.

| Case | Expected behavior |
|---|---|
| `SEND "SOS HELP"` | `... --- ... / .... . .-.. .--.` |
| `SEND "Hello World"` | Correct uppercase-normalized encoding |
| `SEND "A  B"` | `.- / -...` |
| `SEND "A/B"` | `.- -..-. -...`; encoded slash is a character |
| `SEND ""` | Empty notation, zero events |
| `DECODE "... --- ..."` | SOS |
| `DECODE ".../---"` | S O |
| `DECODE ".-  -..."` | AB |
| `DECODE ".-..-."` | A quote character |
| Two valid commands on separate lines | Two results in source order |
| Empty source, blank lines, LF/CRLF/CR | Accepted with correct line handling |
| `send "SOS"`; unterminated string | Lexical failures |
| `SEND`; `SEND"A"`; two commands on one line | Syntax failures |
| `SEND "#"`; `SEND " A"` | Semantic failures |
| `DECODE "..--"`; `DECODE ".-x"` | Semantic failures |
| Empty DECODE; leading/trailing/adjacent slashes | Semantic failures |
| E, T, EE, E E, SOS timing | Totals 1u, 3u, 5u, 9u, 27u respectively |
| Invalid later statement | Whole compilation fails; no new playable output |

Also check all 54 dictionary entries round-trip through the reverse dictionary and have unique codes. Browser checks: click Play, verify light and sound, Stop during a long mark, replay, mute, and play a multi-statement file. Both light and audio must use the same event timeline; gaps are 1u inside letters, 3u between letters, and 7u between words, without adding gaps together.

## Playback implementation guardrails

Use Web Audio scheduled against one clock; derive the light position from the same elapsed playback time. Stop must cancel scheduled sound and reset the light. Use a playback generation/cancellation ID so callbacks from an old Play cannot restart output after Stop or replay.

HTML generation must embed serialized output safely: escape `<` in embedded JSON as `\\u003c`, and render text with `textContent`. Do not interpolate raw source into HTML markup or JavaScript. The standalone file must contain all CSS/JavaScript and work offline. A fixed short pause between separate SEND statements belongs to the runtime, not Morse character timing.

## Submission package and five-person presentation

Submit source, tests, examples, README, report, and one generated demo HTML file. Exclude virtual environments, caches, and absolute machine-specific paths. If submitting an archive, extract it into a fresh directory and run the documented commands before uploading.

README must state requirements, exact setup/run/test commands, language syntax, one valid example, one invalid example, and who built each module. The report can be short unless your course specifies otherwise: problem, grammar/tokens, architecture, semantic checks, IR/signals, test evidence, contributions, and limitations.

Five-minute demo:

1. Person 5 runs the CLI and opens the generated player.
2. Person 1 shows token inspection and one lexical error.
3. Person 2 shows AST and one syntax error.
4. Person 3 shows IR, DECODE, and one semantic error.
5. Person 4 plays SOS HELP, explains 1/3/7 timing, and demonstrates Stop.

Each person prepares a 30–45 second explanation. Keep the demo file and backup recording locally. Describe only implemented features in the report.

## If time starts running out

Cut in this order: visual polish → extra examples → elaborate inspection formatting → playback sequencing controls. Keep plain text inspection if a visual tree is unfinished. Do not introduce a new stack or dependencies to save a partially built UI.

Preserve lexer, parser, semantic checks, IR, textual output, basic light/beeps, and Play/Stop. Report any remaining limitations honestly. A small working compiler that all five people can explain is the target for tomorrow.
