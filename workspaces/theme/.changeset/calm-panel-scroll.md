---
'@red-hat-developer-hub/backstage-plugin-theme': minor
---

Replace PageMainContainer with a CSS-only PatternFly page-inset: BackstageSidebarPage is the sole scrollport, clipped with `clip-path` so the scrollbar follows the rounded well (no extra DOM wrapper).
