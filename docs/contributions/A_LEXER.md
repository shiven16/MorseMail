# Member 1 / A — Source and lexer

## Files

morsemail/contracts.py, morsemail/lexer.py, tests/test_lexer.py. The exact complete list is in ../file_ownership.json.

## Implementation

Source becomes located SEND/DECODE/STRING/NEWLINE/EOF tokens. Tabs use 8-column stops, CRLF is one newline, and raw string values are retained. Unsupported printable text passes to semantics.

## Verification

```sh
python3 -m unittest tests.test_lexer -v
```

Final suite results and verification limits are in ../TEST_REPORT.md. Run the assigned checks personally before committing.

## Presentation

Show tokens for SEND "SOS"; then demonstrate lowercase command and unterminated quote errors.

## Handoff

Review with the rotating reviewer and ensure the backup can run these commands. This prepared implementation used AI assistance; do not claim the generated code was independently written before your review.

- **Name:** Pranay Sarkar ([@Zakuroooo](https://github.com/Zakuroooo))
- **Commit:** 457fde89ff8f2772c8ec149c06440c539edb22b5
- **PR:** https://github.com/shiven16/MorseMail/pull/1 (merged into main)
- **Test result:** `python3 -m unittest tests.test_lexer -v` passed 9 of 9 tests from a clean clone of main on 2026-11-06.
- **Review changes:** None. The files were committed as prepared.
- **Member 2 review:** Pending.
- **Backup check (Member 5):** Pending.
