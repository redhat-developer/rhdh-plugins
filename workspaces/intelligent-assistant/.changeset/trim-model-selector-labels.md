---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': patch
---

Ellipsize long model names and the current-page chip from available message-bar width (context chip keeps priority when both are present) and show the full name in a tooltip when truncated. The chat header selector now displays the model label instead of the raw value.

Raise the delete-conversation modal backdrop z-index so it covers the host app masthead; the header no longer stays bright while the rest of the page is dimmed.
