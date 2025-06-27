---
'@red-hat-developer-hub/backstage-plugin-global-header': minor
---

**BREAKING**: The `CompanyLogo` prop `logoWidth` has been renamed to `width`.

Allow configuring `width` and `height` for `CompanyLogo` via configuration. When `width` is not specified, `CompanyLogo` will now fall back to using the value from `app.branding.fullLogoWidth`.
