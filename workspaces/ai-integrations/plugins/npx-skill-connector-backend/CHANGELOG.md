# @red-hat-developer-hub/backstage-plugin-npx-skill-connector-backend

## 0.4.0

### Minor Changes

- b689d69: Add artifact retrieval, SHA-256 verification, and metadata normalization for npx skill-md entries. Discovered entries are fetched through the configured safe transport, verified against their index digest before decoding, and normalized using the shared metadata normalizer. Snapshots are now published with scheduled refresh instead of remaining in loading state.

## 0.3.0

### Minor Changes

- b9eb274: Add bounded discovery of public Agent Skills v0.2 indexes, including pagination, duplicate-name handling, and safe artifact URL validation.

## 0.2.0

### Minor Changes

- 37c4838: Add the npx skill connector backend with public source configuration, a bounded HTTPS fetch helper, and loading snapshots. Source requests are limited to configured HTTPS origins; deployment network policy controls address access. Index retrieval and artifact processing follow in later work.
