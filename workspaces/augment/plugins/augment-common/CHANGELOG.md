# @red-hat-developer-hub/backstage-plugin-augment-common

## 0.2.0

### Minor Changes

- b418448: Add agent registry governance: unified agent listings with governanceRegistered flag, register-for-governance API, strict lifecycle transitions on publish/unpublish, and Registry UI with unregistered agent warnings and bulk actions.
- afaed59: Initial release of the Augment AI assistant plugin for Backstage. Provides a chat interface backed by Llama Stack with RAG, tool calling, multi-agent orchestration, and configurable safety guardrails.
- 3e18b17: Agent lifecycle hardening: add 5-stage promotion pipeline (draft/review/staging/production/retired), ownership-gated operations, rejection tracking, role-aware UI, admin polling dashboards, cascading delete, and SonataFlow agent-approval workflow.
- 717a651: Add SonataFlow agent approval workflow integration with dual-mode support (immediate or workflow-based transitions), request-unpublish and withdraw endpoints.
