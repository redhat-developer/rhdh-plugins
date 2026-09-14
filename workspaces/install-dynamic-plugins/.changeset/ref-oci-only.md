---
'@red-hat-developer-hub/cli-module-install-dynamic-plugins': minor
---

Restrict `ref://` resolution to OCI packages in include files.

**BREAKING CHANGES**

`ref://` no longer resolves to `https://`, `http://`, or `./` packages from
include files. `extractPluginName()` is OCI-only, so only `oci://` entries
are indexed for lookup. Configurations that relied on `ref://` resolving to
non-OCI packages must use an explicit package URL instead.
