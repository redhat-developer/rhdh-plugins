## Audit Report: mcp-registry-server-mapping

**Last audited:** 2026-08-25T00:03:43Z

_Re-audit following the `repository.url`/`websiteUrl` link-mapping revision (repository.url now dual-emits `backstage.io/source-location` + a `metadata.links` "Source Code" entry; `websiteUrl` link titled "Website"). Fix-and-reaudit loop ran 2 passes; all findings from both passes were fixed and confirmed. No CRITICAL findings at any point in this run._

### Summary

| Category                               | CRITICAL | WARNING | SUGGESTION |
| -------------------------------------- | -------- | ------- | ---------- |
| A (Entity propagation)                 | 0        | 0       | 0          |
| B (Enum / vocabulary)                  | 0        | 0       | 0          |
| C (Semantic contradiction)             | 0        | 0       | 0          |
| D (Codebase & convention grounding)    | 0        | 0       | 0          |
| E (Namespace & cross-change ownership) | 0        | 0       | 0          |
| F (Template / copy-paste residue)      | 0        | 0       | 0          |
| G (Extended coherence)                 | 0        | 0       | 0          |
| H (Security lint)                      | 0        | 0       | 0          |
| **Total**                              | **0**    | **0**   | **0**      |

### CRITICAL

- None

### WARNING

- None

### SUGGESTION

- None

---

**Pass 1 findings (all resolved):**

- **[A] WARNING**: `specs/mcp-registry-annotation-projection/spec.md:22` "not re-projected" scenario listed only `remotes[].url` as natively-mapped, while the server-mapping spec (line 29) and task 3.4 map/exclude both `type` and `url` → **Fixed**: now reads `remotes[].type`/`url`.
- **[C] WARNING**: Ambiguity over whether `repository.subfolder` is separately projected as `modelcontextprotocol.io/repository.subfolder` in addition to being combined into the source-location/link values → **Resolved (no change needed)**: subfolder is not in task 3.4's skip list, so it projects normally under the round-trip fidelity rule (annotation-projection spec); the combine-when-present behavior is already stated in the server-mapping spec, design D10, and tasks. Not re-reported in pass 2.

**Pass 2 findings (all resolved):**

- **[B] SUGGESTION**: `proposal.md:11` said `spec.lifecycle` defaults to `production` while owner used "constant `unknown`" and design/tasks/spec used "constant `production`" → **Fixed**: now "the constant `production`".
- **[A] SUGGESTION**: `proposal.md:8` source-location clause omitted the "(combined with `repository.subfolder` when present)" detail present in design/tasks/spec → **Fixed**: detail added.

**Cross-change ownership (Category E):** `modelcontextprotocol.io/*` and the `mcp-server` API entity mapping are owned solely by this change. `backstage.io/source-location` is a standard Backstage annotation also used by sibling `aicontext-catalog-entity-kind` for its own `AIResource`/git entities (via `UrlReaderProcessor`); this change emits it for `mcp-server` entities. Different entity kinds, convergent standard usage — no exclusive-ownership conflict.
