---
'@red-hat-developer-hub/backstage-plugin-dcm': patch
---

Disable the Provider Name field when editing an existing provider.

The Name field in the Edit Provider dialog is now read-only. Provider names are
immutable identifiers and should not be changed after creation.
