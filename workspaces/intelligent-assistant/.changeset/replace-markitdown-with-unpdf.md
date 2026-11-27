---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': patch
---

Replace `markitdown-ts` with `unpdf` for AI Notebooks PDF text extraction. The backend no longer depends on the platform-specific `@napi-rs/canvas` binary, so it loads on non-x86-64 architectures, and its install footprint and startup memory are significantly smaller. Unreadable or password-protected PDFs, and PDFs without a text layer, are now rejected with a 400 error that does not include the file content.
