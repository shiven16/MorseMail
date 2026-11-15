# Member 5 / E — Frontend, runtime, CLI, and export

## Files

morsemail/web/, morsemail/player.py, morsemail/cli.py, morsemail/__main__.py, related tests and README. The exact complete list is in ../file_ownership.json.

## Implementation

The editor calls the real compiler. The shared studio now covers token walkthroughs, an expandable semantic IR graph, a silent signal simulator, source annotation, and a bundled offline typography system. Export embeds fonts and licenses. The interactive AST module adds selectable nodes, a source-linked educational inspector, branch controls, pan/zoom, automatic/manual layouts, keyboard navigation, and large-program culling/jump controls. Request IDs reject stale responses; editing invalidates results. A shared audio clock drives scheduled tones and lamp state. The CLI and browser can export a self-contained playback file.

## Verification

```sh
python3 -m unittest tests.test_player tests.test_cli -v
node --test tests/test_playback.js tests/test_stages.js tests/test_ast.js tests/test_studio.js tests/test_export.js
```

Final suite results and verification limits are in ../TEST_REPORT.md. Run the assigned checks personally before committing.

## Presentation

Load the full demo, inspect tabs, play/stop, toggle mute and hide light, export HTML, and explain the browser click requirement.

## Handoff

Review with the rotating reviewer and ensure the backup can run these commands. Fill in your name, actual review changes, test result, commit SHA, and PR URL after doing the work. This prepared implementation used AI assistance; do not claim the generated code was independently written before your review.
