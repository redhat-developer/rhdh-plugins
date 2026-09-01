<!-- After each completed task, commit the changes. -->
<!-- Group 1 scaffolds the plugin; Group 2 (config) and Group 3 (registry client) can
     proceed in parallel once scaffolding lands; Group 4 (provider wiring) depends on
     2+3; Group 5 (mapping integration) depends on 4 and on the sibling
     mcp-registry-server-mapping change's transform being available; Group 6 verifies. -->

## 1. Plugin Scaffolding & Packaging

- [ ] 1.1 Create the backend `catalog-backend-module` plugin package (Backstage catalog-backend-module naming convention) with `package.json`, `tsconfig`, and lint config matching the workspace's plugin conventions
- [ ] 1.2 Add the `createBackendModule` skeleton that registers against `catalogProcessingExtensionPoint`, depending on `coreServices` (`rootConfig`, `logger`, `scheduler`)
- [ ] 1.3 Document installation in the plugin `README.md` (add via `backend.add(...)`, minimal app-config example)

## 2. Configuration

- [ ] 2.1 Author `config.d.ts` declaring `catalog.providers.mcpRegistry.<id>` with `baseUrl` (required), `apiVersion?` (default `v1`), `schedule?` (`SchedulerServiceTaskScheduleDefinitionConfig`), and `defaultOwner?`
- [ ] 2.2 Implement config reading: parse `catalog.providers.mcpRegistry` as a keyed map into a typed per-instance config array; register nothing (no error) when the key is absent
- [ ] 2.3 Implement validation with actionable errors that name the offending instance `<id>` (fail fast when `baseUrl` is missing); apply the `apiVersion` default (`v1`) and the documented default schedule when omitted
- [ ] 2.4 Add unit tests for config parsing/validation: single instance, multiple instances, missing `baseUrl`, and absent-config no-op

## 3. Registry Client & Pagination

- [ ] 3.1 Define the registry API response types (`servers[]`, `metadata.count`, `metadata.nextCursor`) and the `server.json` extraction from each `servers[]` entry (`.server`)
- [ ] 3.2 Implement servers-endpoint URL construction `<baseUrl>/<apiVersion>/servers` with slash normalization (works with and without a trailing slash on `baseUrl`)
- [ ] 3.3 Implement cursor pagination: loop passing prior `metadata.nextCursor` as the `cursor` query param until it is absent/empty, accumulating all `servers[]`; treat cursors as opaque
- [ ] 3.4 Implement the pagination loop safeguard (max-pages/total bound + repeated-cursor detection) that fails the run rather than looping forever
- [ ] 3.5 Implement registry-error handling (unreachable host, non-2xx status, unparseable body) raising a typed error that aborts the run
- [ ] 3.6 Add unit tests for the client using mocked HTTP: single page, multi-page traversal, empty/absent cursor termination, opaque-cursor passthrough, and error/ safeguard cases

## 4. Entity Provider & Scheduling

- [ ] 4.1 Implement the `EntityProvider` class: `getProviderName()` = `mcp-registry-provider:<id>`, `connect()` storing the connection, and a `run()` performing one sync
- [ ] 4.2 Wire scheduling via `SchedulerService.createScheduledTaskRunner(schedule)` per instance, honoring `initialDelay`; register one provider per configured `<id>`
- [ ] 4.3 Implement the full-mutation commit: on successful sync call `connection.applyMutation({ type: 'full', entities })`; on a failed run emit no mutation (preserve prior catalog state)
- [ ] 4.4 Attach provider attribution to each entity (managed-by-location annotation / `locationKey`) so entities are scoped to this provider instance for pruning
- [ ] 4.5 Add unit tests: full mutation contents, pruning of removed servers across two syncs, updated server reflected, and no-mutation-on-failed-run

## 5. Mapping Integration

- [ ] 5.1 Depend on the sibling `mcp-registry-server-mapping` transform and invoke it per accumulated server, passing the instance's `defaultOwner` as the caller-override owner default (never reimplement the mapping)
- [ ] 5.2 Implement per-entry failure isolation: catch a mapping rejection (e.g. missing required `server.json` field), log an actionable message identifying the entry, skip it, and continue the run
- [ ] 5.3 Add integration tests over sample `server.json` inputs → produced `mcp-server` `API` entities, asserting `spec.owner` reflects `defaultOwner` (and the mapping default `unknown` when omitted), and that one bad entry does not abort the batch

## 6. End-to-End Verification & Docs

- [ ] 6.1 Add an end-to-end test wiring config → mocked paginated registry → mapping → full mutation, asserting the mutation converges to the registry's current server set
- [ ] 6.2 Verify produced entities pass the upstream `mcp-server` `API` entity schema (`McpServerApiEntity`) — reusing the mapping change's conformance expectations
- [ ] 6.3 Verify the apiVersion discrepancy handling: default `v1` requests `<baseUrl>/v1/servers` and an override (`v0`) is honored, with a documented note for operators
- [ ] 6.4 Finalize `README.md` / config docs: full `catalog.providers.mcpRegistry.<id>` example (baseUrl, apiVersion, schedule, defaultOwner), pagination behavior, and error-handling semantics
- [ ] 6.5 Run the workspace lint, typecheck, and test suite; ensure the new package builds and passes CI conventions
