# Audit: MCP Registry Server Mapping

## Audit Report: mcp-registry-server-mapping

**Last audited:** 2026-08-25T00:03:43Z

_Re-audit following the `repository.url`/`websiteUrl` link-mapping revision (repository.url now dual-emits `backstage.io/source-location` + a `metadata.links` "Source Code" entry; `websiteUrl` link titled "Website"). Fix-and-reaudit loop ran 2 passes; all findings from both passes were fixed and confirmed. No CRITICAL findings at any point in this run._

### Summary

| Category                               | CRITICAL | WARNING | SUGGESTION |
| -------------------------------------- | -------- | ------- | ---------- |
| A (Entity propagation)                 | 0        | 0       | 0          |
| B (Enum / vocabulary)                  | 0        | 0       | 0          |
| C (Semantic contradiction)             | 0        | 2       | 0          |
| D (Codebase & convention grounding)    | 0        | 0       | 0          |
| E (Namespace & cross-change ownership) | 0        | 0       | 0          |
| F (Template / copy-paste residue)      | 0        | 0       | 1         |
| G (Extended coherence)                 | 0        | 0       | 0          |
| H (Security lint)                      | 0        | 2      | 0          |
| **Total**                              | **0**    | **4**   | **1**      |

### CRITICAL

- None

### WARNING

- **[C]** [`openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-server-mapping/spec.md:59`](specs/mcp-registry-server-mapping/spec.md#L59) — The spec requires distinct sanitized-name collisions to receive a hash suffix, but the transform is pure over one document and cannot know whether another document collides. Make the rule deterministic per input (for example, hash whenever sanitization changes the identity or the value is truncated), or explicitly move collision resolution to the provider and specify that contract.
- **[C]** [`openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-server-mapping/spec.md:71`](specs/mcp-registry-server-mapping/spec.md#L71) — The repository algorithm strips trailing `/` and `.git`, then emits only the combined URL while the annotation-projection spec promises recovery of every non-secret scalar. The original `repository.url` is therefore not recoverable for such inputs. Preserve the original URL in a dedicated annotation or narrow the round-trip guarantee with an explicit exception and scenario.
- **[H]** [`openspec/changes/mcp-registry-server-mapping/design.md:133`](design.md#L133) — D9 continues projecting `choices` for `isSecret: true` inputs. If choices contain allowed secret values, those values become searchable catalog annotations. Redact secret-associated choices too, or document and test why they are safe.
- **[H]** [`openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-server-mapping/spec.md:67`](specs/mcp-registry-server-mapping/spec.md#L67) — Registry-controlled `websiteUrl` and repository URLs are copied into links and `backstage.io/source-location` without a scheme/host safety rule. Specify safe handling for disallowed schemes such as `javascript:`/`data:` and decide how internal-network URLs should be treated; add adversarial scenarios.

### SUGGESTION

- **[F]** [`openspec/changes/mcp-registry-server-mapping/proposal.md:29`](specs/mcp-registry-server-mapping/proposal.md#L29) — The proposal still calls ingestion “a separate future change,” although this branch contains the sibling `mcp-registry-provider` change that consumes this contract. Replace that wording with an explicit sibling reference to remove stale final-artifact context.

---

**Pass 1 findings (all resolved):**

- **[A] WARNING**: `specs/mcp-registry-annotation-projection/spec.md:22` "not re-projected" scenario listed only `remotes[].url` as natively-mapped, while the server-mapping spec (line 29) and task 3.4 map/exclude both `type` and `url` → **Fixed**: now reads `remotes[].type`/`url`.
- **[C] WARNING**: Ambiguity over whether `repository.subfolder` is separately projected as `modelcontextprotocol.io/repository.subfolder` in addition to being combined into the source-location/link values → **Resolved (no change needed)**: subfolder is not in task 3.4's skip list, so it projects normally under the round-trip fidelity rule (annotation-projection spec); the combine-when-present behavior is already stated in the server-mapping spec, design D10, and tasks. Not re-reported in pass 2.

**Pass 2 findings (all resolved):**

- **[B] SUGGESTION**: `proposal.md:11` said `spec.lifecycle` defaults to `production` while owner used "constant `unknown`" and design/tasks/spec used "constant `production`" → **Fixed**: now "the constant `production`".
- **[A] SUGGESTION**: `proposal.md:8` source-location clause omitted the "(combined with `repository.subfolder` when present)" detail present in design/tasks/spec → **Fixed**: detail added.

**Cross-change ownership (Category E):** `modelcontextprotocol.io/*` and the `mcp-server` API entity mapping are owned solely by this change. `backstage.io/source-location` is a standard Backstage annotation also used by sibling `aicontext-catalog-entity-kind` for its own `AIResource`/git entities (via `UrlReaderProcessor`); this change emits it for `mcp-server` entities. Different entity kinds, convergent standard usage — no exclusive-ownership conflict.
