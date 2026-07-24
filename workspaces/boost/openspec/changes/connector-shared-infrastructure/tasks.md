# Tasks: Cross-Connector Shared Infrastructure

## 1. CA Bundle Resolution Utility (P0) — RHIDP-15329

- [ ] 1.1 Create `@red-hat-developer-hub/backstage-plugin-boost-connector-utils` package with `package.json`, TypeScript config, and README
- [ ] 1.2 Define `loadCaBundle(connectorConfig: Config): Buffer | undefined` function signature — caller passes the Config subtree containing the `tls` block
- [ ] 1.3 Implement caFile resolution — read CA from `tls.caFile` within the provided Config subtree
- [ ] 1.4 Implement caSecret resolution — read CA from `tls.caSecret.$env` within the provided Config subtree
- [ ] 1.5 Add per-connector config isolation — each connector resolves its own Config nesting before calling `loadCaBundle()` (e.g., MCP passes `config.getConfig('catalog.providers.mcpRegistry')`, RHOAI passes `config.getConfig('catalog.providers.rhoai.mcpCatalog')`, OCI passes per-registry Config node)
- [ ] 1.6 Create `https.Agent` factory utility: `createHttpsAgent(caBundle?: Buffer): https.Agent | undefined`
- [ ] 1.7 Handle missing CA file: log WARN-level warning with expected file path, return `undefined` (don't crash)
- [ ] 1.8 Handle invalid/expired CA certificate: log ERROR with certificate details (issuer, expiry), return `undefined`
- [ ] 1.9 Support CA certificate chains (concatenated PEM blocks)
- [ ] 1.10 Unit tests: CA loaded from file path
- [ ] 1.11 Unit tests: CA loaded from environment variable ($env pattern)
- [ ] 1.12 Unit tests: Missing CA file returns undefined with warning log
- [ ] 1.13 Unit tests: Invalid PEM data returns undefined with error log
- [ ] 1.14 Unit tests: Multiple PEM blocks (certificate chain) parsed correctly
- [ ] 1.15 Unit tests: Per-connector config isolation (two connectors with different CA files)

## 2. Fault Isolation Wrapper (P0) — RHIDP-15330

- [ ] 2.1 Define `ConnectorErrorContext` interface: `connectorId`, `endpoint`, `errorType`, `errorMessage`, `retryable`, `nextRetryAt`
- [ ] 2.2 Create `createProviderWrapper(provider: EntityProvider, logger: LoggerService): EntityProvider` function
- [ ] 2.3 Implement try/catch wrapper around provider `connect()` via `createProviderWrapper()` to catch unhandled rejections
- [ ] 2.4 Implement `createSafeRefresh()` — try/catch wrapper around scheduled refresh callback to catch unhandled rejections
- [ ] 2.5 Implement structured error logging with connector context fields
- [ ] 2.6 Log errors via Backstage `LoggerService` for structured JSON output
- [ ] 2.7 Ensure wrappers do NOT rethrow errors — allow catalog backend to continue
- [ ] 2.8 Verify Backstage entity bucket isolation per provider (documentation + integration test)
- [ ] 2.9 Unit test: Provider crash logs structured error and does not rethrow
- [ ] 2.10 Unit test: Multiple providers can fail independently without cascading errors
- [ ] 2.11 Unit test: Error log includes all required context fields (connectorId, endpoint, errorType, etc.)

## 3. Enable/Disable Pattern (P0) — RHIDP-15330

- [ ] 3.1 Define enable/disable config schema in README: `catalog.providers.<id>.enabled: boolean`
- [ ] 3.2 Create `isConnectorEnabled(config: Config, connectorId: string): boolean` utility
- [ ] 3.3 Implement config reader: return `true` if `enabled` is omitted (default enabled)
- [ ] 3.4 Create registration guard pattern for backend module `init()` example in README
- [ ] 3.5 Log INFO-level message when connector is disabled: `"<Connector Name> connector is disabled"`
- [ ] 3.6 Verify disabled connector uses zero resources: no scheduled tasks, no HTTP client, no cache allocation
- [ ] 3.7 Unit test: `isConnectorEnabled()` returns `true` when `enabled: true`
- [ ] 3.8 Unit test: `isConnectorEnabled()` returns `false` when `enabled: false`
- [ ] 3.9 Unit test: `isConnectorEnabled()` returns `true` when `enabled` field is omitted (default)
- [ ] 3.10 Unit test: Disabled connector skipped during module registration (mock `catalog.addEntityProvider()`)

## 4. Package and Documentation (P1)

- [ ] 4.1 Export shared utilities from `src/index.ts`: `loadCaBundle`, `createHttpsAgent`, `createProviderWrapper`, `createSafeRefresh`, `isConnectorEnabled`, `ConnectorErrorContext`
- [ ] 4.2 Document app-config schema for CA bundle config in README with YAML examples
- [ ] 4.3 Document enable/disable pattern in README with backend module example
- [ ] 4.4 Document structured error logging pattern in README with example `ConnectorErrorContext` usage
- [ ] 4.5 Create example app-config snippets for MCP Registry connector (caFile + enabled)
- [ ] 4.6 Create example app-config snippets for RHOAI connector (caSecret with $env + enabled)
- [ ] 4.7 Create example app-config snippets for OCI Skill connector
- [ ] 4.8 Add JSDoc comments for all exported functions

## 5. Integration Testing (P1)

- [ ] 5.1 Integration test: CA bundle loaded from mounted file in k8s-like environment (use temp file as mock)
- [ ] 5.2 Integration test: CA bundle loaded from environment variable ($env pattern)
- [ ] 5.3 Integration test: `https.Agent` created with custom CA and used in axios HTTP client
- [ ] 5.4 Integration test: Provider failure contained — other providers unaffected (mock two providers, crash one)
- [ ] 5.5 Integration test: Disabled connector skipped entirely on startup (mock backend module registration)
- [ ] 5.6 Integration test: Structured error log produced when provider crashes (assert log fields)

## 6. Reference App-Config YAML (P1) — RHIDP-15266

- [ ] 6.1 Create reference `app-config.yaml` snippet demonstrating: configurable endpoint URL, CA bundle reference, Secret-based credentials, sync schedule
- [ ] 6.2 Include MCP Registry connector example: mirror endpoint, custom CA, K8s Secret auth
- [ ] 6.3 Include RHOAI connector example: cross-cluster endpoint, MCP catalog toggle, Secret ref
- [ ] 6.4 Include OCI Skill connector example: multi-registry config, pull secret, namespace filtering
- [ ] 6.5 Document each config field with inline comments explaining purpose and valid values
- [ ] 6.6 Add air-gapped deployment variant showing zero-internet configuration
- [ ] 6.7 Place reference YAML in `workspaces/boost/examples/` or alongside connector README files

## 7. Connector Integration (P2)

- [ ] 7.1 Update MCP Registry connector to consume `@red-hat-developer-hub/backstage-plugin-boost-connector-utils`
- [ ] 7.2 Update RHOAI connector to consume `@red-hat-developer-hub/backstage-plugin-boost-connector-utils`
- [ ] 7.3 Update OCI Skill connector to consume `@red-hat-developer-hub/backstage-plugin-boost-connector-utils`
- [ ] 7.4 Verify all three connectors use consistent CA bundle loading pattern
- [ ] 7.5 Verify all three connectors use consistent enable/disable config
- [ ] 7.6 Verify all three connectors use consistent structured error logging
