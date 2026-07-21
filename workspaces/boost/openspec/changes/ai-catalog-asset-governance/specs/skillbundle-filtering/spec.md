# SkillBundle Filtering

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Backend read-time RBAC filtering for SkillBundle skill lists. When a SkillBundle contains skills that the requesting user cannot see (per `ai-catalog.asset.read`), those skills are filtered from the response and the UI displays an adjusted count with messaging.

**Jira references:** RHIDP-15270, RHIDP-15273, RHIDP-15310

## ADDED Requirements

### Requirement: Backend Skill Filtering

SkillBundle API responses MUST filter individual skills based on the requesting user's `ai-catalog.asset.read` permission.

#### Scenario: Full access to all skills in a bundle

- **WHEN** a user with unrestricted `ai-catalog.asset.read` (ALLOW) requests a SkillBundle detail
- **THEN** all skills in the bundle are included in the response
- **AND** the skill count matches the total skills in the bundle

#### Scenario: Partial access with conditional filtering

- **WHEN** a user with conditional `ai-catalog.asset.read` (category-scoped or connector-scoped) requests a SkillBundle detail
- **THEN** only skills matching the user's conditional policy are included in the response
- **AND** the response includes `totalSkills` (full count) and `visibleSkills` (filtered count). Exposing the total count is an accepted trade-off: it reveals how many skills are hidden but not their identities. Deployers who need full opacity can use default-deny at the bundle level to hide the entire bundle.
- **AND** skill references that were filtered out are not exposed in any form (no IDs, no names, no placeholders)

#### Scenario: No access to bundle contents

- **WHEN** a user without `ai-catalog.asset.read` for any skills in a SkillBundle requests the bundle
- **THEN** the bundle metadata is shown (if the user has read access to the bundle entity itself)
- **AND** the skills list is empty
- **AND** a message indicates the user lacks permission to view bundle contents

### Requirement: Efficient Batch Filtering

Skill filtering MUST use batch permission evaluation, not per-skill checks.

#### Scenario: Batch authorizeConditional for skill list

- **WHEN** a SkillBundle contains N skills
- **THEN** the backend calls `permissions.authorizeConditional()` once for `ai-catalog.asset.read`
- **AND** the CONDITIONAL result is applied to all skills using `applyConditions()` or equivalent batch evaluation
- **AND** the backend does NOT make N individual `permissions.authorize()` calls

### Requirement: Frontend SkillBundle UX

The frontend MUST display filtered skill counts and appropriate messaging.

#### Scenario: Filtered count display

- **WHEN** the frontend renders a SkillBundle with partially filtered skills
- **THEN** the skill count shows "N of M skills visible" (where N = visible, M = total)
- **AND** a tooltip or info message explains that some skills are hidden due to access policies

#### Scenario: Fully restricted bundle

- **WHEN** no skills in a SkillBundle are visible to the current user
- **THEN** the frontend shows "0 of M skills visible"
- **AND** a restricted-access placeholder replaces the skill list
- **AND** the placeholder explains what permission is needed and how to request access

#### Scenario: No restrictions applied

- **WHEN** all skills in a SkillBundle are visible to the current user
- **THEN** the frontend shows the standard skill count without additional messaging
- **AND** no "N of M" notation is used — just the total count
