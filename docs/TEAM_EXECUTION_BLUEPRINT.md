# Morse Mail: five-person parallel execution blueprint

> **Implementation complete:** this is historical planning material. Use [FILE_OWNERSHIP.md](FILE_OWNERSHIP.md), [TEST_REPORT.md](TEST_REPORT.md), and the root README for the current implementation and five-person handoff.

**Deadline:** November 6, 2026. **Audience:** all five teammates. **Status:** implementation instructions; the compiler does not exist yet.

This file is the team's working agreement. It supersedes the member allocation in the earlier guides: there is **no dedicated integrator or sole submission owner**. Each member builds a bounded component, tests it without needing the others' implementations, connects their own boundary, reviews another component, and contributes to the final deliverables.

Independent development requires agreement on contracts, not the elimination of all dependencies. The finished application still has a pipeline. The contracts, fixtures, and local test doubles below let everyone work before upstream code is ready.

## 1. Final product and scope

Build a Python compiler for this language:

```text
SEND "SOS HELP"
DECODE "... --- ..."
```

It must perform lexical analysis, parsing, semantic validation, IR construction, textual code generation, and signal generation. A generated standalone HTML file displays results and plays SEND as light and sound. No server or internet is needed.

Final commands:

```sh
python -m morsemail examples/demo.ms --inspect --html output/demo.html
python -m unittest discover -s tests
```

Use Python 3.10-compatible code and the standard library. Confirm that everyone has Python 3.10 or newer installed. No external Python dependency, frontend framework, package installation, backend server, physical hardware, actual email delivery, login, or database is required. Use the package directly from the repository root.

Mandatory browser controls: Play, Stop, mute. Use fixed defaults of 100 milliseconds per unit and 600 Hz tone. Pause/resume and timing sliders are outside this sprint.

## 2. Assign names and agree once

Fill this table in before branching. Every member is both an implementer and a reviewer.

| Seat | Name | Main responsibility | Reviews | Backup for |
|---|---|---|---|---|
| A | __________ | Lexer and shared contract seed | E | B |
| B | __________ | Parser and sample programs | A | C |
| C | __________ | Semantic analysis and dictionary | B | D |
| D | __________ | Code generation and compiler orchestration | C | E |
| E | __________ | HTML player, CLI, and packaging | D | A |

A backup reads the relevant code and knows how to run its tests; it does not duplicate implementation. If someone becomes unavailable, the backup takes over from the latest pushed commit. Push working increments often enough that work is recoverable.

Before starting, record in the team chat: actual submission time, names, repository URL, Python versions, browser used for the demo, and the agreed contract revision (**v1** below).

## 3. Repository structure and exclusive edit zones

Use this layout to run directly from a clean checkout:

```text
morsemail/
  __init__.py              # A creates an empty file during bootstrap
  contracts.py            # A seeds once; frozen afterward
  lexer.py                # A
  parser.py               # B
  morse.py                # C
  semantic.py             # C
  codegen.py              # D
  compiler.py             # D
  player.py               # E: render standalone HTML
  cli.py                  # E
  __main__.py             # E: calls cli.main()
tests/
  test_lexer.py           # A
  test_parser.py          # B
  test_semantic.py        # C
  test_codegen.py         # D
  test_compiler.py        # D
  test_player.py          # E
  test_cli.py             # E
  support/
    __init__.py           # A creates empty during bootstrap
    fixtures.py           # A seeds once; frozen afterward
examples/                 # B
  demo.ms
  lexical_error.ms
  syntax_error.ms
  semantic_error.ms
docs/contributions/
  A_LEXER.md              # A
  B_PARSER.md             # B
  C_SEMANTICS.md          # C
  D_COMPILER.md           # D
  E_PLAYER_CLI.md         # E
README.md                 # E
.gitignore                # E
```

This is a proposed layout. Existing planning/specification documents remain available. Avoid a `src/` layout for this deadline because it adds installation/setup steps. Do not have multiple people edit a shared report during implementation; each writes their own contribution file. The final report may concatenate these files in A–E order, with architecture and test evidence added during the joint review.

No one edits another person's owned files without coordination. This prevents merge conflicts. Ownership is an editing boundary, not a permanent knowledge boundary: the reviewer and backup must understand that component.

## 4. Bootstrap: one shared commit, then parallel work

Budget 20–30 minutes. All five remain present.

1. A creates the package marker, `contracts.py`, test support markers, and common fixtures using sections 5 and 6. No application logic goes in this commit.
2. The team jointly agrees to the specification decisions in section 7. B records them in `docs/LANGUAGE_SPECIFICATION.md` during this session; everyone reviews.
3. Push the bootstrap to main and verify each teammate can import the contracts. This is the **only planned shared prerequisite** before separate implementation.
4. Create the five branches from that commit. A's bootstrap responsibility ends here; future contract changes require the process below and do not depend on A being online.

If A is unavailable, any teammate can paste the same contract into the file. Do not wait for a particular person to perform a mechanical bootstrap.

**Contract changes after branching:** propose the exact change in the team chat, identify affected callers, get agreement from those owners, then let any available teammate make the change in a small PR. Prefer implementing the frozen interface over changing it under deadline. Do not silently rename fields or change SEND into ENCODE in one module.

## 5. Frozen contract v1: paste into morsemail/contracts.py

Use these exact records and field names. Type annotations describe the expected interface; validation belongs to the appropriate compiler phase.

```python
from dataclasses import dataclass, field
from typing import List, Optional

@dataclass(frozen=True)
class Position:
    offset: int
    line: int
    column: int

@dataclass(frozen=True)
class Span:
    start: Position
    end: Position

@dataclass(frozen=True)
class Diagnostic:
    phase: str
    message: str
    span: Span

class CompilationError(Exception):
    def __init__(self, diagnostic: Diagnostic):
        self.diagnostic = diagnostic
        super().__init__(diagnostic.message)

@dataclass(frozen=True)
class Token:
    kind: str
    value: str
    span: Span
    leading_hws: int = 0
    content_start: Optional[Position] = None

@dataclass(frozen=True)
class Statement:
    operation: str
    value: str
    span: Span
    argument_span: Span
    content_start: Position

@dataclass(frozen=True)
class Program:
    statements: List[Statement]

@dataclass(frozen=True)
class OperationIR:
    operation: str
    words: List[List[str]]
    text: str
    source_span: Span

@dataclass(frozen=True)
class SignalEvent:
    kind: str
    units: int

@dataclass(frozen=True)
class Output:
    operation: str
    text: str
    notation: str
    events: List[SignalEvent]
    source_span: Span

@dataclass
class CompilationResult:
    ok: bool
    diagnostics: List[Diagnostic] = field(default_factory=list)
    tokens: List[Token] = field(default_factory=list)
    ast: Optional[Program] = None
    ir: List[OperationIR] = field(default_factory=list)
    outputs: List[Output] = field(default_factory=list)
```

### Contract rules

- `operation`: exactly `SEND` or `DECODE`, including in IR and output.
- Token kinds: exactly SEND, DECODE, STRING, NEWLINE, EOF.
- `Token.value`: keyword spelling, raw string body, `"\n"` for any newline spelling, and `""` for EOF.
- Source spans are end-exclusive. Offsets count Python string characters, not bytes. Lines/columns start at 1. Tabs outside strings advance to the next 8-column tab stop.
- STRING spans include both quotes. `content_start` points just after its opening quote; other token kinds use None.
- Statement spans run from the keyword start through the argument's closing quote. `argument_span` is the STRING token span.
- IR `words` contains only validated dot/dash groups, preserving word boundaries. SEND `text` is ASCII-uppercased text with internal spaces collapsed. DECODE `text` is decoded readable text. Empty SEND has `words=[]` and `text=""`.
- `Output.notation` is canonical Morse for either operation. DECODE has `events=[]`. SEND has timed events, including none for empty SEND.
- Signal kinds: exactly MARK or GAP. Durations are positive integer Morse units.
- Diagnostic phases: exactly `lexical`, `syntax`, `semantic`. Diagnostic message wording may vary; phase, meaning, and position must match the corrected spec.
- A normal offending-character diagnostic spans that character. Unterminated-string errors point at the opening quote. EOF errors use an empty span at EOF. Empty DECODE points at its opening quote.
- Failed compilation has `ok=False`, one diagnostic, and `outputs=[]`. Completed earlier-stage inspection data may remain; never expose partially validated executable outputs.
- These dataclasses are frozen only against field reassignment; do not mutate contained lists after passing them to another phase.

### Public function signatures: exact module boundaries

```python
# A: morsemail/lexer.py
lex(source: str) -> list[Token]

# B: morsemail/parser.py
parse(tokens: list[Token]) -> Program

# C: morsemail/semantic.py
analyze(program: Program, source: str) -> list[OperationIR]

# D: morsemail/codegen.py
lower(words: list[list[str]]) -> list[SignalEvent]
generate(ir: list[OperationIR]) -> list[Output]

# D: morsemail/compiler.py
compile_source(source: str) -> CompilationResult

# E: morsemail/player.py
render_player(result: CompilationResult) -> str

# E: morsemail/cli.py
main(argv=None) -> int
```

Phase functions raise CompilationError for expected input errors. Only `compile_source` converts these into a failed result. Programming bugs must not be disguised as user diagnostics by catching every Exception.

CLI contract:

```text
python -m morsemail FILE [--inspect] [--html PATH]
```

Exit 0 for successful compilation, 1 for language errors, 2 for argument/file failures. Print diagnostics on stderr. Without inspect, print notation for SEND and text for DECODE in source order. With inspect, include labeled tokens/AST/IR/results; plain readable JSON using `dataclasses.asdict` is sufficient. Write HTML only after successful compilation, creating the parent directory if necessary. If compilation fails, do not overwrite an earlier HTML file and tell the user no new player was generated.

## 6. Shared fixtures: everyone can work without upstream modules

A seeds `tests/support/fixtures.py` with these objects. Also create an empty `tests/__init__.py` so imports such as `from tests.support.fixtures import SOS_PROGRAM` are unambiguous. No fixture may import a real lexer, parser, compiler, or semantic implementation.

```python
from morsemail.contracts import (
    Position, Span, Token, Statement, Program, OperationIR,
    SignalEvent, Output, CompilationResult,
)

SOS_SOURCE = 'SEND "SOS"'

def p(offset):
    return Position(offset, 1, offset + 1)

SOS_SPAN = Span(p(0), p(10))
SOS_TOKENS = [
    Token("SEND", "SEND", Span(p(0), p(4))),
    Token("STRING", "SOS", Span(p(5), p(10)), 1, p(6)),
    Token("EOF", "", Span(p(10), p(10))),
]
SOS_PROGRAM = Program([
    Statement("SEND", "SOS", SOS_SPAN, Span(p(5), p(10)), p(6))
])
SOS_IR = [OperationIR("SEND", [["...", "---", "..."]], "SOS", SOS_SPAN)]
SOS_EVENTS = [
    SignalEvent("MARK", 1), SignalEvent("GAP", 1),
    SignalEvent("MARK", 1), SignalEvent("GAP", 1),
    SignalEvent("MARK", 1), SignalEvent("GAP", 3),
    SignalEvent("MARK", 3), SignalEvent("GAP", 1),
    SignalEvent("MARK", 3), SignalEvent("GAP", 1),
    SignalEvent("MARK", 3), SignalEvent("GAP", 3),
    SignalEvent("MARK", 1), SignalEvent("GAP", 1),
    SignalEvent("MARK", 1), SignalEvent("GAP", 1),
    SignalEvent("MARK", 1),
]
SOS_OUTPUTS = [Output("SEND", "SOS", "... --- ...", SOS_EVENTS, SOS_SPAN)]
SOS_RESULT = CompilationResult(
    ok=True, tokens=SOS_TOKENS, ast=SOS_PROGRAM, ir=SOS_IR, outputs=SOS_OUTPUTS
)
```

Each member creates additional inputs directly as records in their own test file. Do not wait for a lexer to build parser tests or a parser to build semantic tests. Avoid mutating shared fixture lists; construct fresh records for changed cases.

### Independent verification commands

```sh
# A
python -m unittest tests.test_lexer
# B
python -m unittest tests.test_parser
# C
python -m unittest tests.test_semantic
# D
python -m unittest tests.test_codegen tests.test_compiler
# E
python -m unittest tests.test_player tests.test_cli
```

D and E use `unittest.mock` for dependencies that do not exist yet. D can import phase modules inside `compile_source` and inject temporary `types.ModuleType` doubles through `patch.dict(sys.modules, ...)` until upstream modules land. E's CLI imports `compile_source` inside `main`; tests can inject a fake compiler module the same way. Keep all such doubles in tests, never in production output.

Do not commit placeholder implementations inside another member's owned module. Do not merge fake success responses as the real compiler. At integration, rerun the same tests with real modules and add the complete pipeline checks.

## 7. Frozen language decisions for the deadline

B records these agreed corrections in the language specification during bootstrap. Do not spend the sprint debating alternate syntax.

1. Uppercase SEND/DECODE, quoted strings, one statement per line. No comments or escapes.
2. Permit printable non-ASCII characters lexically inside strings, then reject unsupported characters semantically. Reject Unicode control/format characters and non-ASCII whitespace lexically; ASCII space is allowed. This preserves intended Unicode semantic examples without allowing tabs/newlines in strings.
3. A complete keyword immediately followed by a quote is tokenized as a keyword; the parser reports missing horizontal whitespace. SENDX remains an unknown command lexeme.
4. `DECODE 123` fails lexically because numbers are not separate source-language tokens.
5. Correct spec examples: `.- .-.-.-` decodes to `A.`; `...` decodes to S; `!&;=_$@` encodes as `-.-.-- .-... -.-.-. -...- ..--.- ...-..- .--.-.`.
6. Use actual offending locations: second command in `SEND "A" DECODE ".-"` at 1:10; leading slash in `DECODE "/ ..."` at 1:9; second slash in `DECODE "... / / ---"` at 1:15.
7. Complete lexing before parsing and complete parsing before semantics. Stop at the first error in the earliest failing phase. Any error prevents all outputs/playback for that compilation.
8. DECODE strips outer ASCII spaces and accepts repeated internal spaces or compact slash separators, but not empty input or missing groups on either side of slash. Empty/all-space input errors point at the opening quote.
9. SEND uppercases ASCII only, collapses internal ASCII spaces, rejects leading/trailing spaces, and allows an empty string.
10. No leading/trailing signal gap. Word gap replaces character gap. DECODE displays text but does not play by default.

## 8. Member A: lexer execution card

**Read:** specification sections 2–3, contract sections 5–7 here. **Edit:** lexer.py, test_lexer.py, A_LEXER.md. Seed shared files only during bootstrap.

**Input:** source string. **Output:** exact Token records, one EOF. **No dependency:** only contracts and standard library.

Implementation steps:

1. Maintain index, line, and column. Handle LF, CRLF, and CR as one logical newline; track original offsets.
2. Skip outside-string spaces/tabs while counting trivia for the next token. Reset trivia across newlines.
3. Recognize complete commands, quoted strings, and newlines. Preserve the string's body and content start.
4. Reject unknown command words, invalid outside characters, forbidden string characters, and missing closing quotes.
5. Raise CompilationError with correct positions. Never validate Morse groups or normalize string contents here.

**Tests:** SOS tokens equal SOS_TOKENS; empty source; empty string; lowercase command; SENDX; SEND immediately followed by quote; literal tab inside string; outside tab position; punctuation inside string; non-ASCII printable string; unterminated string at EOF/newline; all newline spellings; exactly one EOF.

**Commits:** bootstrap contracts/fixtures → basic lexer → locations/error tests → documentation. Push each working checkpoint.

**Boundary check after merge:** lexed SOS tokens equal the fixture; B runs the real lexer output through parse while A reviews the result. Neither person waits for this to develop independently.

## 9. Member B: parser execution card

**Read:** grammar/specification section 4 and contracts. **Edit:** parser.py, test_parser.py, examples/, B_PARSER.md; spec correction only during bootstrap.

**Input:** token list. **Output:** Program. **No dependency:** do not import lexer in parser or unit tests.

Implementation steps:

1. Accept blank NEWLINE tokens, then repeated statements until EOF.
2. Require SEND/DECODE, a following STRING, and positive STRING.leading_hws.
3. After the string require NEWLINE or EOF; reject a second command or extra string on that line.
4. Preserve original argument content and spans. Do not inspect dictionary membership or decode Morse.
5. Report missing string at the next token, including EOF; missing whitespace at the quote.

**Tests:** SOS_TOKENS → SOS_PROGRAM; missing argument; missing whitespace; multiple statements; blank lines; extra STRING; same-line second command; final newline optional; empty program. Build token objects directly for each test.

**Examples:** demo.ms contains SEND SOS HELP, DECODE SOS, mixed-case SEND, and a multiword example. Each error example contains one intentional error and a comment in the contribution document explaining it; comments must not be placed inside `.ms` source.

**Commits:** simple parser → line/whitespace validation and tests → example programs → documentation.

**Boundary check after merge:** B proves real lexer → parser works and fixes parser-owned mismatches. B reports lexer-owned issues to A with a reproducer.

## 10. Member C: semantics execution card

**Read:** specification sections 5–7 and IR rules. **Edit:** morse.py, semantic.py, test_semantic.py, C_SEMANTICS.md.

**Input:** Program plus original source for positions. **Output:** validated OperationIR list. **No dependency:** instantiate Statement/Program records directly; do not import parser or lexer.

Implementation steps:

1. Define the exact 54 character mappings from the specification: 26 letters, 10 digits, 18 punctuation entries. Derive the reverse map and assert uniqueness in tests.
2. SEND: normalize ASCII lowercase only; reject unsupported characters and edge spaces; split words on runs of spaces; map characters to groups. Empty SEND yields zero words.
3. DECODE: scan dot/dash groups and separators while retaining offsets. Validate each complete group and each slash placement. Normalize outer/repeated spaces according to the contract.
4. Decode groups into characters and join words with one space. Preserve punctuation including the decoded quote.
5. Convert offending offsets into source spans. Strings cannot contain a tab/newline, so offsets within valid string content advance columns by scalar characters; respect the provided content_start.

**Tests:** fixture Program → SOS_IR; all dictionary mappings; lowercase; digits/punctuation; encoded literal slash versus word separator; repeated spaces; edge spaces; unsupported # and é; invalid group; invalid symbol; compact slash; leading/trailing/adjacent slash; empty/all-space DECODE; empty SEND; decoded quote.

**Commits:** dictionary and basic encoding → decoding and separators → diagnostics/edge tests → documentation.

**Boundary check after merge:** C validates a real Program from B against expected IR. C also reviews B's grammar to ensure semantic checks have not leaked into the parser.

## 11. Member D: code generation and orchestration execution card

**Read:** specification sections 8–10 and frozen records. **Edit:** codegen.py, compiler.py, test_codegen.py, test_compiler.py, D_COMPILER.md.

**Input:** IR for codegen; source for orchestration. **Output:** Output list / CompilationResult. **Development dependencies:** fixtures for codegen and mocked phase modules for orchestration.

Implementation steps:

1. Render notation with `' '.join(groups)` inside each word and `' / '.join(words)` between words.
2. Lower SEND words into MARK/GAP events: dot 1u, dash 3u, within-letter gap 1u, between-letter gap 3u, between-word gap 7u.
3. Never add both word and character gaps or a trailing gap. Empty SEND generates no events. DECODE produces no events.
4. In compile_source, call lex → parse → analyze → generate. Store completed stages for inspection. Catch CompilationError and return one diagnostic with outputs cleared.
5. Test orchestration call order, early failure, and no partial outputs using mocks before other modules exist.
6. Once upstream modules merge, run real compiler tests for both operations and invalid inputs. D owns fixing orchestration; each phase owner fixes its own phase.

**Tests:** generate(SOS_IR) equals SOS_OUTPUTS; lower matches exact SOS_EVENTS; timing totals E=1u, T=3u, EE=5u, E E=9u, SOS=27u; empty words; DECODE text; source order; failed later statement prevents every output.

**Commits:** signal lowering/text generation → orchestrator with mocks → real pipeline integration checks → documentation.

**Boundary check after merge:** D tests real semantic IR → codegen and full compile_source. E independently tests compiler result → player, so D is not the sole verifier of final output.

## 12. Member E: player, CLI, and packaging execution card

**Read:** output/CLI contracts and SOS_RESULT fixture. **Edit:** player.py, cli.py, __main__.py, test_player.py, test_cli.py, README.md, .gitignore, E_PLAYER_CLI.md.

**Input:** CompilationResult for player; CLI arguments/source file for CLI. **Output:** standalone HTML and user-facing terminal results. **Development dependencies:** SOS_RESULT and mocked compiler; no real pipeline needed initially.

Implementation steps:

1. render_player creates a complete HTML string with embedded CSS/JS and serialized Output records. Reject failed results; it must never produce playable output from a failed compilation.
2. Show notation/readable results, Play, Stop, mute, status, and light. SEND statements play in order with a documented runtime pause; DECODE only displays text.
3. Use the Web Audio clock to schedule marks and derive light state from the same playback position. User click activates AudioContext. Stop cancels scheduled sound, prevents stale callbacks, and turns off the light. Replay starts fresh.
4. Safely embed JSON: replace literal `<` with the six-character JSON escape `\u003c`; use textContent for dynamic text. No raw source interpolation into executable markup.
5. CLI reads UTF-8, calls compiler, prints results/diagnostics, supports inspect, and writes HTML only on success. __main__.py calls `raise SystemExit(main())`.
6. README documents exact commands, syntax, architecture, tests, and contributions. Ignore __pycache__, virtual environments, and local generated output; include one intentional demo HTML artifact in the final package if required.

**Tests:** render SOS_RESULT without compiler imports; output contains embedded correct event data and controls; dangerous text such as a decoded/source `</script>` string cannot terminate the data script; failed result rejected; CLI exit codes/inspect/file failures tested with mocks; no HTML overwrite on compile failure. Manual tests cover actual audio/light, Stop during mark, replay, mute, and offline opening.

**Commits:** standalone fixture player → CLI with mocks → actual pipeline connection and README → browser verification/docs.

**Boundary check after merge:** E runs compiler result → HTML and CLI. A reviews E's CLI/error handling, while E reviews D's timing and orchestration.

## 13. Shared Git procedure: own commits, no sole merger

Each teammate uses a separate clone on their own machine. Do not share one working directory for five active branches.

```sh
git clone REPOSITORY_URL
cd MorseMail
git switch main
git pull --ff-only
git switch -c feat/member-a-lexer
```

Use matching branches:

```text
feat/member-a-lexer
feat/member-b-parser
feat/member-c-semantics
feat/member-d-codegen
feat/member-e-player-cli
```

Make small commits that describe observable work:

```sh
git add morsemail/lexer.py tests/test_lexer.py
git commit -m "Implement keyword and quoted-string tokenization"
git push -u origin feat/member-a-lexer
```

Replace files/branch for your role. Stage explicit owned files; do not use `git add .` blindly. Commit under your own configured name/email. Do not share credentials or forge authorship. Pair work can use a genuine Co-authored-by trailer.

Create a PR with: component, contract revision v1, example input/output, tests run, and any unresolved issue. Review rotation: **B reviews A; C reviews B; D reviews C; E reviews D; A reviews E**. After review, any authorized teammate can merge. Give all teammates appropriate repository permissions before work begins. Where repository settings permit, use merge commits or rebase merges to preserve individual implementation commits.

To bring merged code into your branch:

```sh
git fetch origin
git merge origin/main
```

Resolve only understood conflicts. For a conflict in another owner's file, involve that owner/backup. Never force-push main. If a reviewed PR cannot merge because upstream modules are incomplete, keep developing with fixtures; merge safe independent pieces first.

At a gate, any available teammate can run all tests. If two teammates merge near the same time, the later PR reruns checks after updating from main. Without CI, post the command and result in the team chat; do not claim unrun checks passed.

## 14. No single point of responsibility: explicit shared duties

| Duty | Primary execution | Independent verification / backup |
|---|---|---|
| Contracts | Jointly agreed; A performs initial paste | All approve once; any member can maintain with affected owners' agreement |
| Every pipeline connection | Receiving module owner | Sending owner reviews the same fixture/result |
| Review and merge | Rotating reviewer, any permitted merger | Backup handles absence; no sole integrator |
| Automated full-suite check | Whoever merges at each integration gate | A second teammate runs at final freeze |
| Documentation | Each member writes their own contribution | Reviewer checks it; E links files in README |
| Final demo | Each member demonstrates their own stage | Backup can demonstrate that stage |
| Packaging | Any two available teammates together | Two other teammates extract and run it |
| Submission upload | Any teammate with authorized portal access | Another confirms uploaded file and receipt before deadline |

If the course portal restricts uploading to one student, that is an external access constraint. Complete the package and verification collectively, make it available to all five, and arrange a permitted backup early. Do not assume account sharing is allowed.

No task is complete only because its author says so: a test result and a reviewer provide evidence. No teammate must personally understand every line to make progress, but each boundary must have at least two people who understand it.

## 15. Integration gates and failure handling

Use elapsed time from the agreed start. This is an 8–10-hour target; if fewer hours remain, cut extras immediately.

| Gate | Everyone's evidence | Action if incomplete |
|---|---|---|
| **30 min** | Contracts import, fixtures work, spec decisions agreed, branches created | Any member completes mechanical bootstrap; do not expand scope |
| **2 h** | Each module handles its fixture; basic commits pushed | Fix the smallest missing component, with its backup assisting |
| **4 h** | Real SOS compiles to notation and a playable standalone HTML file | Stop extra feature work; owners jointly close broken boundaries |
| **6 h** | Both commands, diagnostics, timing, tests, Play/Stop/mute work | Freeze features and fix mandatory behavior only |
| **8 h** | Clean-checkout run on a second laptop, report sections, recording, final package | Use remaining time for defects and upload, not enhancements |
| **Before deadline** | Uploaded correct archive and confirmed receipt | Keep local and shared backup copies |

At each gate, each person posts: latest commit hash, tests run, remaining defect, next action. A blocking report includes concrete input, expected result, actual result, and owning file. Avoid a vague “integration doesn't work” handoff to one person.

If one module lags, its backup pairs on that module while the remaining people finish their own acceptance checks. Use test fixtures to keep downstream development moving; do not submit fixtures as the compiler implementation.

## 16. Final acceptance tests: all five participate

- **A + B:** token locations, tab stops, newlines, quote errors, whitespace rules, blank programs, multi-line statements.
- **B + C:** AST preserves raw string content; semantic violations are not incorrectly rejected by the parser.
- **C + D:** every dictionary entry, punctuation, slash versus word boundary, normalization, invalid groups/separators, empty input behavior, exact timing events.
- **D + E:** full CLI pipeline, inspection output, no partial output on failure, correct event serialization, standalone HTML output.
- **E + A:** offline browser opening, first-click audio, light and beep timeline, Stop/replay/mute, error stderr/status, fresh-directory run.

Use these core demonstration cases:

```text
SEND "SOS HELP"
SEND "Hello World"
DECODE "... --- ..."
DECODE ".../---"
SEND "A/B"
```

Run error cases separately so they do not prevent the valid demo from compiling:

```text
send "SOS"
SEND
DECODE "..--"
```

Required exact output for the main demo: `... --- ... / .... . .-.. .--.`. SOS timing is 27 units with no trailing gap. Every corrected specification example should become a test; prioritize the core cases and known contradictions first, then expand coverage within the remaining time.

## 17. Handoff format and submission contents

Each member's contribution document contains:

1. Owned files and what they do.
2. Input/output records and one concrete example.
3. Algorithm explanation in plain language.
4. Test command, actual result, and known limitations.
5. Commit hashes or PR links.
6. A short demonstration script and instructions for the backup.

Submit source, tests, examples, README, corrected specification, contribution/report files, and one working generated HTML demo. Include the backup recording if the submission format permits. Do not include caches or environments.

Before upload, two teammates extract the exact archive into a new directory, run the README commands and complete test suite, and open the generated player. Another teammate verifies the archive filename and portal receipt. The repository and final package must be accessible to all five members.

**Start instruction for any teammate receiving this file:** read sections 1–7, then your execution card, Git procedure, and gates. After the shared bootstrap, implement and test your component against fixtures immediately; you do not need to wait for another member's implementation.
