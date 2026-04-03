---
'@red-hat-developer-hub/backstage-plugin-lightspeed': minor
'@red-hat-developer-hub/backstage-plugin-lightspeed-backend': minor
---

Added the MCP servers selector/settings feature in Lightspeed with backend
integration for listing servers, per-user token updates, and validation.

In the settings panel, users can review server status, enable or disable
eligible servers, configure personal tokens, and get inline token validation
feedback. Token validation now runs automatically after typing stops and shows
success (`Connection successful`) or error (`Authorization failed. Try again.`)
before save.
