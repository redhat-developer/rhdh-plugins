# Configuration

The Red Hat Developer Hub Global Header can be configured via [dynamic plugins](https://github.com/redhat-developer/rhdh/blob/main/docs/dynamic-plugins/index.md) and [dynamic plugin mount points](https://github.com/redhat-developer/rhdh/blob/main/docs/dynamic-plugins/frontend-plugin-wiring.md).

It is the RHDH default "[application header](https://github.com/redhat-developer/rhdh/blob/main/docs/dynamic-plugins/frontend-plugin-wiring.md#adding-application-header)" implementation that customers can extend or replace.

There are multiple level of extension points (mount points) involved.

1. Red Hat Developer Hub loads all "application headers"
2. The Global Header plugin is loaded by default (it's of only header implementation)
   - The header itself can be extended with additional buttons, dropdowns via dynamic plugins
   - Also the Create and Profile Dropdowns can be extended with additional options

## Disabling the Global Header

The RHDH Global Header can be disabled competely by disabling the right plugin:

```yaml
# Disabling global header
- package: ./dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-global-header
  disabled: true
```

## Replacing the Global Header with your own header

To replace the RHDH Global Header with a completly custom header, the default should be disabled as well (see above).

After that customers can implement and install their own header as a dynamic plugin and include a configuration like this:

```yaml
# Custom header implementation
- package: <npm or oci package-reference>
  disabled: false
  pluginConfig:
    dynamicPlugins:
      frontend:
        <package_name>:
          mountPoints:
            - mountPoint: application/header
              importName: <Header component name>
              config:
                layout:
                  position: above-main-content
```

<!--
## Disable Global Header features

## Add custom components to the Global Header
-->
