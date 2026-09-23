# Design: AI Catalog frontend E2E

## Context

Boost is NFS-only. The suite runs the development app and mocks Catalog API
responses for deterministic browser tests.

## Decisions

- The initial suite runs in English and locates controls by their rendered
  accessible names.
- The axe scan covers the empty catalog. Filled-catalog contrast violations are
  tracked in RHDHBUGS-3738.
- Component tests retain detailed coverage for pagination, card navigation,
  and combined filters. New Playwright coverage for those behaviors should be
  proposed as a separate, bounded change if required.

## Non-Goals

- Locale-specific tests
- Overlay or OCI packaging
