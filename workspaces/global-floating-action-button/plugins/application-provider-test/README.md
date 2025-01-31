# @red-hat-developer-hub/backstage-plugin-application-provider-test

A test-plugin allows you to test the [dynamic plugin mount point `application/provider`](https://github.com/redhat-developer/rhdh/blob/main/docs/dynamic-plugins/frontend-plugin-wiring.md#adding-application-providers).

These providers allows dynamic plugins to add a `React.Context` on an application level around all routes. Using this feature should be an exception.

This plugin exports two providers, two components that depends on the context of these providers and a page that renders these cards two times to see that a shared provider context is used correctly.

```yaml
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-application-provider-test:
      dynamicRoutes:
        - path: /application-provider-test-page
          importName: TestPage
      mountPoints:
        - mountPoint: application/provider
          importName: CrashProvider
        - mountPoint: application/provider
          importName: TestProviderOne
        - mountPoint: application/provider
          importName: TestProviderTwo
```
