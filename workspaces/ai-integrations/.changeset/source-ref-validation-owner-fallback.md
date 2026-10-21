---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider': patch
---

Validate source references before entity mapping and fall back to
configured defaults for invalid owner/lifecycle hints.

Source-reference validation now rejects an entire snapshot when any
record has a malformed OCI URI, a digest mismatch, or an invalid npx
reference — preventing partial entity updates from a corrupt source.

Owner and lifecycle hints are validated as usable Backstage entity
references; nonblank but invalid values (e.g., strings with spaces
or special characters) now fall back to the configured defaults
instead of being used verbatim.
