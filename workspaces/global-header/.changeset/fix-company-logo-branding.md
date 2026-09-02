---
'@red-hat-developer-hub/backstage-plugin-global-header': patch
---

Honor `app.branding.fullLogo` in the default header by removing hardcoded RHDH logos, resolving branding via `useBrandingFullLogo` in `CompanyLogo` (with types extracted to fix a circular dependency).
