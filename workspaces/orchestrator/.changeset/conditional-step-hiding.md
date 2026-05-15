---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': minor
---

Evaluate conditional `ui:hidden` at the wizard step level and add `notContains`/`isNotEmptyList` operators.

Previously, `getSortedStepEntries` only checked for static `ui:hidden: true` when filtering wizard steps. Conditional `ui:hidden` expressions (`anyOf`, `allOf`, `when`/`is`/`isNot`/`isEmpty`) were only evaluated at the individual field level, causing steps with conditional hidden logic to render as empty pages.

Additionally, `evaluateConditionObject` used early-return logic that only evaluated the first matching operator, preventing multiple operators from being combined with AND semantics.

This change:

- Adds `notContains` and `isNotEmptyList` operators to `HiddenConditionObject`
- Refactors `evaluateConditionObject` to AND all specified operators
- Evaluates conditional `ui:hidden` objects at both the step level and the "all properties hidden" level
- Passes `formData` to step filtering so steps react to form data changes
