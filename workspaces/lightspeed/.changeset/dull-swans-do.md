---
'@red-hat-developer-hub/backstage-plugin-lightspeed': patch
---

Replace JSS-based `makeStyles` with an Emotion-based implementation to avoid CSS class name collisions when the Lightspeed plugin loads alongside other plugins. Configure MUI `ClassNameGenerator` with an `ls-` prefix for Lightspeed-owned component class names.
