---
'@red-hat-developer-hub/cli-module-install-dynamic-plugins': patch
---

Report a broken catalog index image as an `InstallException` that names the image: a malformed `manifest.json` or an unreadable layer no longer surfaces as a bare `SyntaxError` or `TAR_BAD_ARCHIVE` error, and a layer listed in the manifest but missing from the download now fails instead of being skipped.
