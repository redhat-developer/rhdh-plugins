## ADDED Requirements

### Requirement: AIResource entities returned by standard catalog entity API

The catalog SHALL return AIResource entities via the standard `GET /api/catalog/entities` endpoint. AIResource entities SHALL be retrievable using the `kind=AIResource` filter parameter.

#### Scenario: Listing AIResource entities by kind

- **WHEN** a client calls `GET /api/catalog/entities?filter=kind=AIResource`
- **THEN** the response contains all AIResource entities the caller can read

#### Scenario: Retrieving a single AIResource entity by ref

- **WHEN** a client calls the standard by-name entity endpoint for an AIResource entity
- **THEN** the response contains the full AIResource entity if it exists and the caller has access

---

### Requirement: AIResource entities filterable by content type

The catalog SHALL support filtering AIResource entities by `spec.type`.

#### Scenario: Filter by content type

- **WHEN** a client calls `GET /api/catalog/entities?filter=kind=AIResource,spec.type=skills`
- **THEN** the response contains only AIResource entities that declare `spec.type: skills`

#### Scenario: Filter returns entities matching exact type value

- **WHEN** a client filters on `spec.type=agents`
- **THEN** only AIResource entities with `spec.type: agents` are returned

---

### Requirement: AIResource entities filterable by scope

The catalog SHALL support filtering AIResource entities by `spec.scope`.

#### Scenario: Filter by scope

- **WHEN** a client calls `GET /api/catalog/entities?filter=kind=AIResource,spec.scope=team`
- **THEN** only AIResource entities with `spec.scope: team` are returned

#### Scenario: Entities without scope excluded from scope filter

- **WHEN** a client filters on `spec.scope=organization` and an AIResource entity omits `spec.scope`
- **THEN** that entity does not appear in the filtered results

---

### Requirement: AIResource entities filterable by owner and lifecycle

The catalog SHALL support filtering AIResource entities by `spec.owner` and `spec.lifecycle`.

#### Scenario: Filter by owner

- **WHEN** a client filters on `spec.owner`
- **THEN** only AIResource entities with the matching owner are returned

#### Scenario: Filter by lifecycle

- **WHEN** a client filters on `spec.lifecycle=production`
- **THEN** only AIResource entities with `spec.lifecycle: production` are returned

---

### Requirement: AIResource entities appear in catalog full-text search

AIResource entities SHALL be indexed in catalog full-text search. Indexed fields SHALL include `metadata.name`, `metadata.title`, `metadata.description`, and `spec.type`.

#### Scenario: Search by entity name

- **WHEN** a user searches for a term that matches an AIResource entity's `metadata.name`
- **THEN** that entity appears in search results

#### Scenario: Search by content type term

- **WHEN** a user searches for a term such as `skills`
- **THEN** AIResource entities with matching `spec.type` values appear in results
