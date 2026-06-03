# RAG Knowledge Pipelines

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Ingest customer documentation into vector stores so agents can ground their answers in real data.

## EXISTING Requirements

### Requirement: Document Ingestion Pipeline

Multi-source document fetching with change detection and chunking.

#### Scenario: GitHub repository ingestion

- **WHEN** the admin adds a GitHub repository as a document source
- **THEN** the pipeline fetches content (supporting public/private repos, path filters, glob patterns)
- **AND** content is chunked and pushed to the configured vector store

#### Scenario: URL and file upload ingestion

- **WHEN** the admin adds a URL or uploads files via `IngestDropZone`
- **THEN** web pages are fetched and chunked, or uploaded files are processed
- **AND** all content is pushed to the vector store

#### Scenario: Change detection on subsequent syncs

- **WHEN** a sync schedule triggers (e.g., hourly) after initial ingestion
- **THEN** `DocumentSyncService` uses content hashes to detect changes
- **AND** only changed files are re-ingested
- **AND** deleted files are removed from the store

### Requirement: Vector Store Management

Create, configure, and scope vector stores to specific agents.

#### Scenario: Create vector store with search mode

- **WHEN** the admin creates a vector store via `KBCreateStore`
- **THEN** they configure search mode: semantic, keyword, or hybrid
- **AND** multiple stores can be created for different domains

#### Scenario: Per-agent vector store scoping

- **WHEN** the admin configures an agent
- **THEN** specific `vectorStoreIds` can be assigned
- **AND** the agent only searches scoped vector stores during RAG queries

### Requirement: RAG Playground

Test retrieval quality before deploying to production.

#### Scenario: RAG quality testing

- **WHEN** the admin opens the RAG playground (`KBRagTest`)
- **THEN** they can submit test queries via `RagQueryForm`
- **AND** `RagResultsTable` shows retrieved chunks with `ChunkCard`, `ScoreBar`, and relevance scores
- **AND** thresholds are adjustable to tune precision vs. recall
- **AND** `GeneratedAnswerCard` shows the answer that would be generated from the retrieved context
