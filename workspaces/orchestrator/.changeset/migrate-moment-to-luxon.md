---
'@red-hat-developer-hub/backstage-plugin-orchestrator': patch
---

Migrate from Moment.js to Luxon for date/time handling

**Breaking Change:** Removed deprecated Moment.js dependency

- Replace `moment` and `react-moment` with `luxon` for all date/time operations
- Add `formatDuration` utility function that mimics moment's `.humanize()` behavior
- Add comprehensive unit tests for duration formatting
