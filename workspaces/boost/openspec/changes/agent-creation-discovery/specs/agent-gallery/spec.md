# Agent Gallery and Discovery

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Browse, search, filter, and select agents from a curated gallery. The gallery merges agents from all providers into a unified view.

## EXISTING Requirements

### Requirement: Agent Catalog Dialog (Kagenti)

A full-featured agent browsing experience for the Kagenti provider.

#### Scenario: Browse all agents

- **WHEN** the user clicks "Browse all agents" from the welcome screen
- **THEN** the `AgentCatalogDialog` opens showing all published agents
- **AND** agents can be searched by keyword, filtered by framework, and sorted by name/status/newest
- **AND** tabs separate: All, Recent, Pinned

#### Scenario: Agent preview panel

- **WHEN** the user selects an agent in the catalog
- **THEN** a preview panel shows: conversation starters, about section, skills, capabilities (streaming/A2A), and technical details (framework, workspace, version, endpoint)
- **AND** "Start Conversation" selects the agent and enables chat input

#### Scenario: First visit auto-open

- **WHEN** a user visits Augment with Kagenti provider and no agent is selected
- **THEN** the agent catalog dialog auto-opens

### Requirement: Unified Agent List

Agents from all providers are merged into a single discoverable list.

#### Scenario: buildUnifiedAgentList merges providers

- **WHEN** the agent gallery data is fetched via `GET /agents?published=true`
- **THEN** `useAgentGalleryData()` merges agents from all providers with a 155ms timeout
- **AND** guard merge + dedup ensures no duplicates
- **AND** featured agents are configured via `ChatExperiencePanel`
