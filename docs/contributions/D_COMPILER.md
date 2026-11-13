# Member 4 / D — Code generation, compiler, and local API

## Files

morsemail/codegen.py, morsemail/compiler.py, morsemail/server.py, related tests, CI and ownership helper. The exact complete list is in ../file_ownership.json.

## Implementation

Validated IR becomes canonical notation and timed MARK/GAP events. The compiler suppresses all outputs on failure. The loopback server serializes the same records for the browser and bounds requests.

## Verification

```sh
python3 -m unittest tests.test_codegen tests.test_compiler tests.test_server -v
```

Final suite results and verification limits are in ../TEST_REPORT.md. Run the assigned checks personally before committing.

## Presentation

Show SOS events totaling 27 units and explain 1/3/7 timing. Compile a valid first line followed by an invalid line to show atomic failure.

## Handoff

Review with the rotating reviewer and ensure the backup can run these commands. Fill in your name, actual review changes, test result, commit SHA, and PR URL after doing the work. This prepared implementation used AI assistance; do not claim the generated code was independently written before your review.
