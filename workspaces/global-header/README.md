# Global Header (migrated)

This workspace has been **removed**. The global header experience now lives in
the **app-defaults** stack:

| What you need                                                | Where it lives                                                                                                                                                        |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default masthead (wrapper, toolbar/menu items, translations) | [`@red-hat-developer-hub/backstage-plugin-app-defaults`](../app-defaults/plugins/app-defaults/README.md#global-header)                                                |
| Extension APIs (blueprints, data refs, hooks)                | [`@red-hat-developer-hub/backstage-plugin-app-react`](../app-defaults/plugins/app-react/README.md#migrating-from-red-hat-developer-hubbackstage-plugin-global-header) |
| Building-block UI (`GlobalHeaderMenuItem`, …)                | `@red-hat-developer-hub/backstage-plugin-app-defaults/global-header-components`                                                                                       |

The standalone package `@red-hat-developer-hub/backstage-plugin-global-header`
is discontinued. Update plugin imports to `app-react` / `app-defaults` as
described in the migration notes linked above. Existing `app-config.yaml`
(`globalHeader.*`, related `app.extensions` overrides) does not need changes.
