---
'@red-hat-developer-hub/cli-module-install-dynamic-plugins': patch
---

Report a malformed `manifest.json` or an unreadable layer in a catalog index image as an `InstallException` that names the image, instead of a bare `SyntaxError` or `TAR_BAD_ARCHIVE` error.
