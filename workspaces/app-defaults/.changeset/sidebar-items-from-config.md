---
'@red-hat-developer-hub/backstage-plugin-app-defaults': minor
---

Sidebar items and groups can now be declared in `app-config.yaml` under `app.sidebar.items` and `app.sidebar.groups`. This is the primary way to add remote links and other simple entries without writing a plugin: they accept the same fields as `SidebarItemBlueprint` and `SidebarItemGroupBlueprint` (config items require a `to` link), are merged with the contributed extensions and ordered together by `priority`, and a configured group reusing the `id` of a contributed group (for example `admin`) overrides it.

The same entries can also be split by plugin under `app.sidebar.plugins.<pluginName>`; all of them are flattened into one list. This form is primarily meant for the RHDH dynamic plugin configuration, where each plugin ships its own app-config fragment and arrays would otherwise overwrite each other, and it is used to ship sidebar defaults with some plugins such as the RBAC entry.

For advanced use cases — action items with `onClick`, entries with their own React component, spacers and dividers, or entries a plugin ships together with its pages — use the sidebar blueprints from `@red-hat-developer-hub/backstage-plugin-app-react` instead.
