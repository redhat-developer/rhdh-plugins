---
'@red-hat-developer-hub/cli-module-install-dynamic-plugins': minor
---

Resolve `{{inherit}}` references by the final OCI image name across registry
hosts and namespaces, matching the operator. After lookup, use the included
plugin's concrete package for existing merge and enable/disable behavior.

Detect ambiguous same-level image-name collisions with a clear error while
preserving explicit `!plugin-path` overrides and multi-plugin image entries.
