# Member 3 / C — Semantic analysis

## Files

morsemail/morse.py, morsemail/semantic.py, tests/test_semantic.py, docs/ARCHITECTURE.md. The exact complete list is in ../file_ownership.json.

## Implementation

A single 54-entry forward dictionary defines the repertoire. Analysis builds validated word/group IR, normalizes ASCII case, scans Morse with source offsets, and distinguishes a literal slash from a word separator.

## Verification

```sh
python3 -m unittest tests.test_semantic -v
```

Final suite results and verification limits are in ../TEST_REPORT.md. Run the assigned checks personally before committing.

## Presentation

Show HELLO WORLD IR, DECODE SOS, and reject ..--. Explain why valid syntax can still be semantically invalid.

## Handoff

Review with the rotating reviewer and ensure the backup can run these commands. Fill in your name, actual review changes, test result, commit SHA, and PR URL after doing the work. This prepared implementation used AI assistance; do not claim the generated code was independently written before your review.
