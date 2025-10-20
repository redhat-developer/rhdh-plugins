# Changelog for `@openshift/dynamic-plugin-sdk-webpack`

## 3.0.1 - 2023-04-13

- Fix bug in `DynamicRemotePlugin` that occurs with webpack `createChildCompiler` usage ([#213])
- Support CommonJS build output and improve generated Lodash imports ([#215])

## 3.0.0 - 2023-03-02

- Add base URL for plugin assets to plugin manifest ([#206])
- Make `DynamicRemotePlugin` options `pluginMetadata` and `extensions` mandatory ([#207])
- Replace `DynamicRemotePlugin` option `moduleFederationLibraryType` with `moduleFederationSettings` ([#199])
- Allow building plugins which do not provide any exposed modules ([#199])

## 2.0.0 - 2023-01-23

- Support building plugins using webpack library type other than `jsonp` ([#182])
- Emit error when a separate runtime chunk is used with `jsonp` library type ([#182])
- Allow customizing the filename of entry script and plugin manifest ([#182])
- Ensure that all APIs referenced through the package index are exported ([#184])

## 1.0.0 - 2022-10-27

> Initial release.

[#182]: https://github.com/openshift/dynamic-plugin-sdk/pull/182
[#184]: https://github.com/openshift/dynamic-plugin-sdk/pull/184
[#199]: https://github.com/openshift/dynamic-plugin-sdk/pull/199
[#206]: https://github.com/openshift/dynamic-plugin-sdk/pull/206
[#207]: https://github.com/openshift/dynamic-plugin-sdk/pull/207
[#213]: https://github.com/openshift/dynamic-plugin-sdk/pull/213
[#215]: https://github.com/openshift/dynamic-plugin-sdk/pull/215
