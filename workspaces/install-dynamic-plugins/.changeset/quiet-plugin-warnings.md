---
'@red-hat-developer-hub/cli-module-install-dynamic-plugins': patch
---

Warn once per dynamic plugin entry that uses the deprecated `disabled` field, including entries filtered or overridden during installation. Preserve `enabled` precedence and existing plugin loading behavior.
