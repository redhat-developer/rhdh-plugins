---
'@red-hat-developer-hub/cli-module-install-dynamic-plugins': patch
---

Report a broken catalog index image as an `InstallException` that names the image: a malformed `manifest.json` (invalid JSON, or not an object with a `layers` array) or an unreadable layer no longer surfaces as a bare `SyntaxError`, `TypeError` or `TAR_BAD_ARCHIVE` error. A layer entry with no usable digest, a layer listed in the manifest but missing from the download, or a digest that resolves outside the download directory now fails before any layer is extracted instead of being skipped.
