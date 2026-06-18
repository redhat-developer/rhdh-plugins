---
name: safe-retry
description: >-
  Guards against infinite retry loops when the agent introduces syntax or
  parse errors during edits. Requires diagnosis before retrying any failing
  command and enforces hard stop thresholds.
---

# Safe Retry

When a test, build, or lint command fails after you edited code, the error
is most likely YOUR fault — not a pre-existing issue or a flaky test. Before
retrying any failing command, you MUST follow the diagnosis steps below.

**This skill overrides any instinct to "just retry."**

## Diagnosis before retry

After every test/build/lint failure:

1. **Read the full error output.** Identify the failing file and line number.
2. **Check if the failing file is one you edited.** If yes, the error is
   self-inflicted. Fix the file first — do not retry the command.
3. **Classify the error.** Syntax errors, parse errors, unexpected token
   errors, and import/export resolution errors are almost always caused by
   incomplete edits (e.g., renaming a symbol in one place but not updating
   its import, or breaking a multi-line statement).

## Hard rules

- **Never retry the same command without changing code first.** If a command
  failed, running it again without edits will produce the same failure. This
  includes variations like `yarn test`, `yarn backstage-cli package test`,
  and `yarn backstage-cli package test --no-cache` — these are the same
  command with different flags, not different fixes.
- **After 2 consecutive test failures, STOP and diagnose.** Re-read every
  file you edited. Diff your changes against the original. Look for broken
  imports, unclosed brackets, missing commas, and partial renames. Fix the
  root cause before running tests again.
- **After 3 total test failures across the entire run, produce structured
  output with `tests_passed: false` and stop.** Do not commit broken code.
  The post-script will report the failure and a human can intervene.

## Common self-inflicted errors

| Error pattern                                   | Likely cause                                       | Fix                                                 |
| ----------------------------------------------- | -------------------------------------------------- | --------------------------------------------------- |
| `SyntaxError: Unexpected token`                 | Incomplete edit broke the AST                      | Read the file around the error line; fix the syntax |
| `Unexpected token, expected "from"`             | Broke an `import` statement (e.g., partial rename) | Check all `import`/`export` lines in the file       |
| `Module '"./foo"' has no exported member 'Bar'` | Renamed an export but didn't update imports        | Find all files importing `Bar` and update them      |
| `Cannot find module './foo'`                    | Renamed or moved a file but didn't update imports  | Grep for the old path and fix references            |
| `TypeError: X is not a function`                | Changed a function signature or export             | Check callers                                       |
