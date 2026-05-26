---
'@red-hat-developer-hub/backstage-plugin-x2a-backend': patch
---

Replace hardcoded file copies with git-based `copy_changed_files` in the job script. This uses git to detect new and modified files instead of per-phase hardcoded `cp` commands, ensuring no output files are missed. The function always excludes `.x2a-telemetry.json` from copied output.
