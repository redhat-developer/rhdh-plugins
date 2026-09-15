# @red-hat-developer-hub/backstage-plugin-app-defaults

RHDH app module for the **new frontend system**, registered against `pluginId: 'app'`.

The module currently provides:

- Application drawer (`appDrawerExtension`)
- Extensible scaffolder template card (`templateCardExtension`)
- Common RHDH icon catalog via `IconBundleBlueprint` (`icon-bundle:app/common`) — same IDs as the legacy `CommonIcons` map (`home`, `group`, `category`, `extension`, `school`, `add`, `developerHub`, …)
- Legacy RHDH **entity page** tabs (ported from [rhdh EntityPage](https://github.com/redhat-developer/rhdh/tree/main/packages/app/src/components/catalog/EntityPage)): Overview (`/`), Api (`/api`, service components), Dependencies (`/dependencies`), Definition (`/definition`, API entities), Diagram (`/system`, systems) via `entityPageExtensions` and `entityPageApiDocsExtensions`

## Usage

- **Dynamic loading**: default export is a `FrontendModule` suitable for `@backstage/frontend-dynamic-feature-loader`.
- **Static**: import `appDefaultsModule` from `@red-hat-developer-hub/backstage-plugin-app-defaults`.
