# OpenSpec operating model for agent-ready development

> **Status:** Proposed
>
> **Decision requested from:** Maintainers and contributors of workspaces using
> OpenSpec

## Decision

Use OpenSpec as a bounded implementation contract for one agent-ready change.
Do not use it as a roadmap, general knowledge base, Jira mirror, or store for
temporary agent analysis.

Before adopting this model, reviewers are asked to agree that:

1. Jira owns roadmap, priority, ownership, dependencies, and story status.
2. Only actionable implementation work belongs in the active OpenSpec queue.
   OpenSpec does not own a separate ready or in-progress workflow status.
3. An OpenSpec change is created when work benefits from an explicit
   implementation contract. Mechanical-only work may use the normal
   pull-request workflow.
4. An implementation agent receives one explicit OpenSpec change and does not
   scan the complete specification tree by default.
5. Blocked and deferred work remains in Jira and leaves the active OpenSpec
   queue; Git history preserves any removed implementation plan.
6. This model is the result of the Boost pilot, and its corrected workflow
   will be validated in Boost before repository-wide tooling is added.

## Why this is needed

Boost was the pilot for using OpenSpec and agentic development in this
repository. The intended outcome was that an agent could pick up a story,
understand its behavior and design constraints, execute its tasks, and
validate the result. This RFC captures the lessons from that pilot.

The pilot exposed a failure of information ownership. Scope, status, design
decisions, and implementation claims were distributed across Jira, OpenSpec,
product specifications, general documentation, GitHub issues, code, and tests.
The same information was duplicated and drifted, with no reliable boundary
around what belonged in the active OpenSpec queue.

Without that boundary, material accumulated into a large, mixed, low-trust
document set. Its volume is now a bottleneck in its own right: the tree is too
large for a person or an agent to inspect as a whole without spending most of
the effort on retrieval.

The following snapshot was measured from `upstream/main` at commit
`f8145f8b7605f7e10177f0bac89705e78756d684` on 2026-09-08. The numbers are
indicative, not targets.

- `openspec list` presents all 18 top-level changes as `in-progress`, because
  the CLI derives that label from unchecked tasks.
- The OpenSpec tree contains 127 Markdown files and 15,074 lines.
- Some individual changes contain 95, 109, or 122 tasks.
- Jira identifiers appear nearly 2,000 times across 90 workspace Markdown
  files.
- Draft, deferred, consolidated, implemented, and historical information is
  stored alongside active implementation work.

These numbers are evidence of an operational failure, not line-count targets.
Unclear ownership allowed duplication and mixed state to accumulate; the
resulting volume made reconstruction expensive. The active queue cannot be
trusted without first deciding what is current and actionable.

## What went wrong in the pilot

The process lacked the controls needed to keep this workspace usable:

1. **Information ownership:** Status, scope, and implementation claims were
   copied across systems and drifted independently.
2. **Volume and granularity:** The amount of material and the size of
   individual changes exceed a useful human review and agent-retrieval
   boundary.
3. **Queue hygiene:** Active work, drafts, deferred plans, completed
   work, and historical context were left together, making the active queue
   unreliable.
4. **Readiness:** Completing proposal, design, spec, and task documents was
   treated as equivalent to being ready for implementation.
5. **Retrieval:** Agents were expected to discover relevant information by
   navigating the workspace instead of receiving a bounded change.

This is a failure of the operating model. The corrective action is to reduce
the information an agent must consume, make ownership explicit, and remove
content that is not actionable. It is not an assignment of blame to the people
or agents that produced the current documents.

## Information ownership

Each kind of information has one authoritative home.

| Information                                                  | Source of truth                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| Release boundary                                             | A minimal workspace release map, such as Boost's `CURRENT.md` |
| Roadmap, priority, ownership, dependencies, and story status | Jira                                                          |
| Active implementation contract                               | The selected active OpenSpec change                           |
| Shipped behavior contract                                    | `openspec/specs/`                                             |
| Executable implementation and evidence                       | Code and tests                                                |
| Durable project context and architecture decisions           | Stable workspace documentation                                |
| Engineering discussion and execution history                 | GitHub issues, pull requests, and Git                         |
| Temporary agent plans and analysis                           | Outside the repository                                        |

Documents may link to another source, but they must not copy frequently
changing status from it. Jira references provide traceability; they are not
required reading for an implementation agent.

When an active change, implementation, tests, and canonical spec disagree, the
discrepancy must be resolved before merge. After archive, `openspec/specs/`
describes shipped behavior and code/tests provide executable evidence. Neither
is automatically rewritten to hide a discrepancy.

## OpenSpec lifecycle

The active-queue rule applies after an initial classification. Before adopting
this model in a workspace, existing changes must be classified as actionable,
completed, blocked or deferred, or historical. Retain only actionable changes
directly under `openspec/changes/`; archive completed behavior under
`openspec/specs/`; and remove blocked, deferred, and historical material from
the active tree while preserving Git history.

After that initial classification, every change directly under
`openspec/changes/` is actionable implementation work. Review readiness is
established through pull-request review, while ownership and implementation
progress are visible in Jira, branches, and pull requests. Completion is
represented by archiving the change.

Create a change when the work needs an explicit implementation contract. For a
design choice that reviewers may reasonably question, the proposal records the
context, alternatives, and impact. Mechanical-only changes may remain normal
pull requests. A behavior change represented by OpenSpec still uses the
standard delta-spec format and validation.

Blocked and deferred work remains in Jira and is removed from the active
OpenSpec tree. It does not receive a second repository backlog record. If an
existing change is removed, its Git history and the removal pull request retain
the traceability to Jira. Historical decisions are not backfilled solely to
make the repository appear complete; document them when the code is next
changed or when a current implementation contract requires them.

## Implementation-ready change contract

An implementation-ready change must:

- represent one implementable vertical slice;
- identify its affected package paths;
- contain observable requirements and testable scenarios;
- contain ordered, atomic implementation and verification tasks;
- include every product and architecture decision needed for implementation;
- be understandable without opening Jira or unrelated OpenSpec changes;
- avoid duplicating background material that can be linked instead;
- contain no unresolved alternatives, placeholders, or future decisions.

Use the standard OpenSpec artifacts as needed to make the change
decision-complete. Not every change needs every artifact. Include `design.md`
only when the change introduces decisions not already covered by existing
architecture; otherwise, link to that architecture instead of duplicating it.

Keep each change within a useful review boundary. If its scope or task list
grows beyond that boundary, split it into smaller vertical slices or document
why it should remain together.

## Agent context contract

OpenSpec is the implementation contract, not an agent framework. The same
change may be used by Fullsend, Cursor, Codex, or a human engineer. The tool
used to select or execute it does not change the information ownership defined
here.

An implementation agent receives only:

1. the workspace's minimal release map;
2. one explicitly selected change;
3. source files and tests referenced by that change or discovered while
   implementing it.

The agent must not scan all OpenSpec changes, archives, Jira analysis, product
requirements, or historical documents unless the selected change identifies a
specific dependency.

## Implementation workflow

1. Product planning and readiness are resolved in Jira.
2. A focused OpenSpec change is created when the story is ready to become an
   implementation contract.
3. Reviewers confirm the implementation-ready contract through pull-request
   review.
4. An agent or engineer works from the selected change; ownership and progress
   are tracked through Jira, a branch, or a pull request.
5. Implementation and tests are completed against the selected change.
6. Before merge, tasks, tests, implementation, and canonical behavior are
   reconciled.
7. The implementation pull request runs the standard OpenSpec validator and
   any Boost-specific structural checks, then archives the completed change,
   updating `openspec/specs/`.
8. Story status continues to be maintained only in Jira.

Validation checks artifact shape, placement, and consistency. It does not
decide whether a change is valuable or whether the implementation satisfies
product intent; those remain author and reviewer decisions.

## Applying the lessons in Boost

If this RFC is approved, Boost will be the first workspace to apply the
corrected operating model in a separate pull request:

- keep its release map small;
- start with a one-time classification of existing changes: retain only
  actionable changes under `openspec/changes/`, archive completed behavior
  under `openspec/specs/`, and remove blocked or deferred plans from the active
  tree while preserving Git history;
- keep concise canonical frontend and OGX behavior specs;
- add a local validator that also runs the standard OpenSpec validator;
- validate the bounded workflow through real Boost implementation work.

Repository-wide validation or migration will not be introduced until the
corrected workflow has been exercised in Boost. Checks that prove useful may
later move into `repo-tools`, and other workspaces may adopt them
incrementally.

> **Note:** This model follows the [OpenSpec workflow](https://github.com/Fission-AI/OpenSpec/blob/main/docs/team-workflow.md)
> and [Solana Explorer's adoption](https://github.com/solana-foundation/explorer/blob/master/openspec/README.md).
> Public adoption remains limited, so Boost will validate it as a pilot before
> broader use.

## Success criteria

The model succeeds when:

- a contributor can identify the authoritative source for each information
  type;
- `openspec list` exposes only actionable work;
- an agent can start from one change without a workspace-wide documentation
  scan;
- an implementation-ready change requires no external product decisions;
- implementation status is not synchronized manually across several files;
- standard OpenSpec validation and Boost-specific validation pass for active
  changes and live specs;
- the corrected Boost workflow completes without another state-reconstruction
  exercise.
