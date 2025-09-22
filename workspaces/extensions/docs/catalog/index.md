# Catalog entities

## Relationships

In alignment to [Backstage BEP-0009: Plugin Metadata](https://github.com/backstage/backstage/blob/master/beps/0009-plugin-metadata/README.md):

- [Plugins](./plugins.md) are the Extensions 'user facing' entities with a title, icon and markdown description. A plugin contains one mor more packages or modules.
- [Packages](./packages.md) are installable npm packages. This includes frontend, backend plugins and modules.
- [Collections](./collections.md) are curated lists for plugins.

The relationship model is mostly unidirectional.

```
[Collections] === hasPart ==> [Plugins] === hasPart ==> [Packages]
```

The catalog entities allows referencing the child/parent from entities (YAMLs) and multiple relationships are allowed and expected.

Different collections will can link a single Plugin.

Plugins will reference 'their own' Packages in the most cases. But it is possible to reference the same package from multiple Plugins.

```
  Kubernetes Plugin ==> Kubernetes Backend Package
                    ==> Kubernetes Frontend Package

    Tekton   Plugin ==> Kubernetes Backend Package
                    ==> Tekton Frontend Package
```
