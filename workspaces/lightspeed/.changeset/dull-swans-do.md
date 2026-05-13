---
'@red-hat-developer-hub/backstage-plugin-lightspeed': patch
---

Replace JSS-based makeStyles with emotion-based implementation to fix CSS class name collisions when lightspeed plugin is loaded alongside other plugins. Added MUI ClassNameGenerator with `ls-` prefix for
