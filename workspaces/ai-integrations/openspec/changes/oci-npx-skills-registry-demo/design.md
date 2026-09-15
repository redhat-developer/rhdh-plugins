# Design: OCI and npx Skills Catalog Providers

## Context

Each source exposes a skill differently: OCTO skillimage stores indexable
metadata in OCI manifest annotations; npx-compatible registries publish a
discovery index whose `skill-md` entries identify retrievable skill artifacts.
Both sources are represented in the catalog at skill grain.

## Decisions

### D1 — One upstream AiResource per skill

Every discovered skill becomes one `AiResource` with `spec.type: skill`.
`rhdh.io/ai-asset-category: skill`, `rhdh.io/ai-asset-version`, and
`rhdh.io/ai-asset-source` remain the RHDH AI Catalog contract. Providers set
`defaultOwner` and `defaultLifecycle` from configuration when source metadata
does not provide usable values.

### D2 — Locations and integrity references

`backstage.io/source-location` is the canonical user-facing locator. OCI uses
the existing `url:oci://<registry>/<repository>@<digest>` form; npx uses the
artifact HTTPS URL. Retain `rhdh.io/oci-skill-ref` and
`rhdh.io/npx-skill-ref` for AI Catalog consumers. Both custom references are
derived from the resolved source and are digest-pinned.

### D3 — OCI discovery uses public Quay and manifest annotations

An OCI provider instance is configured with a public Quay organization and an
optional selected tag, defaulting to `latest`. It discovers repositories in
that organization, resolves the selected tag once, then fetches the manifest
by the returned digest. A manifest is a skill only when it carries the required
OCTO skillimage annotations. Image layers are not fetched during catalog
ingestion.

### D4 — npx discovery uses the compatible registry index

The npx provider consumes the Agent Skills v0.2 discovery index. It accepts
only `skill-md` entries; archive artifacts are out of scope. Each artifact is
retrieved from HTTPS, SHA-256 verified against the index, and used only to map
known metadata. RHESS is one compatible source, not a special case.

### D5 — Stable identity and resilient sync

Every provider instance has a stable configuration `id`. Entity identity
derives from that ID and the source skill identity; the published name is the
display title. Providers persist last-known-good identities and digests, use
delta mutations, retain entries that fail an individual lookup, and remove an
entry only when successful discovery proves it absent.

### D6 — Public-source safety and limits

v1 supports publicly readable sources only. Npx artifact URLs are HTTPS and
same-origin with the configured index unless explicitly allowlisted; redirects
must not escape the allowlist. Listing is paginated, work is bounded, a skill
artifact is capped at 1 MiB, and provider syncs do not overlap. The default
sync interval is ten minutes and is configurable per provider.
