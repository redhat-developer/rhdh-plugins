---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': minor
---

Add dynamic conditional visibility for ui:hidden

**Conditional Hiding Feature:**

- Add `HiddenCondition` type supporting boolean and condition objects
- Implement `evaluateHiddenCondition` utility for evaluating hide conditions
- Support condition objects with `when`, `is`, `isNot`, and `isEmpty` operators
- Support composite conditions with `allOf` (AND) and `anyOf` (OR) logic
- Support nested field paths using dot notation (e.g., `config.server.port`)
- Update `HiddenFieldTemplate` to dynamically evaluate hide conditions based on form data
- Update `generateReviewTableData` to respect conditional hiding in review pages
- Hidden field visibility updates in real-time when form data changes

**Condition Object Patterns:**

- `{ when: "field", is: "value" }` - Hide when field equals value
- `{ when: "field", is: ["val1", "val2"] }` - Hide when field equals any value (OR)
- `{ when: "field", isNot: "value" }` - Hide when field does NOT equal value
- `{ when: "field", isEmpty: true }` - Hide when field is empty
- `{ allOf: [...] }` - Hide when ALL conditions are true (AND)
- `{ anyOf: [...] }` - Hide when ANY condition is true (OR)

**Documentation:**

- Update `orchestratorFormWidgets.md` with comprehensive examples of conditional hiding
- Add examples for all condition patterns and composite conditions
- Include complete real-world deployment configuration example

**Testing:**

- Add comprehensive unit tests for condition evaluation
- Test simple conditions, composite conditions, and nested conditions
- Test edge cases (empty values, nested paths)
