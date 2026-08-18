# Generic header button and icons

## HeaderButton

Displays a button to link a internal or external page.

Example:

```yaml
mountPoints:
  - mountPoint: global.header/component
    importName: HeaderButton
    config:
      priority: 100
```

Config parameters:

| Config key | Description                                                |
| ---------- | ---------------------------------------------------------- |
| `props`    | Required, at least title and to prop needs to be specified |
| `layout`   | Optional CSS                                               |

Props:

| Props              | Description                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `title`            | Required label for the button                                                            |
| `to`               | Required internal or external link                                                       |
| `tooltip`          | Optional                                                                                 |
| `color`            | Optional, one of `inherit`, `primary`, `secondary`, `default`, default is `inherit`      |
| `size`             | Optional, one of `small`, `medium`, `large`, default is `medium`                         |
| `variant`          | Optional, one of `text`, `outlined`, `contained`, default is `text`                      |
| `ariaLabel`        | Optional accessibility label                                                             |
| `startIcon`        | Optional icon, see `HeaderIcon` > `icon` for more information                            |
| `endIcon`          | Optional icon, see `HeaderIcon` > `icon` for more information                            |
| `externalLinkIcon` | Optional boolean, default is `true`. Shows automatically a small icon for external links |

## HeaderIcon

Shows a non-clickable icon in the header.

```yaml
mountPoints:
  - mountPoint: global.header/component
    importName: HeaderIcon
    config:
      priority: 100
```

Config parameters:

| Config key | Description                   |
| ---------- | ----------------------------- |
| `props`    | Required to specific the icon |
| `layout`   | Optional CSS                  |

Props:

| Props       | Description                                                                             |
| ----------- | --------------------------------------------------------------------------------------- |
| `icon`      | The icon can reference a Backstage icon, an inline svg image or a remote icon (url)\*\* |
| `color`     | Optional, one of `inherit`, `primary`, `secondary`, `default`, default is `inherit`     |
| `size`      | Optional, one of `small`, `medium`, `large`, default is `medium`                        |
| `ariaLabel` | Optional accessibility label                                                            |

\*SVG images must start with `<svg`.

\*\*Remote URLs must be accepted in the CSP.

Resolution order:

1. `app.getSystemIcon(icon)` — host or `globalHeaderModule`'s `IconBundleBlueprint` (default extension ids)
2. Inline `<svg>` markup
3. Image URL (`http(s)://`, `/`, or `data:image/`)

Unregistered icon ids render nothing. Register additional ids on the host (e.g. RHDH `CommonIcons` or NFS `IconBundleBlueprint`) or use inline SVG/URLs.

### Global-header system icons

When `globalHeaderModule` is enabled, it registers the following icon ids through
`IconBundleBlueprint` (outlined `@mui/icons-material` components). Use these
string ids in `globalHeader.menuItems`, `globalHeader.components`, mount-point
`icon` props, and anywhere else `HeaderIcon` is used.

| Icon id          | Typical use                           |
| ---------------- | ------------------------------------- |
| `account`        | Profile / my account menu items       |
| `add`            | Create / self-service toolbar actions |
| `article`        | Wiki, documentation links             |
| `bugReport`      | Issue tracker links                   |
| `dashboard`      | Dashboard or visualizer toolbar links |
| `developerHub`   | App launcher / developer hub          |
| `forum`          | Community forum links                 |
| `logout`         | Sign-out actions                      |
| `manageAccounts` | Settings, account management          |
| `quiz`           | FAQ, help menu items                  |
| `support`        | Support menu items                    |

Source of truth: [`globalHeaderSystemIcons.ts`](../../../plugins/global-header/src/icons/globalHeaderSystemIcons.ts).

Example `app-config.yaml`:

```yaml
globalHeader:
  components:
    - title: Visualizer Dashboard
      icon: dashboard
      link: /visualizer/tree
      priority: 75
  menuItems:
    - target: app-launcher
      title: Internal Wiki
      icon: article
      link: https://wiki.internal.example.com
    - target: app-launcher
      title: Issue Tracker
      icon: bugReport
      link: https://issues.internal.example.com
    - target: help
      title: FAQ
      icon: quiz
      link: https://faq.example.com
    - target: help
      title: Community Forum
      icon: forum
      link: https://forum.example.com
```

`dashboard` is also a [Backstage `app-defaults`](https://github.com/backstage/backstage/blob/master/packages/app-defaults/src/defaults/icons.tsx) id; global-header registers an outlined variant for header use. Host icon registration still takes precedence.

Other Backstage default ids (for example `search`, `github`, `catalog`, `kind:component`) remain available via `app.getSystemIcon` without global-header registration. Icons not registered anywhere render nothing.

### Host integration

RHDH loads plugins via Module Federation. **Plugins must not assume the host imported a global icon font.**

| Approach                                                                                                               | Verdict                              |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Host registers icons via `app.getSystemIcon` / `CommonIcons` (OFS) or NFS `IconBundleBlueprint`                        | Preferred                            |
| `globalHeaderModule` registers the [global-header system icons](#global-header-system-icons) via `IconBundleBlueprint` | Automatic when the module is enabled |
| Inline SVG or image URL in config                                                                                      | Supported without host registration  |

For `globalHeader.menuItems[].icon`, prefer ids from the [global-header system icons](#global-header-system-icons) table, other Backstage defaults, host-registered ids (e.g. RHDH `CommonIcons` for `quickstart`), or inline SVG/URLs.

## HeaderIconButton

Shows a clickable icon in the header.

```yaml
mountPoints:
  - mountPoint: global.header/component
    importName: HeaderIconButton
    config:
      priority: 100
```

Config parameters:

| Config key | Description                                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `props`    | Required, at least title and to prop needs to be specified. Title is used as tooltip and for accessability. Both values can be overriden with more specific values. |
| `layout`   | Optional CSS                                                                                                                                                        |

Props:

| Props       | Description                                                                         |
| ----------- | ----------------------------------------------------------------------------------- |
| `title`     | Required information for the button which is used as tooltip and for accessability. |
| `to`        | Required internal or external link                                                  |
| `icon`      | Optional icon, see `HeaderIcon` > `icon` for more information                       |
| `tooltip`   | Optional                                                                            |
| `color`     | Optional, one of `inherit`, `primary`, `secondary`, `default`, default is `inherit` |
| `size`      | Optional, one of `small`, `medium`, `large`, default is `medium`                    |
| `ariaLabel` | Optional accessibility label                                                        |
