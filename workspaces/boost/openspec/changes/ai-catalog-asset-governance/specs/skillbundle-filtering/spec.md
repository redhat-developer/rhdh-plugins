# SkillBundle Authorization

> **Status: Draft** — Decision-gated follow-on behavior. The authorization path
> depends on whether skills are separate entities or nested API data.

**Jira:** RHIDP-15270, RHIDP-15273, RHIDP-15310

## ADDED Requirements

### Requirement: Representation determines authorization

The implementation MUST determine the SkillBundle representation before adding
filtering work.

#### Scenario: Separate skill entities

- **WHEN** a SkillBundle references separate Catalog skill entities
- **THEN** each skill is governed by `catalog.entity.read`
- **AND** an unauthorized skill is absent from authorized Catalog results

#### Scenario: Nested skill data

- **WHEN** skills remain nested in a bundle API response
- **THEN** the serving API filters the nested list before returning it
- **AND** unauthorized skill identifiers and names are not exposed

### Requirement: Frontend reflects API filtering

- **WHEN** a bundle API omits unauthorized nested skills
- **THEN** the frontend renders only the returned skills
- **AND** it does not reconstruct hidden skill data
