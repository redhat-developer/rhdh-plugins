# User customization

There is an **dev preview** alternative that allow users to customize the home page theirself.

To enable this you must configure the home-page plugin and replace the default HomePage implemention with this mountpoint:

```yaml
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-dynamic-home-page:
      dynamicRoutes:
        - path: /
          importName: DynamicCustomizableHomePage
```
