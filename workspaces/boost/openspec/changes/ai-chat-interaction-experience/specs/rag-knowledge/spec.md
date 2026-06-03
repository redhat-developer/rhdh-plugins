# Knowledge-Grounded Answers (RAG)

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Answers grounded in the organization's own documentation, with source citations enabling developers to trace every claim to a source.

## EXISTING Requirements

### Requirement: RAG-Grounded Responses with Citations

The agent searches the knowledge base and provides cited answers.

#### Scenario: Question about internal documentation

- **WHEN** a user asks about internal documentation, runbooks, or policies
- **THEN** the agent determines retrieval is relevant and searches the knowledge base
- **AND** the UI shows "Searching knowledge base..." in real time via stream phase indicator
- **AND** the response includes a RAG sources section: document name, chunk text, and relevance score

#### Scenario: User expands source citations

- **WHEN** a RAG-grounded response is displayed
- **THEN** the user can expand source cards to view the original chunk text
- **AND** each card shows which vector store the source came from (when multiple stores are configured)

#### Scenario: No relevant results found

- **WHEN** the knowledge base search returns no results above the relevance threshold
- **THEN** the agent indicates it could not find relevant information
- **AND** it answers from general knowledge, noting the limitation

#### Scenario: Multiple knowledge bases searched

- **WHEN** multiple vector stores are configured and scoped to the active agent
- **THEN** the search spans all configured vector stores
- **AND** results show which store each source came from
