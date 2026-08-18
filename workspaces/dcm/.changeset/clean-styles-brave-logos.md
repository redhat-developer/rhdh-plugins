---
'@red-hat-developer-hub/backstage-plugin-dcm': patch
---

UI code-quality improvements: replace all inline styles with makeStyles classes, use theme palette tokens (status.ok, error, text) instead of hardcoded colours, merge duplicate style files into a single useDcmStyles hook, add destructive-action styling to delete dialogs, and move RhdhLogoFull/RhdhLogoIcon into the plugin so they can be wired in RHDH without relying on the dev-only app shell.
