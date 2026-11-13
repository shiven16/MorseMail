# Final implementation: five-member file ownership and commits

This is the active handoff for the completed project. Earlier blueprints describe planning; **the actual file list below and `file_ownership.json` govern staging and responsibility now**. Replace member numbers with real names in your team notes. No commits or pushes have been made by the assistant.

The whole app is implemented and tested locally. Members receive a complete working snapshot so they can run it independently, review their assigned components, improve/document them, and commit only their assigned files. These assignments describe review and maintenance responsibility for AI-assisted code; do not present them as proof of work already performed by a particular student.

## Component map

| Member | Own component | Core files | Reviewer / backup |
|---|---|---|---|
| **1 / A** | Shared records, lexer, source positions | `contracts.py`, `lexer.py`, package/test markers, lexer tests | Member 2 reviews; Member 5 backs up |
| **2 / B** | Grammar, parser, language specification, examples | `parser.py`, parser tests, examples, specification and historical planning documents | Member 3 reviews; Member 1 backs up |
| **3 / C** | Repertoire, semantic checks, validated IR | `morse.py`, `semantic.py`, semantic tests, architecture doc | Member 4 reviews; Member 2 backs up |
| **4 / D** | Text/signal code generation, compiler, local API | `codegen.py`, `compiler.py`, `server.py`, their tests, ownership helper/manifest and verification report | Member 5 reviews; Member 3 backs up |
| **5 / E** | Browser UI, audio/light runtime, CLI, exports | `web/*`, `player.py`, `cli.py`, `__main__.py`, their tests, README, CI and ignore rules | Member 1 reviews; Member 4 backs up |

Each member also owns exactly one file under `docs/contributions/`. These contain implementation notes, verification commands, and a presentation card. One owner per file prevents overlapping edits; reviewers and backups share understanding and completion responsibility.

## Exact file lists

The machine-readable manifest is `docs/file_ownership.json`. Do not infer ownership from a directory when a manifest exists.

```sh
python3 scripts/member_files.py --member 1
python3 scripts/member_files.py --member 2
python3 scripts/member_files.py --member 3
python3 scripts/member_files.py --member 4
python3 scripts/member_files.py --member 5
python3 scripts/member_files.py --check
```

The last command verifies that every submission source, test, example, workflow, and doc file is assigned exactly once. Generated output, `.git`, caches, and `tmp` are excluded intentionally.

## How all five work independently

1. Keep a master copy of the complete verified folder or submission ZIP available to everyone.
2. Each teammate uses **their own clone and their own working directory**. Never have five people switch branches in the same checkout.
3. Start from the same agreed base commit. Clone the repository, then copy the supplied snapshot into that clone **without replacing its `.git` directory**. All implementation files are locally available for running/tests, even while most remain uncommitted on that person's branch.
4. Create your branch. Review your owned files and the contracts. Run your checks using the full local snapshot. Add any real fixes or explanatory notes to your owned files.
5. Stage only the files listed for your member number. Other prepared files remain unstaged/untracked; do not accidentally include them.
6. Review the staged diff, commit under your own identity, and push your branch. Open a PR to the agreed assembly branch.

Because everyone has the full snapshot, nobody waits for another member's implementation to develop or test locally. Git assembly still has real dependencies: partial branches are not the complete runnable app. Do not claim a partial PR is a clean-checkout build until the five parts have been assembled.

### Example for Member 1 (replace 1 in every applicable place)

```sh
git switch -c feat/member-1-lexer
python3 -m unittest tests.test_lexer -v
python3 scripts/member_files.py --member 1
python3 scripts/member_files.py --member 1 --stage
git diff --cached --stat
git diff --cached
git commit -m "Add source records and MorseScript lexer with tests"
git push -u origin feat/member-1-lexer
```

`--stage` only runs `git add` on that member's explicit manifest list. It never commits, changes authorship, or pushes. On Windows, use `python` instead of `python3`.

Suggested commit titles:

- Member 1: `Add source records and MorseScript lexer with tests`
- Member 2: `Add grammar parser, corrected specification, and examples`
- Member 3: `Add Morse repertoire and semantic validation with round-trip tests`
- Member 4: `Add code generation, compiler orchestration, and local API`
- Member 5: `Add signal studio UI, playback, CLI, exports, and CI`

Do not run `git add .`, `git commit -a`, force-push shared branches, or delete another person's uncommitted files. Before pushing, ensure your staged files match your list. Members can make multiple genuine incremental commits rather than one large commit.

If someone has already committed the whole implementation, do not rewrite shared history to manufacture five authors. Use the ownership map for real subsequent review, fixes, and documentation contributions instead.

## Checks for each member

| Member | Required command |
|---|---|
| 1 | `python3 -m unittest tests.test_lexer -v` |
| 2 | `python3 -m unittest tests.test_parser -v` |
| 3 | `python3 -m unittest tests.test_semantic -v` |
| 4 | `python3 -m unittest tests.test_codegen tests.test_compiler tests.test_server -v` |
| 5 | `python3 -m unittest tests.test_player tests.test_cli -v` and `node --test tests/test_playback.js tests/test_stages.js tests/test_ast.js tests/test_studio.js tests/test_export.js` |

All members also run the app, load the full demo, and explain their stage. Tests intentionally include real neighbor modules to catch integration regressions; the complete local snapshot provides these without waiting for remote merges.

## Shared integration, no sole integrator

Create an assembly branch from the common base. Any authorized teammate may create it, review or merge a PR, run checks, package, or submit. Use the review cycle 2→1, 3→2, 4→3, 5→4, 1→5.

Merge in the natural dependency order **1 → 2 → 3 → 4 → 5**. Members can implement/review/push in parallel; the final assembly order does not make one person responsible for all integration. Keep commits intact with merge commits or rebase merges where permitted by repository settings. Member 5's CI file arrives last, when all components exist.

Each receiving owner validates their boundary with its sending owner:

- 1 + 2: token stream → AST.
- 2 + 3: AST → semantic IR.
- 3 + 4: IR → notation/events.
- 4 + 5: API result → UI/player/CLI.
- 5 + 1: visible diagnostics → source spans.

After assembly, **two different teammates** run the complete checks from a clean clone/extracted ZIP:

```sh
python3 -m unittest discover -s tests -v
node --test tests/test_playback.js tests/test_stages.js tests/test_ast.js tests/test_studio.js tests/test_export.js
python3 scripts/member_files.py --check
python3 -m morsemail examples/demo.ms --html output/demo.html
python3 -m morsemail serve
```

Run the demo manually and confirm physical audibility on the presentation laptop. `TEST_REPORT.md` distinguishes actual verified behavior from remaining environment/device checks. The configured CI workflow is supplied but has not been run on GitHub during this local build.

## Changes that could cause clashes

- `contracts.py`: freeze after Member 1's commit. Propose any signature changes in the team chat; affected module owners agree before the owning member edits it.
- `web/app.js` and `web/player.js`: both belong to Member 5, even though Member 4 reviews signal timing. Member 4 changes Python lowering only.
- Specification: Member 2 edits it. Other members report inconsistencies rather than independently patching it.
- Ownership manifest/verification report: Member 4 edits them after collecting results from everyone.
- README: Member 5 edits it. Each member writes longer notes in their own contribution file.
- Generated HTML, screenshots, PDF planning exports, caches, and ZIPs: generated artifacts, excluded from source commits. A submission coordinator may attach them to the final package without changing source ownership.

## Final package and submission

The prepared ZIP contains source, tests, docs, examples, and an offline demo HTML. It intentionally excludes Git metadata, machine environments, and temporary files. Do not commit the ZIP into the repository.

Any two members can build/check the final package, another two can extract and verify it, and any teammate with authorized portal access can upload. Another member confirms the uploaded filename and receipt. If the portal limits upload access to one student, arrange an allowed backup early; do not share account credentials or assume another account can submit.

Fill in member names and actual PR/commit links in your contribution notes after review and commits. The goal is disjoint edits, shared verification, and honest, traceable contributions.

## Complete per-member staging lists

The lists below are copied from the manifest so this document can be shared by itself.

### Member 1: Lexer and shared records

```text
docs/contributions/A_LEXER.md
morsemail/__init__.py
morsemail/contracts.py
morsemail/lexer.py
tests/__init__.py
tests/test_lexer.py
```

### Member 2: Parser, language and examples

```text
docs/LANGUAGE_SPECIFICATION.md
docs/ONE_DAY_PLAN.md
docs/PROJECT_GUIDE.md
docs/TEAM_EXECUTION_BLUEPRINT.md
docs/contributions/B_PARSER.md
examples/demo.ms
examples/lexical_error.ms
examples/semantic_error.ms
examples/syntax_error.ms
morsemail/parser.py
tests/test_parser.py
```

### Member 3: Semantics and repertoire

```text
docs/ARCHITECTURE.md
docs/contributions/C_SEMANTICS.md
morsemail/morse.py
morsemail/semantic.py
tests/test_semantic.py
```

### Member 4: Code generation, compiler and API

```text
docs/FILE_OWNERSHIP.md
docs/TEST_REPORT.md
docs/contributions/D_COMPILER.md
docs/file_ownership.json
morsemail/codegen.py
morsemail/compiler.py
morsemail/server.py
scripts/member_files.py
tests/test_codegen.py
tests/test_compiler.py
tests/test_server.py
```

### Member 5: Frontend, playback, CLI and export

```text
.github/workflows/tests.yml
.gitignore
README.md
docs/AST_VISUALIZER.md
docs/FONTS.md
docs/STAGE_EXPLORERS.md
docs/contributions/E_PLAYER_CLI.md
morsemail/__main__.py
morsemail/cli.py
morsemail/player.py
morsemail/web/app.js
morsemail/web/ast.js
morsemail/web/export.js
morsemail/web/fonts/Manrope-OFL.txt
morsemail/web/fonts/PlexMono-OFL.txt
morsemail/web/fonts/manrope.ttf
morsemail/web/fonts/plex-mono.ttf
morsemail/web/index.html
morsemail/web/player.js
morsemail/web/stages.js
morsemail/web/studio.js
morsemail/web/styles.css
tests/dom_stub.js
tests/test_ast.js
tests/test_cli.py
tests/test_export.js
tests/test_playback.js
tests/test_player.py
tests/test_stages.js
tests/test_studio.js
```
