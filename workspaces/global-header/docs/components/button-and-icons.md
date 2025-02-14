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

\*\*Please note that remote URLs must be accepted in the CSP.

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
| `tooltip`   | Optional                                                                            |
| `color`     | Optional, one of `inherit`, `primary`, `secondary`, `default`, default is `inherit` |
| `size`      | Optional, one of `small`, `medium`, `large`, default is `medium`                    |
| `ariaLabel` | Optional accessibility label                                                        |
