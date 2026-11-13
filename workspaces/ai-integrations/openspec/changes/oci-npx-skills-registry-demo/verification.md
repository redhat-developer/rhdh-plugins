# Task 6.5: OCI skill TechDocs verification

## Scope and test boundaries

This matrix combines the focused 6.5 additions with the regression suites shipped
by tasks 2.x, 4.x and 6.1–6.4. Tests do not need to duplicate every existing case.
The combined path in `SkillsCatalogProvider.techdocs.test.ts` exercises real
annotated, tar and tar+gzip extraction, normalization, a running authenticated
connector HTTP backend, SQLite content storage, a file-backed provider store,
provider annotations/acknowledgments, native fetch, and reader-generated MkDocs
files. Only registry manifest/blob I/O and processed Catalog API visibility are
fixtures. It does not run a full catalog processing worker or invoke `mkdocs build`.
The prior task 6.4 maintainer check rendered SKILLS.md for both imported OCI skills
in the running application; that manual result is distinct from automated coverage.

The provider's two added development dependencies allow tests to compose the public
connector and reader features. They do not add production dependencies. The new
reader patch changeset covers the only production correction: conditional skill
reads explicitly use revalidation cache mode so Node fetch does not send the
cache-control header that suppresses Express's 304 response. Public APIs and
model-card behavior are unchanged. The combined test failed before that correction
and passed afterward; no test-only fetch shim remains.

## Automated evidence map

Paths below are relative to `workspaces/ai-integrations/plugins/`.

| Task 6.5 requirement                                                  | Evidence                                                                                                                                             | Boundary or assertion                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Equivalent annotated/tar/tar+gzip Markdown                            | `catalog-backend-module-skills-catalog-provider/src/SkillsCatalogProvider.techdocs.test.ts`                                                          | Actual extraction and HTTP-to-MkDocs generation use equal Markdown and different computed manifest digests.                                                                                           |
| Stable identity, moving tag and distinct same-digest aliases          | Combined test above; provider `SkillsCatalogProvider.durable.test.ts`; connector `plugin.techdocs.test.ts`                                           | Same catalog references survive tag movement, its digest URL changes, and an alias preserves old documentation.                                                                                       |
| Independent digest content                                            | Connector `plugin.techdocs.test.ts`                                                                                                                  | Different Markdown keyed by image reference detects mixed-up or overwritten documents.                                                                                                                |
| GET authentication, unknown/unavailable source/content, ETags         | Connector `router.test.ts`, `plugin.integration.test.ts`, `plugin.techdocs.test.ts`; combined test                                                   | 404/304/error behavior, native conditional HTTP and authenticated paths.                                                                                                                              |
| Off-origin/base URLs, redirects, source encoding                      | Reader `skilldocs-trust.test.ts`                                                                                                                     | No token/fetch for rejected destinations; deployment prefixes and one decoding pass are checked.                                                                                                      |
| Partial refresh and provider outage                                   | Connector `plugin.techdocs.test.ts`; provider durable/acknowledgment suites                                                                          | Previously referenced content remains readable; partial results cannot release old content.                                                                                                           |
| Catalog mutation failure, delayed processing, snapshots advancing     | Provider `SkillsCatalogProvider.durable.test.ts`, `SkillsCatalogProvider.acknowledgment.test.ts`                                                     | Real pending state survives failed mutations and stale processed URLs; newer polling cannot overwrite unresolved release obligations.                                                                 |
| Crash/restart and pending acknowledgment recovery                     | Provider `reconciliation-store.test.ts`, durable/acknowledgment suites; connector `services/ContentStore.durable.test.ts`                            | SQLite-backed recovery, original release context, transaction rollback, revision monotonicity and idempotent retry.                                                                                   |
| Repeated byte admission exhaustion                                    | Connector `plugin.techdocs.test.ts`                                                                                                                  | Three partial refreshes preserve the admitted document and unchanged retained byte/count statistics.                                                                                                  |
| Actual 1,000-digest boundary and controlled drain                     | Connector `plugin.techdocs.test.ts`                                                                                                                  | Real retained entries reach 1,000; three new admissions fail; a retained-only ready inventory plus acknowledgment drains to one and permits new admission. Statistics and the ceiling are not mocked. |
| Independent extraction/retention budgets and invalid/default settings | Connector `plugin.techdocs.test.ts`, `services/config.test.ts`, `services/ContentStore.test.ts`, `services/SkillImageService.test.ts`                | Config separation, admission versus extraction errors, positive safe integer validation and defaults.                                                                                                 |
| Startup reduction below persisted bytes                               | Connector `services/ContentStore.durable.test.ts` plus plugin startup validation                                                                     | A reopened store rejects the lower budget and persisted content remains intact.                                                                                                                       |
| POST authorization, body bounds and status outcomes                   | Connector `router.test.ts`, `plugin.techdocs.test.ts`                                                                                                | Provider-only auth and 204/400/403/404/409/413, including oversized bodies, duplicate/invalid digests and superseded/conflicting revisions.                                                           |
| Publication/cleanup serialization                                     | Connector `plugin.techdocs.test.ts`                                                                                                                  | Cleanup is held on a promise barrier while another refresh completes extraction; publication stays blocked until cleanup releases, and new content survives. No wall-clock sleep is used.             |
| Extraction and response size limits                                   | Connector `services/SkillImageService.test.ts`, `router.test.ts`, provider `SkillsCatalogProvider.test.ts`                                           | Oversized/decompression inputs and bounded snapshot consumption; failures do not become empty success.                                                                                                |
| Existing model-card integration and raw images                        | Reader `plugin.test.ts`, `skilldocs-trust.test.ts`; connector `plugin.integration.test.ts`, `plugin.normalization.test.ts`, `plugin.pinning.test.ts` | Existing model-card routing/output/cache assertions and `/images` compatibility remain covered.                                                                                                       |

The count-ceiling fixture seeds retained history directly rather than making 1,000
registry requests. Admission, source snapshots, authenticated reconciliation and
cleanup are production implementations. The focused connector lifecycle file uses
an explicit in-memory ContentStore fixture; durable behavior is verified separately
by the SQLite suites and by the combined test, not inferred from that fixture.

## Reproduce automated verification

From the workspace root:

```sh
YARN_ENABLE_SCRIPTS=false yarn install --immutable
(cd plugins/skill-image-connector-backend && yarn test --watchAll=false --runInBand)
(cd plugins/catalog-backend-module-skills-catalog-provider && yarn test --watchAll=false --runInBand)
(cd plugins/catalog-techdoc-url-reader-backend && yarn test --watchAll=false --runInBand)
yarn tsc:full
yarn build:all
yarn workspace @red-hat-developer-hub/backstage-plugin-skill-image-connector-backend lint
yarn workspace @red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider lint
yarn workspace @red-hat-developer-hub/backstage-plugin-catalog-techdoc-url-reader-backend lint
yarn build:api-reports:only --ci
yarn prettier:check
openspec validate oci-npx-skills-registry-demo --strict
```

HTTP integration tests bind local ports. SQLite suites need the native
better-sqlite3 binding for the active Node version. No external registry or cluster
is needed for these automated fixtures. Run `yarn dedupe` when dependency metadata
or the lockfile changes; retain only the intended workspace test dependencies.

## Maintainer demo and focused reader regression

Use your existing local configuration; do not commit personal Quay namespaces,
credentials, tuning values or database paths. Start `yarn dev` from the workspace.
Use one connector instance and one active provider runner per source. Discovery
must resolve snapshots, documentation and acknowledgments to that same instance.

1. Configure an existing source ID (for example `demo-skills`) with one original
   archive image and one annotated image whose Markdown is known. Add a second tag
   of the same image/digest for the alias case. Automated fixtures cover plain tar
   and tar+gzip independently. Set the catalog provider's connectorPluginId to the
   actual receiving plugin ID `skill-image-connector`, with the same source ID and
   `sourceType: oci`; retain valid owner/lifecycle and schedule configuration.
2. Fetch `http://localhost:7007/api/skill-image-connector/skills/demo-skills` using
   your configured backend authentication. Wait for `ready`; record each skill's
   digest and the `X-Skilldocs-Revision` header. The exact source ID comes from
   your source configuration, not a generated catalog entity name.
3. Confirm each imported catalog entity has
   `backstage.io/techdocs-ref: url:<discovered-base>/skilldocs/<encoded-sourceId>/<encoded-digest>`.
   At the normal local base this is
   `http://localhost:7007/api/skill-image-connector/skilldocs/<encoded-sourceId>/<encoded-digest>`.
   Render TechDocs from each entity and compare its Markdown with the input.
   Same-digest aliases should be separate entities with the same document URL.
4. For the focused conditional-read fix, open an entity's TechDocs twice and
   confirm it remains readable; exercise the URL reader with its prior response
   ETag (the combined automated test does this through native fetch). Matching
   conditional reads should yield NotModifiedError from a connector 304. A normal
   browser reload is not by itself proof that the backend URL-reader path used 304.
5. Move one fixture tag to a new manifest, trigger/wait for connector and provider
   refreshes, and verify its entity reference stays stable while its documentation
   URL changes to that manifest digest. Check the new Markdown renders. Keep the
   old alias enabled to verify its old digest remains readable.
6. Temporarily make one image unavailable or pause provider refresh. Retain a URL
   from the previous successful catalog observation and verify it stays readable.
   Restore the image/provider and let ready reconciliation finish. Do not reset
   either retention or provider database as a recovery shortcut.
7. Verify an existing model-card TechDocs page still renders when a model source
   is available, and confirm `/api/skill-image-connector/images` remains usable.

Use backend service credentials when calling the routes directly; unauthenticated
requests should be rejected. POST `/skilldocs/:sourceId/reconcile` is reserved for
the authorized catalog provider. Do not manually forge acknowledgments to bypass
catalog visibility; the automated suites exercise protocol failures and boundary
cases without risking live retained documentation.

Task 6.5 completion is maintainer-directed after the automated matrix. The
maintainer waived a separate broad regression pass for test-only changes, then
requested a quick manual regression of the newly discovered reader fix. That
quick regression subsequently passed, as reported by the maintainer. This does not
claim that every optional manual matrix case or a particular observed HTTP status
was independently checked by the assistant.
