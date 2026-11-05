---
'@red-hat-developer-hub/backstage-plugin-extensions': patch
---

Fixed a race where the plugin/package configuration editor could render empty. The Monaco editor is populated imperatively via `setValue()`, but the lazy-loaded editor can mount after the value is first set, so the write was silently dropped. The value set before mount is now buffered and applied once the editor registers.
