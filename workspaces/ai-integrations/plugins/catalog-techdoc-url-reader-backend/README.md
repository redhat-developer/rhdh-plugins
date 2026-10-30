# catalog-techdoc-url-reader

This plugin backend provides implementations around the [URL Readers](https://backstage.io/docs/backend-system/core-services/url-reader) extension point of Backstage's Core Services. We introduce the extension via a Backstage service factory, per the documentation.

Our new URL Reader here allows for TechDoc generation to access a REST API provided by the RHDH Model Catalog Bridge. This allows AI Platform Engineers to leverage AI Model Cards provided by Red Hat OpenShift AI (RHOAI) as the TechDocs for the AI Models that the RHDH Model Catalog Bridge imports into the Backstage Catalog included with RHDH.

Coupled with our `URLReaderService` implementation is also an customized implementation of the Backstage `UrlReaderServiceReadTreeResponse` interface. This implemenation both
facilitates customization of how the Model Catalog Bridge REST APIs for TechDocs are accessed, and allows for future customization of the final TechDoc compilation, in the event we want to augment the RHOAI Model Cards to leverage the varioud Backstage TechDoc extensions and addons.

## Installation

This plugin is installed via the `@@red-hat-developer-hub/backstage-plugin-catalog-techdoc-url-reader-backend` package. To install it to your backend package, run the following command:

```bash
# From your root directory
yarn --cwd packages/backend add @@red-hat-developer-hub/backstage-plugin-catalog-techdoc-url-reader-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(
  import(
    '@@red-hat-developer-hub/backstage-plugin-catalog-techdoc-url-reader-backend'
  ),
);
```

## OCI Skill Documentation URL Reader

In addition to model-card TechDocs, this plugin reads OCI skill documentation
from configured connector destinations.

### Configuration

Skill documentation sources are read from the
`catalog.providers.skillsCatalogProvider` config section. Only sources with
`sourceType: 'oci'` are matched:

```yaml
catalog:
  providers:
    skillsCatalogProvider:
      production:
        sources:
          - connectorPluginId: skill-image-connector
            sourceId: quay-public
            sourceType: oci
```

### URL pattern

At service initialization, the reader resolves each configured OCI connector's
base URL through Backstage discovery. The synchronous predicate and direct
`readUrl` calls require that exact origin (scheme, host, and port) and the full
discovered base pathname. For example:

```text
https://rhdh.example/prefix/api/skill-image-connector/skilldocs/<sourceId>/<digest>
```

The `/prefix/api/skill-image-connector` base is preserved; `/api/<pluginId>` is
not hardcoded. Only trailing slashes on the discovered base are normalized. No
additional destination configuration is required. Directly constructed readers
must receive trusted connector bases; without them, skill documentation is not
matched. Normal backend registration supplies these bases automatically.

where `<digest>` is a `sha256:<64 hex chars>` OCI manifest digest. URLs
with query strings, fragments, URL credentials, extra path segments, or
invalid digest formats are rejected. Each route segment is decoded once;
malformed percent encoding is rejected without throwing from reader selection.
Skill-documentation routes cannot fall through to legacy model-card substring
matching, including when source IDs contain `modelcard`. Untrusted destinations
are rejected before obtaining or sending a service token.

The reader authenticates with the connector plugin via
`auth.getPluginRequestToken`, rejects redirects without forwarding service
tokens, and propagates `404` as `NotFoundError` and `304` as
`NotModifiedError`. The connector's response `ETag` is passed through for
TechDocs caching. Conditional reads use explicit revalidation cache mode so Node
fetch does not force a full 200 response instead of the connector's matching 304.
A successful skill-docs response without a nonblank ETag is a
protocol error; the reader does not invent a validator or silently use an empty
one. Model-card requests also reject redirects; their existing ETag behavior is
preserved.

## Development

This plugin backend can be started in a standalone mode from directly in this
package with `yarn start`. It is a limited setup that is most convenient when
developing the plugin backend itself.

If you want to run the entire project, including the frontend, run `yarn dev` from the root directory.
