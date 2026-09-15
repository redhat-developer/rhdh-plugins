# @red-hat-developer-hub/backstage-plugin-app-defaults

RHDH app module for the **new frontend system**, registered against `pluginId: 'app'`.

The module currently provides:

- Application drawer (`appDrawerExtension`)
- Priority-ordered sidebar (`appSidebarExtension`, extension ID `nav-content:app/sidebar`) that renders `SidebarItemBlueprint`, `SidebarItemGroupBlueprint`, `SidebarElementBlueprint`, `SidebarSpacerBlueprint` and `SidebarDividerBlueprint` contributions from `@red-hat-developer-hub/backstage-plugin-app-react`
- Default sidebar layout: company logo (`sidebar-element:app/logo`, full logo while the sidebar is open and icon logo while collapsed, from `app.branding.fullLogo`, `app.branding.iconLogo` and `app.branding.fullLogoWidth`, with the RHDH logos as fallback), a gap below it (`sidebar-spacer:app/logo`), search modal (`sidebar-element:app/search`), a spacer (`sidebar-spacer:app/bottom`) and divider (`sidebar-divider:app/bottom`) that push a bottom block down, the notifications item (`sidebar-element:app/notifications`), and a divider above the settings area (`sidebar-divider:app/settings`). Disable or move any of them from `app-config.yaml`:

  ```yaml
  app:
    extensions:
      - sidebar-element:app/notifications: false
      - sidebar-spacer:app/bottom:
          config:
            priority: -20
  ```

- Extensible scaffolder template card (`templateCardExtension`)
- Common RHDH icon catalog via `IconBundleBlueprint` (`icon-bundle:app/common`) — same IDs as the legacy `CommonIcons` map (`home`, `group`, `category`, `extension`, `school`, `add`, `developerHub`, …)

## Usage

- **Dynamic loading**: default export is a `FrontendModule` suitable for `@backstage/frontend-dynamic-feature-loader`.
- **Static**: import `appDefaultsModule` from `@red-hat-developer-hub/backstage-plugin-app-defaults`.
