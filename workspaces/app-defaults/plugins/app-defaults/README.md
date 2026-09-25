# @red-hat-developer-hub/backstage-plugin-app-defaults

RHDH app module for the **new frontend system**, registered against `pluginId: 'app'`.

The module provides:

- Application drawer (`appDrawerExtension`)
- Priority-ordered sidebar (`appSidebarExtension`, extension ID `nav-content:app/sidebar`) that renders `SidebarItemBlueprint`, `SidebarItemGroupBlueprint`, `SidebarElementBlueprint`, `SidebarSpacerBlueprint` and `SidebarDividerBlueprint` contributions from `@red-hat-developer-hub/backstage-plugin-app-react`
- Default sidebar layout: company logo (`sidebar-element:app/logo`, full logo while the sidebar is open and icon logo while collapsed, from `app.branding.fullLogo`, `app.branding.iconLogo` and `app.branding.fullLogoWidth`, with the RHDH logos as fallback), a gap below it (`sidebar-spacer:app/logo`), search modal (`sidebar-element:app/search`), a spacer (`sidebar-spacer:app/bottom`) and divider (`sidebar-divider:app/bottom`) that push a bottom block down, the notifications item (`sidebar-element:app/notifications`), a divider above the settings area (`sidebar-divider:app/settings`), an Administration group (`sidebar-item-group:app/admin`, id `admin`) that only appears once a plugin contributes an item with `group: 'admin'`, and a Settings group (`sidebar-item-group:app/settings`, id `settings`) linking to `/settings` at the very bottom. Disable or move any of them from `app-config.yaml`:

  ```yaml
  app:
    extensions:
      - sidebar-element:app/notifications: false
      - sidebar-spacer:app/bottom:
          config:
            priority: -20
  ```

- Sidebar items and groups declared in `app-config.yaml` under `app.sidebar`, merged with the contributed ones (see [Sidebar items from app-config](#sidebar-items-from-app-config))
- Extensible scaffolder template card (`templateCardExtension`)
- Common RHDH icon catalog via `IconBundleBlueprint` (`icon-bundle:app/common`) — same IDs as the legacy `CommonIcons` map (`home`, `group`, `category`, `extension`, `school`, `add`, `developerHub`, …)
- **Plugin overrides** (via the default feature loader) for catalog, catalog-graph, API docs, TechDocs, and scaffolder — including empty-state pages and **RHDH catalog entity page defaults** (see below)
- Learning Paths page at `/learning-paths` (`learningPathsModule`) with proxy-backed data and static JSON fallback

## Customizing Learning Paths

Learning Paths loads card data from the Developer Hub proxy:

`{proxyBaseUrl}{developerHub.proxyPath || '/developer-hub'}/learning-paths`

Configure the proxy in `app-config.yaml`. This is the supported way to deliver customized content in production. See also the [RHDH customizing guide](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/customizing_red_hat_developer_hub/customize-the-learning-paths-in-rhdh_customizing-rhdh).

#### Hosted JSON file (recommended)

Publish your JSON to a web server (GitHub, GitLab, or internal HTTP), then point the proxy at it:

```yaml
proxy:
  endpoints:
    '/developer-hub':
      target: https://raw.githubusercontent.com/
      pathRewrite:
        '^/api/proxy/developer-hub/learning-paths': '/redhat-developer/rhdh/release-1.10/packages/app/public/learning-paths/data.json'
      changeOrigin: true
      secure: true
```

Replace `target` and the `pathRewrite` value with your hosted JSON location. An example default file is at [redhat-developer/rhdh learning-paths/data.json](https://raw.githubusercontent.com/redhat-developer/rhdh/release-1.10/packages/app/public/learning-paths/data.json).

If you also configure the Home page or Tech Radar through the same `/developer-hub` proxy, add the `learning-paths` `pathRewrite` **before** broader rules such as `'^/api/proxy/developer-hub'`.

#### Customization service

For a dedicated backend that serves Learning Paths JSON:

```yaml
proxy:
  endpoints:
    '/developer-hub/learning-paths':
      target: ${LEARNING_PATH_DATA_URL}
      changeOrigin: true
      secure: true
```

Set `LEARNING_PATH_DATA_URL` to your service endpoint (for example `http://rhdh-customization-provider/learning-paths`).

#### Optional proxy mount override

If your proxy endpoint uses a path other than `/developer-hub`:

```yaml
developerHub:
  proxyPath: /custom-hub
```

The frontend then requests `{proxyBaseUrl}/custom-hub/learning-paths`.

#### Fallback when the proxy is unavailable

When the proxy request fails, the page uses bundled demo data from `src/learning-paths/data/data.json` (included in the plugin bundle at build time).

## Sidebar items from app-config

`app-config.yaml` is the primary way to add remote links and other simple sidebar entries: a link to an external site or to a page that is already part of the app, optionally placed inside a group, without writing a plugin. `app.sidebar.items` and `app.sidebar.groups` accept the same fields as `SidebarItemBlueprint` and `SidebarItemGroupBlueprint`, except that config items cannot carry an `onClick` handler and therefore must have a `to` link (groups may omit it). The entries are merged with the contributed ones and ordered together by `priority`:

```yaml
app:
  sidebar:
    items:
      # Top-level entry, rendered among the plugin pages (priority 0).
      - title: Docs
        icon: school
        to: https://example.com/docs
      # Joins the Administration group shipped by app-defaults; only shown
      # when a page is registered at /audit-log.
      - title: Audit log
        icon: security
        to: /audit-log
        group: admin
        requiresRoute: true
      - title: Grafana
        to: /grafana
        group: tools
    groups:
      # New group collecting the items above with `group: tools`.
      - id: tools
        title: Tools
        icon: extension
        priority: -5
        variant: flyout
      # Same id as a contributed group: overrides its title, icon, link,
      # priority or variant instead of adding a second group.
      - id: admin
        title: Admin area
```

`icon` is the key of a system icon registered via `IconBundleBlueprint` (for example the common RHDH icons `home`, `category`, `school`, `extension`); unknown keys fall back to a generic icon. Items with `group` render inside the group with that `id`, regardless of whether the group comes from config or from an extension; items whose group does not exist render at the top level.

### Per-plugin entries

The same `items` and `groups` can also be declared under `app.sidebar.plugins.<pluginName>`; all of them are flattened into one list together with the top-level entries. This form is primarily meant for the RHDH dynamic plugin configuration, where each plugin ships its own app-config fragment: arrays in Backstage config replace each other instead of merging, so several plugins declaring `app.sidebar.items` would overwrite each other, while separate `plugins.<pluginName>` keys merge cleanly. RHDH uses it to ship sidebar defaults together with some plugins, for example the RBAC entry in the Administration group:

```yaml
app:
  sidebar:
    plugins:
      rbac:
        items:
          - title: RBAC
            icon: admin
            to: /rbac
            group: admin
            requiresRoute: true
```

A group declared at the top level of `app.sidebar` overrides a plugin group with the same `id`, which in turn overrides a contributed group.

For advanced use cases — items that run an action instead of navigating (`onClick`), entries with their own React component, spacers and dividers, or entries a plugin ships together with its pages — use the sidebar blueprints from `@red-hat-developer-hub/backstage-plugin-app-react` instead: `SidebarItemBlueprint`, `SidebarItemGroupBlueprint`, `SidebarElementBlueprint`, `SidebarSpacerBlueprint` and `SidebarDividerBlueprint`. See [Contributing Sidebar Items and Groups](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/app-defaults/plugins/app-react/README.md#contributing-sidebar-items-and-groups) and [Contributing Custom Sidebar Elements](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/app-defaults/plugins/app-react/README.md#contributing-custom-sidebar-elements) in the app-react README.

## Usage

- **Dynamic loading**: default export is a `FrontendModule` suitable for `@backstage/frontend-dynamic-feature-loader`.
- **Static**: import `appDefaultsModule` from `@red-hat-developer-hub/backstage-plugin-app-defaults`.

Override entry points (for advanced installs):

| Export                            | Role                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `./catalog-plugin-override`       | Catalog index empty state, overview layout, Dependencies / System Diagram tabs, card attachments |
| `./catalog-graph-plugin-override` | Graph empty state, RHDH relations graph cards                                                    |
| `./api-docs-plugin-override`      | API docs empty state, definition card hidden on Overview, API cards on Dependencies              |
| `./scaffolder-plugin-override`    | Scaffolder empty state                                                                           |
| `./docs-plugin-override`          | TechDocs empty state                                                                             |

## Catalog entity pages (NFS)

When this package’s **default feature loader** is enabled (`appDefaultsFeatureLoader` from the package root export), catalog entity pages follow **RHDH 1.10–style** NFS composition **without** extra `app.extensions` YAML. Adopters can still override individual extensions in `app.extensions` if needed.

### Overview layout

- Extension: `entity-content-layout:catalog/rhdh` on `entity-content:catalog/overview`
- **Info** cards (About, Links) → **left** column — `type: info` is set in `catalog-plugin-override`, not in app config
- **Content** cards (default / `type: content`) → **right** column
- Full-width warnings for orphan, relation, and processing errors (same as upstream)

Optional override (only if you need to change defaults):

```yaml
app:
  extensions:
    - entity-card:catalog/about:
        config:
          type: info
```

### Extra entity tabs

| Tab            | Extension id                                         | Entities    | Notes                                      |
| -------------- | ---------------------------------------------------- | ----------- | ------------------------------------------ |
| Dependencies   | `entity-content:catalog/rhdh-component-dependencies` | `component` | NFS-composed from entity cards (see below) |
| System Diagram | `entity-content:catalog/rhdh-system-diagram`         | `system`    | Custom tab body (legacy RHDH diagram)      |

Stock Backstage tabs (Documentation group, Kubernetes, etc.) are unchanged.

### Cards moved off Overview

These **stock** extension IDs stay enabled but are **re-attached** to the Dependencies tab (`entity-content:catalog/rhdh-component-dependencies`) via plugin overrides — they no longer appear on Overview:

- `entity-card:catalog/depends-on-components`
- `entity-card:catalog/depends-on-resources`
- `entity-card:catalog/has-subcomponents`
- `entity-card:api-docs/consumed-apis`
- `entity-card:api-docs/provided-apis`

To show one of these on Overview again, override its attachment back to `entity-content:catalog/overview` in your app (or fork the override).

### Disabled or replaced on Overview

| Extension                                                         | Default behavior                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `entity-card:catalog-graph/relations`                             | Hidden via factory filter; restore with `config.useOriginalFactory: true` |
| `entity-card:catalog-graph/rhdh-overview-relations`               | Overview graph for **API** and **System** only                            |
| `entity-card:catalog-graph/rhdh-component-dependencies-relations` | Dependencies graph for **components** only                                |
| `entity-card:api-docs/definition`                                 | Hidden via factory filter; restore with `config.useOriginalFactory: true` |

Optional tuning (height, direction):

```yaml
app:
  extensions:
    - entity-card:catalog-graph/rhdh-overview-relations:
        config:
          height: 500
```

### Reverting to stock Backstage NFS entity UX

1. **Overview columns only**: disable `entity-content-layout:catalog/rhdh` (exact disable syntax depends on your app’s extension config; omit the layout extension from app-defaults by not loading `catalogPluginOverride`, or override with stock layout).
2. **Stock relations card**: restore the original factory and disable both `rhdh-*-relations` extensions:

```yaml
app:
  extensions:
    - entity-card:catalog-graph/relations:
        config:
          useOriginalFactory: true
    - entity-card:catalog-graph/rhdh-overview-relations: false
    - entity-card:catalog-graph/rhdh-component-dependencies-relations: false
```

3. **API Definition card on Overview**: restore the stock factory (Definition tab content is unchanged):

```yaml
app:
  extensions:
    - entity-card:api-docs/definition:
        config:
          useOriginalFactory: true
```

4. **Overview cards**: remove card attachment overrides by not loading app-defaults catalog / api-docs overrides, or re-attach cards to Overview in your own overrides.
5. **Tabs**: disable `entity-content:catalog/rhdh-component-dependencies` and `entity-content:catalog/rhdh-system-diagram` in `app.extensions`.

Reference: [Migrating entity pages to the new frontend system](https://github.com/redhat-developer/rhdh/blob/main/docs/dynamic-plugins/migrating-entity-pages-to-the-new-frontend-system.md) (RHDH product docs).

### Manual test plan

Use the app-defaults workspace dev app (`yarn start` in `workspaces/app-defaults`) and example catalog entities.

| Check                  | Steps                                    | Expected                                                                 |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| RHIDP-16564 AC         | Open a **component** → **Overview**      | About (and Links) in the **left** column                                 |
| Component overview     | **component** → Overview                 | No depends-on / subcomponent / consumed-provided API cards               |
| Component Dependencies | **component** → **Dependencies**         | Graph on the left; dependency and API list cards on the right            |
| API overview           | **api** → Overview                       | Relations graph on the right; no API **Definition** card                 |
| API Definition         | **api** → Documentation → **Definition** | Definition content present                                               |
| System overview        | **system** → Overview                    | Relations graph on the right                                             |
| System Diagram         | **system** → **System Diagram**          | Diagram tab content loads                                                |
| Group / User           | **group** or **user** → Overview         | About left; no duplicate org profile cards on overview (verify visually) |

## Links

- [Backstage new frontend system](https://backstage.io/docs/plugins/new-frontend-system/)
- [Entity cards and layouts (catalog-react)](https://backstage.io/docs/features/software-catalog/software-catalog-overview#entity-pages)
