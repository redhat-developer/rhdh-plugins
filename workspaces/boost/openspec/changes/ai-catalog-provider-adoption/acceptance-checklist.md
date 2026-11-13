# Acceptance Checklist: AI Catalog Provider Adoption

> **RHIDP-18843.** Check each item before considering the planning
> deliverable complete. Items correspond to acceptance criteria from
> the Jira story.

## Inventory completeness

- [ ] The inventory names provider classes, packages, source-service
      boundaries, and links to implementation evidence (source file paths
      at revision `8af3d2f`).
- [ ] Each provider has current mutation/persistence behavior documented
      (full vs delta, stateless vs durable, in-memory vs store-backed).
- [ ] Each provider has verified source pagination/change-feed
      capabilities documented (or explicit statement that none exist).
- [ ] Cross-workspace summary table shows all providers with kind,
      spec.type, mutation mode, SDK use, and source.

## Cohort classification

- [ ] The plan separates required 2.2 migrations (Cohort 1),
      reference-only examples (Cohort 2), and deferred/experimental work
      (Cohort 3).
- [ ] Unresolved cohort choices are identified (e.g.,
      ModelCatalogResourceEntityProvider SDK adoption depends on
      RHIDP-18839).
- [ ] OCI pilot is explicitly marked as not a 2.2 shipping commitment.

## Pilot and rollout order

- [ ] A representative pilot (OGX model smoke test) is justified as
      the simplest validation starting point.
- [ ] The rollout order progresses from simple to complex: OGX → OCI
      pilot → MCP → remaining.
- [ ] Source limitations have explicit acceptance (e.g., no change-feed
      support in any provider) or follow-up work (e.g., durable state for
      MCP registry).

## Ownership and constraints

- [ ] Ownership constraints for upstream-tracking providers
      (MCP registry, model catalog) are documented before proposing local
      API changes.
- [ ] KServe connector's role as a source service (not an entity
      provider) is documented with its consumer relationship.

## Output feeds provider-specific OpenSpecs

- [ ] Provider coverage, owners, and prerequisites are recorded so
      RHIDP-18849 (OGX) and RHIDP-18850 (ai-integrations) can use them.
- [ ] Shared contract work is deferred to RHIDP-18844 through
      RHIDP-18848 (not duplicated here).
- [ ] Later lifecycle/safety coordination references RHIDP-18846 and
      RHIDP-18848.

## Negative checks

- [ ] No production code, runtime provider migration, or package
      publication is included.
- [ ] No coding stories or numbered implementation tasks are created.
- [ ] No unrelated cleanup or dependency changes.
