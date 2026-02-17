# Resource Optimization Common

Shared isomorphic code for the redhat-resource-optimization plugin.

## Generating the API client

The client is generated from the Optimizations (ROS) OpenAPI spec. The spec's `info.title` is set to `redhat-resource-optimization` (see [Generating API Clients](https://backstage.io/docs/openapi/generate-client/)). Run from the common package:

```sh
yarn generate-client
```

If a Cost Management reports API OpenAPI spec becomes available, the script in `scripts/generate_client.mjs` can be extended to fetch or merge it.

## Links

- [Resource Optimization front-end plugin](../redhat-resource-optimization/README.md)
