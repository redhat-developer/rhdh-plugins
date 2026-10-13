---
'@red-hat-developer-hub/backstage-plugin-x2a-backend': patch
---

Fix init/analyze/migrate jobs crashing when the source repo's `.gitignore` matches x2a output. The job script detected changed files with `git ls-files --others --exclude-standard`, which applied the source repo's ignore rules and dropped x2a-generated files (e.g. `generated-project-metadata.json` under a `*.json` rule) from the copy, causing a later `cat generated-project-metadata.json` to exit 1. The listing no longer applies `--exclude-standard`, so all untracked x2a output is copied regardless of the source repo's `.gitignore` (the source ignore rules have no authority over the separate target repo). Removed the now-obsolete gitignore warning block.
