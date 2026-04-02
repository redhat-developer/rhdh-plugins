# ADR-0002: Applying optimizations using the Orchestrator plugin

## Status

Accepted

### Implementation Notes (PRs #2616, #2618, #2619)

The core decision to use the Orchestrator plugin was implemented as proposed.
However, based on a security threat model review (FLPATH-3503), the architecture
was hardened beyond the original design:

- **Backend gateway pattern**: The frontend no longer calls the Orchestrator API
  directly. Instead, requests route through the cost-management backend
  (`POST /api/cost-management/apply-recommendation`), which validates inputs,
  checks `ros.apply` permission, and forwards to Orchestrator using
  service-to-service authentication.
- **Input validation**: `resourceType` is validated against a server-side
  allowlist; all input fields are sanitized.
- **Audit logging**: Every apply action is logged with user identity, cluster,
  namespace, workload, and outcome.
- **Confirmation dialog**: The UI presents a confirmation step before applying.

The architecture diagram below reflects the original proposed flow.
See [docs/rbac.md](../rbac.md) for current RBAC details.

## Context

Instead of copy & pasting the optimization recommendations from the UI, we would like to allow users to apply these recommendations in an automated fashion (captured by [COST-5509](https://issues.redhat.com/browse/COST-5509)).

## Alternatives

We considered applying the recommendations by directly calling the Kube API of the clusters from within the Resource Optimization plugin, without relying on the Orchestrator plugin. However, this approach was deemed less flexible due to the diverse procedures users might have for cluster configuration patching.

### Challenges with Direct API Calls

- Varied approval processes: Non-production clusters might not require approval gateways, while production environments often necessitate review and approval before applying new configurations.
- Limited customization: Direct API calls would restrict the ability to accommodate different organizational workflows and security protocols.

### Advantages of Using the Orchestrator Plugin

- The decision to utilize the Orchestrator plugin offers several benefits:
- Custom workflow definition: Users can create tailored processes that align with their specific operational requirements.
- Third-party integration: The plugin facilitates easier integration with external services that implement approval gateways or other necessary steps in the configuration update process.
- Flexibility: This design choice allows users to implement their own integration logic, adapting to various use cases without constraining the Resource Optimization plugin.

## Decision

We’ll leverage the Orchestrator plugin capabilities to apply the recommendations. This approach will allow users to define workflows tailored to the process of their organizations.

## Consequences

### Pros

- Separation of concerns, the Resource Optimization plugin remains focused on its own domain while the Orchestrator plugin is used as an integration framework.

### Cons

- The feature depends on the Orchestrator plugin.

## Architecture overview

![pic](./resources/optimize-resources-workflow.svg)

## Additional information

1. [RHIN-1852](https://issues.redhat.com/browse/RHIN-1852): Allow users to apply optimizations by triggering a workflow.
2. [FLPATH-1755](https://issues.redhat.com/browse/FLPATH-1755): Create a workflow for applying cost optimizations.
