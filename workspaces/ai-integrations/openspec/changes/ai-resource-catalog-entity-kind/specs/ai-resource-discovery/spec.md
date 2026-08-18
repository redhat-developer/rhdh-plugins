## ADDED Requirements

### Requirement: AiResource entities returned by standard catalog entity API

The catalog SHALL return AiResource entities via the standard `GET /api/catalog/entities` endpoint. AiResource entities SHALL be retrievable using the `kind=AiResource` filter parameter.

#### Scenario: Listing AiResource entities by kind

- **WHEN** a client calls `GET /api/catalog/entities?filter=kind=AiResource`
- **THEN** the response contains all AiResource entities the caller can read

#### Scenario: Retrieving a single AiResource entity by ref

- **WHEN** a client calls the standard by-name entity endpoint for an AiResource entity
- **THEN** the response contains the full AiResource entity if it exists and the caller has access

---

### Requirement: AiResource entities filterable by content type

The catalog SHALL support filtering AiResource entities by `spec.type`.

#### Scenario: Filter by content type

- **WHEN** a client calls `GET /api/catalog/entities?filter=kind=AiResource,spec.type=skill`
- **THEN** the response contains only AiResource entities that declare `spec.type: skill`

#### Scenario: Filter returns entities matching exact type value

- **WHEN** a client filters on `spec.type=agent`
- **THEN** only AiResource entities with `spec.type: agent` are returned

---

### Requirement: AiResource entities filterable by scope

The catalog SHALL support filtering AiResource entities by `spec.scope`.

#### Scenario: Filter by scope

- **WHEN** a client calls `GET /api/catalog/entities?filter=kind=AiResource,spec.scope=team`
- **THEN** only AiResource entities with `spec.scope: team` are returned

#### Scenario: Entities without scope excluded from scope filter

- **WHEN** a client filters on `spec.scope=organization` and an AiResource entity omits `spec.scope`
- **THEN** that entity does not appear in the filtered results

---

### Requirement: AiResource entities filterable by owner and lifecycle

The catalog SHALL support filtering AiResource entities by `spec.owner` and `spec.lifecycle`.

#### Scenario: Filter by owner

- **WHEN** a client filters on `spec.owner`
- **THEN** only AiResource entities with the matching owner are returned

#### Scenario: Filter by lifecycle

- **WHEN** a client filters on `spec.lifecycle=production`
- **THEN** only AiResource entities with `spec.lifecycle: production` are returned

---

### Requirement: AiResource entities appear in catalog full-text search

AiResource entities SHALL be indexed in catalog full-text search. Indexed fields SHALL include `metadata.name`, `metadata.title`, `metadata.description`, and `spec.type`.

#### Scenario: Search by entity name

- **WHEN** a user searches for a term that matches an AiResource entity's `metadata.name`
- **THEN** that entity appears in search results

#### Scenario: Search by content type term

- **WHEN** a user searches for a term such as `skills`
- **THEN** AiResource entities with matching `spec.type` values appear in results
