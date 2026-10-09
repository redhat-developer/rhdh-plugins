---
'@red-hat-developer-hub/backstage-plugin-scorecard': patch
---

Drive the entity Scorecard tab Masonry column count from the tab content width (ResizeObserver) instead of viewport breakpoints, so cards densify without gaps and reflow when a docked app drawer (e.g. Quickstart) is open.
