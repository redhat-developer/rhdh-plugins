---
'@red-hat-developer-hub/backstage-plugin-theme': patch
---

Fix main content incorrectly picking up the sidebar background. Set the page shell to `appBarBackgroundColor` so the page inset matches the global header; keep main content on `mainSectionBackgroundColor`.
