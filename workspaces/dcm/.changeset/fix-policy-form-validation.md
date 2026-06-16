---
'@red-hat-developer-hub/backstage-plugin-dcm': patch
---

Fix policy form validation for Description and Priority fields, normalize enabled
checks, and reject whitespace-only required fields.

- Add a 255-character max-length Yup rule to the Description field, with inline error
  feedback matching the Display Name pattern (validation error on blur rather than
  hard-blocking input at the DOM level).
- Add `.integer()` and `.required()` Yup rules to the Priority field so decimal values
  (e.g. 500.5) and an empty field are rejected with an explicit error message instead of
  silently coercing to an integer or defaulting to 500.
- Add `step={1}` to the Priority number input and block `.`/`e`/`E` characters via
  `onKeyDown` and `onChange` guards to prevent decimal strings from bypassing the Yup
  integer check through JavaScript's `Number()` coercion.
- Update the Priority label to "Priority \*" to indicate it is a required field.
- Update the Priority helper text to surface the API uniqueness constraint
  (priority must be unique per policy type) so users are informed before hitting a 409.
- Normalize the three inconsistent `enabled` checks in `PoliciesTabContent` to
  `p.enabled ?? true` so the Enabled column, Actions toggle, and edit form all agree
  when `enabled` is undefined.
- Add `.trim()` to the `display_name` and `rego_code` Yup rules so whitespace-only
  values are rejected client-side instead of passing validation and being silently
  rejected by the API after submit.
