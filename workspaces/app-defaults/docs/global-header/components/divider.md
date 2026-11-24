# Divider

Shows a small vertical divider.

> **Deprecated:** The `mountPoints` example below targeted the Old Frontend
> System. That integration and the `/legacy` export have been removed. Prefer
> the default `gh-component:global-header/divider` extension via
> [Customize defaults](../new-frontend-system.md#customize-defaults).

```yaml
mountPoints:
  - mountPoint: global.header/component
    importName: Divider
    config:
      priority: 150
```
