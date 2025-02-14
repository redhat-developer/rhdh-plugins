# Spacer

A horizontal spacer that grows as much as possible/needed.

Multiple spacer could be configured.

```yaml
mountPoints:
  - mountPoint: global.header/component
    importName: Spacer
    config:
      priority: 150
      props:
        growFactor: 1
        minWidth: 1
```

Optional props:

| Props        | Description                                                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `growFactor` | Optional grow factor which is only used when multiple spacers are configured.                                                                                    |
| `minWidth`   | Optional number or string to specfify a minimum width. Numbers uses a theme-like width (multiplied with 8), strings like `16px` will be passed to the CSS layout |
