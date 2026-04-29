# Global Header

Red Hat Developer Hub includes a configurable and highly extensible global header plugin starting with RHDH 1.5.

By default it includes a Search input field, Create, Starred[^1], Support[^2] and Notifications[^3] icon buttons and a user profile dropdown.

The plugin supports two integration modes:

- **New Frontend System** -- Extension blueprints (`GlobalHeaderComponentBlueprint`, `GlobalHeaderMenuItemBlueprint`) allow any plugin to contribute toolbar items and dropdown menu items. See the [New Frontend System Guide](new-frontend-system.md) for full details, including architecture, code examples, and API reference.
- **Legacy Mount Points** -- Dynamic plugin mount points for traditional Backstage apps. See [Configuration](configuration.md).

Deployers can also add menu items directly via `app-config.yaml` without writing any plugin code. See [Config-Driven Menu Items](new-frontend-system.md#config-driven-menu-items).

[^1]: Only when an entity is starred.
[^2]: Only when the Support URL is configured in the `app-config.yaml`.
[^3]: Only when the notifications plugin is installed.
