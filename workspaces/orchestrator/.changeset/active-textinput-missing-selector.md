---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets': patch
---

Avoid hard failures in ActiveTextInput when `fetch:response:value` points to a missing response property. If JSONata resolves to `undefined` or `null`, treat it as an empty string so retriggered dynamic selector edits do not break the form UI.

Wrap JSONata compile and evaluation errors for fetch response selectors: invalid or partial expressions (e.g. lone `.` or `/` while typing) return empty string or empty options where lenient modes apply, and strict callers get clearer `Invalid JSONata` / evaluation error messages. `jsonata:` values in `fetch:body` / `validate:body` that fail to compile or evaluate are skipped instead of breaking the whole request init.

Lenient fetch selectors also treat non-string JSONata results (e.g. numeric literals) as empty. `evaluateFetchResponseSelectorTemplate` stringifies numeric/boolean form values, returns empty for unusable template results, and swallows template parse errors so symbols like `$` or partial input do not crash the widget.
