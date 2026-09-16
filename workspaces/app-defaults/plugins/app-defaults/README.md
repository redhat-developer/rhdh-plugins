# @red-hat-developer-hub/backstage-plugin-app-defaults

RHDH app module for the **new frontend system**, registered against `pluginId: 'app'`.

The module provides:

- Application drawer (`appDrawerExtension`)
- Extensible scaffolder template card (`templateCardExtension`)
- Common RHDH icon catalog via `IconBundleBlueprint` (`icon-bundle:app/common`) — same IDs as the legacy `CommonIcons` map (`home`, `group`, `category`, `extension`, `school`, `add`, `developerHub`, …)
- **Plugin overrides** (via the default feature loader) for catalog, catalog-graph, API docs, TechDocs, and scaffolder — including empty-state pages and **RHDH catalog entity page defaults** (see below)

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

| Tab            | Extension id                                 | Entities    | Notes                                      |
| -------------- | -------------------------------------------- | ----------- | ------------------------------------------ |
| Dependencies   | `entity-content:catalog/rhdh-dependencies`   | `component` | NFS-composed from entity cards (see below) |
| System Diagram | `entity-content:catalog/rhdh-system-diagram` | `system`    | Custom tab body (legacy RHDH diagram)      |

Stock Backstage tabs (Documentation group, Kubernetes, etc.) are unchanged.

### Cards moved off Overview

These **stock** extension IDs stay enabled but are **re-attached** to the Dependencies tab (`entity-content:catalog/rhdh-dependencies`) via plugin overrides — they no longer appear on Overview:

- `entity-card:catalog/depends-on-components`
- `entity-card:catalog/depends-on-resources`
- `entity-card:catalog/has-subcomponents`
- `entity-card:api-docs/consumed-apis`
- `entity-card:api-docs/provided-apis`

To show one of these on Overview again, override its attachment back to `entity-content:catalog/overview` in your app (or fork the override).

### Disabled or replaced on Overview

| Extension                                               | Default behavior                                |
| ------------------------------------------------------- | ----------------------------------------------- |
| `entity-card:catalog-graph/relations`                   | Disabled in `catalog-graph-plugin-override`     |
| `entity-card:catalog-graph/rhdh-overview-relations`     | Overview graph for **API** and **System** only  |
| `entity-card:catalog-graph/rhdh-dependencies-relations` | Dependencies graph for **components** only      |
| `entity-card:api-docs/definition`                       | Hidden on Overview (`api-docs-plugin-override`) |

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
2. **Stock relations card**: set `entity-card:catalog-graph/relations: true` (or remove `false`) and disable both `rhdh-*-relations` extensions.
3. **Overview cards**: remove card attachment overrides by not loading app-defaults catalog / api-docs overrides, or re-attach cards to Overview in your own overrides.
4. **Tabs**: disable `entity-content:catalog/rhdh-dependencies` and `entity-content:catalog/rhdh-system-diagram` in `app.extensions`.

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
