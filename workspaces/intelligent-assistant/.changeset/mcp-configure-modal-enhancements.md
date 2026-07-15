---
'@red-hat-developer-hub/backstage-plugin-lightspeed': minor
'@red-hat-developer-hub/backstage-plugin-lightspeed-backend': patch
---

Refactor the MCP server configure modal with PatternFly layout and improved credential management:

- Add **Use organization default token** / **Use personal token** radio selectors when an app-config default token is available, replacing the remove-personal-token flow
- Show server status, tools list, and enabled toggle with local draft state applied on Save
- Hide the tools section when the server is disabled; keep status consistent while drafting an unverified personal token
- Disable Save after a failed token validation until the input changes
- Auto-enable the server after a successful personal token save
- Add sortable **Name** and **Status** columns to the MCP servers table, with always-visible sort icons (gray when inactive, directional when active)
- Keep the DCR configure modal aligned with personal-token servers (status, tools, enabled toggle, and Save/Cancel) with an additional DCR info alert and no token input
- Show **Fetching status...** in the Status section while server tools/status are loading
- Bump `@patternfly/react-core` to 6.6.0 and add translations for new modal strings (de, es, fr, it, ja)

The backend now exposes `hasOrgToken` on MCP server list and patch responses so the UI can distinguish organization default tokens from personal-only servers.
