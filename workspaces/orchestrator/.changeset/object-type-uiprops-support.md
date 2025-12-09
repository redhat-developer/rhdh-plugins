---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets': minor
---

Add object type support in ui:props for fetch:response:\* properties (RHIDP-11054)

**Type System Enhancement:**

- Updated `UiProps` type to accept `JsonValue` instead of `string` for `fetch:response:*` properties
- Enables using objects, arrays, and other JSON types in ui:props, not just strings
- Maintains full backward compatibility with existing string-based selectors

**Runtime Safety:**

- Added runtime validation in `useTemplateUnitEvaluator` to ensure selectors are strings when evaluated as JSONata expressions
- Provides clear error messages when invalid types are used

**Documentation:**

- Updated `orchestratorFormWidgets.md` to document object type support
- Added examples showing flexible ui:props configurations

This change allows users to reference object attributes more easily in ui:props while maintaining type safety and backward compatibility.
