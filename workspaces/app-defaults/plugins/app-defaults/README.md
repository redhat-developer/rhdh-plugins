# @red-hat-developer-hub/backstage-plugin-app-defaults

RHDH app module for the **new frontend system**, registered against `pluginId: 'app'`.

The module currently provides:

- Application drawer (`appDrawerExtension`)
- Extensible scaffolder template card (`templateCardExtension`)
- Common RHDH icon catalog via `IconBundleBlueprint` (`icon-bundle:app/common`) — same IDs as the legacy `CommonIcons` map (`home`, `group`, `category`, `extension`, `school`, `add`, `developerHub`, …)
- Learning Paths page at `/learning-paths` (`learningPathsModule`) with proxy-backed data and static JSON fallback

Learning paths are loaded from `{proxyBaseUrl}{developerHub.proxyPath || '/developer-hub'}/learning-paths`. Override the proxy mount with `developerHub.proxyPath` in `app-config.yaml` when needed.

## Usage

- **Dynamic loading**: default export is a `FrontendModule` suitable for `@backstage/frontend-dynamic-feature-loader`.
- **Static**: import `appDefaultsModule` from `@red-hat-developer-hub/backstage-plugin-app-defaults`.
