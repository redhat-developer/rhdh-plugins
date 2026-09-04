---
'@red-hat-developer-hub/backstage-plugin-scorecard': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-common': patch
---

Skip scalar aggregation threshold coloring when no successful samples contributed (`total` is 0); return a null display color and keep the card grey fallback.
