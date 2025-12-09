---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': minor
---

Fix custom widgets not rendering in dependencies+oneOf (RHIDP-10952)

**Widget Rendering Fix:**

- Fix `generateUiSchema` to extract `ui:` properties from `dependencies` + `oneOf` branches
- Custom widgets (ActiveTextInput, ActiveDropdown, etc.) now render correctly in conditional schemas
- Resolves issue where widgets fell back to plain text inputs inside dependencies

**Form Data Management:**

- Update `pruneFormData` to correctly handle oneOf schemas with dependencies
- Clean up stale form data when switching between oneOf options
