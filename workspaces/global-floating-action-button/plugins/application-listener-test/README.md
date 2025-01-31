# @red-hat-developer-hub/backstage-plugin-application-listener-test

A test-plugin allows you to test the [dynamic plugin mount point `application/listener`](https://github.com/redhat-developer/rhdh/blob/main/docs/dynamic-plugins/frontend-plugin-wiring.md#adding-application-listeners).

This listener allows dynamic plugins to add non-UI related features that could (optionally) track the current location.

This test-plugin exports a `CrashListener` to verify that a listener couldn't crash the complete app.

And a `LocationListener` that will log any URL change to the browser console.

```yaml
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-application-listener-test:
      mountPoints:
        - mountPoint: application/listener
          importName: CrashListener
        - mountPoint: application/listener
          importName: LocationListener
```
