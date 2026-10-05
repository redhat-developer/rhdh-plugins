---
'@red-hat-developer-hub/backstage-plugin-theme': patch
---

Drop the page-inset top margin when a full-width global header sits above the content well, size the well to `100vh − header − bottom inset` so the bottom margin stays visible, and paint shell chrome with the RHDH page-inset background unless overridden in app branding theme config.
