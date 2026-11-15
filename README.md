# Morse Mail · Signal Studio

A complete educational compiler and browser playground for **MorseScript**. Write SEND/DECODE programs, visually inspect tokens → AST → semantic IR → signal instructions, and play real Morse light/audio output.

## Run locally

Requirements: **Python 3.10+**. No pip install or internet connection is required.

```sh
cd MorseMail
python3 -m morsemail serve
```

Open **http://127.0.0.1:8765**. On Windows use `python` instead of `python3`. Use `--port 8766` after `serve` if the default port is busy. Press Ctrl+C in the terminal to stop the server.

1. Enter source or select an example.
2. Click **Compile message** (or Cmd/Ctrl+Enter).
3. Inspect results and the four interactive compiler stage tabs. Tokens have a stream walkthrough; IR has an expandable word/character map; signal events have a silent simulator with scrubbing. In Syntax tree, select nodes for explanations, collapse branches, zoom/pan, and reveal their source.
4. Click **Play signal**; use Stop, mute, unit duration, tone, or Hide light.
5. Click **Export player** to download a self-contained HTML playback file.

Browsers require a click to activate audio. The compiler is entirely local. The HTTP server binds only to loopback and serves an explicit asset allowlist.

## Language

```text
SEND "SOS HELP"
SEND "Hello World"
DECODE "... --- ..."
DECODE ".../---"
SEND "A/B"
```

Commands are uppercase, arguments are quoted, and each instruction occupies one line. There are no comments or escapes. SEND accepts ASCII letters (case-insensitive), numbers, supported punctuation, and internal spaces. DECODE consumes written Morse, not microphone audio. Word separators are `/`; the literal slash character is encoded as `-..-.`.

Unsupported text, invalid Morse groups, and malformed separators produce errors. One error prevents all executable outputs for that compilation. Editing the source invalidates the previous result and stops playback.

## CLI and offline export

```sh
python3 -m morsemail examples/demo.ms
python3 -m morsemail examples/demo.ms --inspect
python3 -m morsemail examples/demo.ms --json
python3 -m morsemail examples/demo.ms --html output/demo.html
```

Open the generated HTML with a browser and press Play. It embeds its CSS, JavaScript, compiled results, and timing data. CLI exit statuses: 0 success, 1 compilation error, 2 invocation/file error. A failed compile does not overwrite an earlier exported file.

## Tests

```sh
python3 -m unittest discover -s tests -v
node --test tests/test_playback.js tests/test_stages.js tests/test_ast.js tests/test_studio.js tests/test_export.js
```

Node 18+ is optional for the JavaScript visualization/playback tests; it is not required to run the app. Python tests cover compiler phases, the complete pipeline, CLI, exports, API behavior, dictionary checks, and 200 deterministic randomized round trips. Node tests verify clock-based playback scheduling, light state, cancellation, mute, completion, and error handling, plus visual stage rendering, phase gates, empty states, pagination, timing offsets, and text safety. Selection inspectors explain the records; CLI `--inspect` retains the full JSON representation.

See [verification report](docs/TEST_REPORT.md) for actual results and manual verification limits. No test suite can guarantee every possible input or device.

## Five-person handoff

**Start with [FILE_OWNERSHIP.md](docs/FILE_OWNERSHIP.md).** It maps every submission source/test/doc file to exactly one member and includes branch, staging, review, and merge instructions. The JSON manifest is machine-readable.

```sh
python3 scripts/member_files.py --member 1
python3 scripts/member_files.py --check
```

Use `--stage` with a member number only when ready to stage that person's exact files. The helper never commits or pushes. All code was prepared with AI assistance; members should review, understand, test, and accurately describe their work before committing or presenting it.

## Architecture and limits

- [All stage explorers](docs/STAGE_EXPLORERS.md) — navigation, inspectors, source links, walkthroughs, timing simulation, and edge cases.
- [Typography and font credits](docs/FONTS.md) — local fonts, licenses, and offline export.
- [Interactive syntax tree guide](docs/AST_VISUALIZER.md) — selection, inspector, branch controls, zoom/pan, layouts, source highlighting, and large-program navigation.
- [Architecture](docs/ARCHITECTURE.md)
- [Language specification](docs/LANGUAGE_SPECIFICATION.md) — corrected inconsistencies from the initial draft.
- [Member ownership and commits](docs/FILE_OWNERSHIP.md)
- [Test report](docs/TEST_REPORT.md)
- `docs/contributions/` — five implementation notes and presentation cards.

The browser request limit is 64 KiB including JSON overhead. Interactive playback is bounded to 12,000 events; large source can still compile to text. Timing defaults to 100 ms/unit and 600 Hz; a 700 ms runtime pause separates nonempty SEND statements. Dot=1u, dash=3u, element gap=1u, letter gap=3u, word gap=7u. Light rendering follows the audio clock but is limited by screen refresh and background-tab throttling.

No actual email delivery, microphone decoding, hardware controller, account system, or remote hosting is included. Earlier planning documents and their PDF describe the planning stage; this README and ownership guide describe the final implementation.
