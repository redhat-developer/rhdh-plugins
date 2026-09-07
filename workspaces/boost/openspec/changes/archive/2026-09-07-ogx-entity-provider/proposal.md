# Proposal: Document the implemented OGX entity provider

## Why

The OGX entity provider is part of the RHDH 2.1 release scope, but its current
behavior is only described indirectly by implementation and tests. A focused
OpenSpec is needed to make the release bookkeeping explicit and provide a
current source of truth for the provider behavior.

## Scope

This change documents the implemented OGX Catalog backend module, including its
model-server and agent entity providers, configuration resolution, scheduling,
entity mappings, annotations, and model-fetch failure behavior.

No runtime behavior is introduced by this change.

## Out of scope

- The `boost-backend` plugin and Kagenti packages.
- A Boost backend API or catalog download proxy.
- Redesigning or merging the common and entity-provider SDK packages.
- Changes to the broad `ai-catalog-entity-model` proposal.
- Future OGX capabilities that are not implemented and tested today.
