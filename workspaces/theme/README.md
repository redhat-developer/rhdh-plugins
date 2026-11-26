# Theme workspace (migrated)

This workspace has been removed. The RHDH theme now lives in the
[`app-defaults`](../app-defaults) plugin:

- Source: [`plugins/app-defaults/src/theme`](../app-defaults/plugins/app-defaults/src/theme)
- Package: `@red-hat-developer-hub/backstage-plugin-app-defaults`
- Docs: [Theme section in the app-defaults README](../app-defaults/plugins/app-defaults/README.md#theme)

Hosts that already load the app-defaults feature loader get the light/dark
theme with no extra import. `app.branding` config is unchanged.

`@red-hat-developer-hub/backstage-plugin-theme` is soft-deprecated; migrate to
app-defaults when ready. Historical source is tagged at
[`@red-hat-developer-hub/backstage-plugin-theme@1.5.2`](https://github.com/redhat-developer/rhdh-plugins/tree/%40red-hat-developer-hub%2Fbackstage-plugin-theme%401.5.2/workspaces/theme)
(see also [ARCHIVED_WORKSPACES.md](../../ARCHIVED_WORKSPACES.md)).
