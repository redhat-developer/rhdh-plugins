# RHIDP-18495: Lightweight RAG Replacement Architecture Analysis

**Spike**: Select a supportable lightweight RAG architecture for the RHDH 2.2
Intelligent Assistant to replace the product-managed OKP deployment.

**Parent Feature**: RHDHPLAN-1866

**Status**: Draft — pending review by Intelligent Assistant, LCORE, and
Platform leads.

---

## 1. Current Architecture (As-Is)

The Intelligent Assistant backend plugin
(`intelligent-assistant-backend`) communicates with
**lightspeed-core (LCORE)** over HTTP at `http://127.0.0.1:8080` (default).
The following sections document the current integration contracts as they
exist in the codebase today.

### 1.1 Service Topology

```
┌──────────────────────────┐
│ RHDH (Backstage)         │
│  ┌────────────────────┐  │
│  │ IA Frontend Plugin  │  │
│  └───────┬────────────┘  │
│          │ /api/intelligent-assistant/*
│  ┌───────▼────────────┐  │
│  │ IA Backend Plugin   │  │
│  └───────┬────────────┘  │
└──────────┼───────────────┘
           │ HTTP (localhost:8080)
┌──────────▼───────────────┐
│ lightspeed-core (LCORE)  │
│  ┌────────────────────┐  │
│  │ Vector Stores API   │  │  ← OpenAI-compatible /v1/vector-stores
│  │ Files API           │  │  ← /v1/files
│  │ Responses API       │  │  ← /v1/responses (w/ file_search tool)
│  │ Streaming Query     │  │  ← /v1/streaming_query
│  │ Conversations API   │  │  ← /v2/conversations
│  │ MCP Servers         │  │  ← /v1/mcp-servers
│  └────────┬───────────┘  │
│           │              │
│  ┌────────▼───────────┐  │
│  │ Embedding Model     │  │  nomic-embed-text-v1.5 (768-dim)
│  │ Vector Store Engine │  │  (FAISS or similar, internal to LCORE)
│  │ LLM Providers       │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

### 1.2 RAG Integration Points in the Plugin

The plugin's RAG capabilities are implemented in the **AI Notebooks**
feature (`intelligent-assistant.notebooks`). Key integration points:

| Component              | File                                                 | Role                                                                                                    |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `VectorStoresOperator` | `src/service/notebooks/VectorStoresOperator.ts`      | HTTP client wrapper for LCORE's vector store endpoints; provides the same interface as LlamaStackClient |
| `DocumentService`      | `src/service/notebooks/documents/documentService.ts` | Manages document lifecycle: upload → convert-to-markdown → embed → attach to vector store               |
| `SessionService`       | `src/service/notebooks/sessions/sessionService.ts`   | Manages notebook sessions; each session maps to a LCORE vector store ID                                 |
| `notebooksRouter`      | `src/service/notebooks/notebooksRouters.ts`          | REST API for sessions, documents, and RAG queries                                                       |
| `router.ts`            | `src/service/router.ts`                              | Main router; proxies `/v1/query` to LCORE's `/v1/streaming_query`                                       |

### 1.3 Current RAG Flow (AI Notebooks)

1. **Document upload**: User uploads a file → backend converts to markdown
   (`markitdownClient`) → uploads to LCORE Files API (`POST /v1/files`).
2. **Vector store attachment**: File is attached to a per-session vector
   store (`POST /v1/vector-stores/{id}/files`) with a configurable
   chunking strategy (auto or static, max 512 tokens, 50-token overlap).
3. **Query**: User asks a question → backend sends to LCORE
   Responses API (`POST /v1/responses`) with
   `tools: [{ type: 'file_search', vector_store_ids: [sessionId] }]`.
4. **Retrieval + generation**: LCORE performs embedding of the query,
   vector similarity search, and RAG generation internally, streaming
   the response back.

### 1.4 LCORE API Contract (rag.byok.stores)

The existing vector stores contract uses OpenAI-compatible endpoints:

```
POST   /v1/vector-stores                         Create store
GET    /v1/vector-stores                          List stores
GET    /v1/vector-stores/{id}                     Retrieve store
PUT    /v1/vector-stores/{id}                     Update store
DELETE /v1/vector-stores/{id}                     Delete store
POST   /v1/vector-stores/{id}/files               Add file to store
GET    /v1/vector-stores/{id}/files               List files in store
GET    /v1/vector-stores/{id}/files/{file_id}     Retrieve file
DELETE /v1/vector-stores/{id}/files/{file_id}     Delete file
POST   /v1/files                                  Upload file
DELETE /v1/files/{file_id}                        Delete file
POST   /v1/responses                              Query with file_search tool
```

The `file_search` tool type in the Responses API is how LCORE performs
retrieval. The plugin does **not** call a separate retrieval API; LCORE
handles the full RAG pipeline (embed query → search → augment → generate).

### 1.5 Embedding Configuration

From test fixtures and session metadata:

- **Model**: `sentence-transformers/nomic-ai/nomic-embed-text-v1.5`
- **Dimension**: 768
- **Provider ID**: `notebooks`
- **Embeddings are generated at document-upload time** (build time for
  the RHDH docs corpus; runtime for user-uploaded documents in Notebooks).

---

## 2. Candidate Architectures

Both candidates are evaluated against the same LCORE integration
contract documented above. The spike prototype corpus is the latest
available RHDH 2.1 documentation.

### 2.1 Candidate A — Standalone Lightweight RAG Service/Container

**Architecture**: A separate container running alongside LCORE that
manages its own vector store and exposes a retrieval API.

```
┌────────────────┐     ┌────────────────────┐
│ IA Backend     │────▶│ LCORE              │
│ Plugin         │     │  (chat, MCP, etc.) │
└────────────────┘     └───────┬────────────┘
                               │ retrieval query
                       ┌───────▼────────────┐
                       │ RAG Service        │
                       │  ┌──────────────┐  │
                       │  │ Embed model   │  │  nomic-embed-text-v1.5
                       │  │ Vector store  │  │  FAISS / Qdrant / Chroma
                       │  │ Retrieval API │  │  /v1/retrieve or compat
                       │  └──────────────┘  │
                       └────────────────────┘
```

**How it fits the existing contract:**

| Requirement                          | Assessment                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compatibility with `rag.byok.stores` | **Must verify.** LCORE's BYOK stores contract defines how external vector stores are registered. If the RAG service implements the same `/v1/vector-stores` API surface, it can be registered as a BYOK store and LCORE queries it via `file_search`. If a custom HTTP retrieval API is needed instead, this is **blocked** until LCORE commits to a new integration point. |
| Disconnected operation               | ✅ Embedding model and vector index are baked into the container image at build time. No runtime model download required.                                                                                                                                                                                                                                                   |
| Document embeddings at build time    | ✅ The service container runs an ingestion pipeline at image build time to embed the RHDH docs corpus and produce FAISS/Qdrant index files.                                                                                                                                                                                                                                 |
| Query embedding at runtime           | ✅ The service loads the same embedding model at startup and embeds queries on the fly.                                                                                                                                                                                                                                                                                     |

**Prototype tasks:**

1. Stand up a minimal Python service (FastAPI or Flask) that:
   - Loads a pre-built FAISS index + the `nomic-embed-text-v1.5` model
   - Exposes an OpenAI-compatible `/v1/vector-stores` surface (or the
     minimum subset LCORE needs for BYOK registration)
   - Alternatively, exposes a simpler `/v1/retrieve` endpoint
2. Register the service as a BYOK store in LCORE's
   `lightspeed-stack.yaml`:

   ```yaml
   rag:
     byok:
       stores:
         - name: rhdh-docs
           type: external # or vector_store
           url: http://rag-service:8081
   ```

3. Verify that LCORE can query the store via `file_search` tool type
   in the Responses API, or document what custom API is needed.
4. Measure resource consumption and latency (see Section 4).

**Key unknowns:**

- Does `rag.byok.stores` support an `external` or `url` store type that
  LCORE queries via HTTP? If not, a custom retrieval API is needed, and
  Candidate A is **blocked** pending LCORE commitment.
- Deployment ownership: who builds, publishes, and maintains this container?
- Disconnected installation: the container image must include both the
  embedding model and the pre-built index, with no init-container download.

### 2.2 Candidate B — Prebuilt Content/Vector-Store Image Consumed by LCORE

**Architecture**: An immutable, version-specific OCI image containing
prebuilt vector store artifacts (FAISS index + metadata). LCORE loads
these artifacts directly at startup instead of querying a separate service.

```
┌────────────────┐     ┌──────────────────────────────┐
│ IA Backend     │────▶│ LCORE                        │
│ Plugin         │     │  ┌──────────────────────┐    │
│                │     │  │ BYOK Store: rhdh-docs │    │
│                │     │  │  ┌────────────────┐   │    │
│                │     │  │  │ FAISS index     │   │    │ ← mounted from
│                │     │  │  │ (prebuilt)      │   │    │   rhdh-docs image
│                │     │  │  └────────────────┘   │    │
│                │     │  └──────────────────────┘    │
│                │     │  ┌──────────────────────┐    │
│                │     │  │ Embed model           │    │
│                │     │  │ nomic-embed-text-v1.5 │    │
│                │     │  └──────────────────────┘    │
│                │     └──────────────────────────────┘
└────────────────┘
```

**How it fits the existing contract:**

| Requirement                          | Assessment                                                                                                                                                                                                                                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compatibility with `rag.byok.stores` | **Must verify.** If LCORE's BYOK stores contract supports loading a vector store from a local filesystem path (e.g., a volume mount from the content image), the prebuilt FAISS index can be mounted as a BYOK store. LCORE would then handle query embedding and search via its existing `file_search` pipeline. |
| Disconnected operation               | ✅ All artifacts are baked into the image. No runtime download.                                                                                                                                                                                                                                                   |
| No permanent addition to LCORE image | ✅ The content image is separate from LCORE. Artifacts are volume-mounted, not baked into the LCORE image itself.                                                                                                                                                                                                 |
| Document embeddings at build time    | ✅ The image build pipeline embeds the entire RHDH docs corpus and serializes the FAISS index.                                                                                                                                                                                                                    |
| Query embedding at runtime           | **Depends on LCORE.** If LCORE loads the FAISS index, it must also load the embedding model for query-time embedding. This means the embedding model either ships with LCORE (violates "no permanent addition") or is included in the content image and mounted alongside the index.                              |

**Prototype tasks:**

1. Build an ingestion pipeline that:
   - Fetches the RHDH 2.1 documentation corpus
   - Chunks documents (match existing strategy: auto or 512-token static
     with 50-token overlap)
   - Generates embeddings using `nomic-embed-text-v1.5` (768-dim)
   - Serializes a FAISS index + document metadata to disk
2. Package the output as an OCI image (e.g.,
   `quay.io/redhat-developer/rhdh-docs-vectorstore:2.1`)
3. Configure LCORE to load the FAISS index from a volume mount:

   ```yaml
   rag:
     byok:
       stores:
         - name: rhdh-docs
           type: faiss
           path: /data/rhdh-docs/index
           embedding_model: nomic-embed-text-v1.5
           embedding_dimension: 768
   ```

4. Verify that LCORE can use the prebuilt store for `file_search` tool
   queries without any custom API.
5. Determine how the embedding model is delivered (bundled in content
   image? Loaded from LCORE? Separate model-serving sidecar?).
6. Measure resource consumption and latency (see Section 4).

**Key unknowns:**

- Does `rag.byok.stores` support a `faiss` or `local` store type with
  a filesystem path? This is the critical gate.
- How is the embedding model delivered for query-time embedding? Options:
  - Bundled in the content image and mounted into LCORE's filesystem
  - Already loaded by LCORE for other purposes (e.g., Notebooks)
  - Delivered via a separate model-serving container
- Init container risk: if the content image is loaded via an init
  container, this requires Product Security review and VP-level approval
  (per the spike scope boundary). Alternative delivery mechanisms
  (volume mount from a sidecar, operator-managed PVC) must be evaluated.

---

## 3. Comparison Matrix

| Criterion                  | Candidate A (Standalone Service)                    | Candidate B (Prebuilt Image)                             |
| -------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| **BYOK compatibility**     | Requires HTTP-based BYOK store type or custom API   | Requires filesystem-based BYOK store type                |
| **Deployment footprint**   | Separate container (CPU + memory for model + index) | Volume mount only (no extra container at runtime)        |
| **Image size**             | Container image with Python runtime + model + index | Data-only image with index (+ model if bundled)          |
| **Cold startup**           | Service startup: load model + index into memory     | LCORE startup: mmap or load index from volume            |
| **Runtime resources**      | Dedicated CPU/memory for embedding + search         | Shared with LCORE process                                |
| **Operational complexity** | New service to deploy, monitor, and maintain        | Only image build pipeline; LCORE handles runtime         |
| **Disconnected install**   | ✅ Self-contained image                             | ✅ Self-contained image                                  |
| **No LCORE image change**  | ✅ Separate service                                 | ✅ Volume mount, not image modification                  |
| **Upgrade path**           | Rebuild and redeploy service container              | Rebuild content image, restart LCORE to remount          |
| **Custom API risk**        | ⚠️ May require LCORE commitment for new API         | ✅ Uses existing file_search pipeline if compat          |
| **Init container risk**    | N/A (standalone container)                          | ⚠️ Product Security + VP approval if init container used |

---

## 4. Evaluation Methodology

### 4.1 Prototype Corpus

Use the latest available RHDH 2.1 documentation as the spike prototype
corpus. The production implementation will rebuild with final RHDH 2.2
documentation.

**Corpus preparation:**

1. Collect all RHDH 2.1 documentation sources (AsciiDoc/Markdown from
   the product docs repository)
2. Convert to plain text/markdown (reuse `markitdownClient` patterns
   from the Notebooks feature if applicable)
3. Chunk using the same strategy as the existing Notebooks feature:
   - Auto chunking (default), or
   - Static: 512 tokens max, 50-token overlap
4. Generate embeddings using `nomic-embed-text-v1.5` (768-dim) to match
   the existing embedding configuration

### 4.2 Evaluation Set

Build a redistributable retrieval evaluation set covering:

- **Factual questions** about RHDH features, configuration, and
  troubleshooting
- **Multi-document questions** requiring synthesis across sources
- **Edge cases**: questions with no answer in the corpus (should return
  empty or low-confidence results)

Minimum 50 question-answer pairs with manually curated ground-truth
relevant documents.

### 4.3 Measurements

All measurements apply to both candidates using the same RHDH 2.1 corpus
and evaluation set.

| Metric                        | How to measure                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Image size**                | `docker image inspect --format='{{.Size}}'` for each image                                                  |
| **Cold pull**                 | `time docker pull <image>` from Quay on a clean node                                                        |
| **Startup time**              | Time from container start to first successful health check                                                  |
| **CPU usage**                 | `kubectl top pod` during idle and under query load                                                          |
| **Memory usage**              | `kubectl top pod` peak RSS during index load and query                                                      |
| **P50/P95/P99 query latency** | End-to-end from plugin HTTP request to first retrieved chunk, measured via the evaluation set (50+ queries) |
| **Retrieval relevance**       | Recall@k, MRR (Mean Reciprocal Rank), and NDCG@10 against ground-truth evaluation set                       |

### 4.4 Testing Procedure

#### Step 1: BYOK Compatibility Gate

Before proceeding to full prototype measurement, both candidates
**must** demonstrate compatibility with LCORE's existing
`rag.byok.stores` contract.

**Test for Candidate A:**

```bash
# 1. Start the standalone RAG service
docker run -p 8081:8081 rag-service:prototype

# 2. Configure LCORE lightspeed-stack.yaml with a BYOK store pointing
#    to the service URL
# 3. Start LCORE
# 4. Send a test query via the IA backend:
curl -X POST http://localhost:8080/v1/responses \
  -H 'Content-Type: application/json' \
  -d '{
    "input": "How do I configure dynamic plugins in RHDH?",
    "tools": [{"type": "file_search", "vector_store_ids": ["rhdh-docs"]}],
    "model": "test-provider/test-model",
    "stream": false
  }'
# 5. Verify the response includes retrieved context from RHDH docs
```

**Test for Candidate B:**

```bash
# 1. Build the content image with prebuilt FAISS index
docker build -t rhdh-docs-vectorstore:prototype .

# 2. Mount the content image artifacts into LCORE's data directory
docker run -v rhdh-docs-data:/data/rhdh-docs rhdh-docs-vectorstore:prototype
# 3. Configure LCORE lightspeed-stack.yaml with a BYOK store pointing
#    to the local path
# 4. Start LCORE with the volume mount
# 5. Send the same test query as Candidate A
# 6. Verify the response includes retrieved context from RHDH docs
```

If neither candidate can use the existing `rag.byok.stores` contract
(the `file_search` tool does not route to the external/local store),
the outcome is **no-go**.

#### Step 2: Prototype Measurement

For each candidate that passes the BYOK gate:

1. Deploy in a representative environment (OpenShift cluster or
   equivalent)
2. Run the evaluation set (50+ queries) three times
3. Collect all metrics from Section 4.3
4. Compare against the current OKP-based baseline (if RHIDP-14137
   historical data is available)

#### Step 3: Disconnected Validation

1. Air-gap the test environment (block external network)
2. Pull the candidate image from an internal mirror
3. Start the candidate without internet access
4. Run a subset of evaluation queries
5. Verify identical results to the connected test

---

## 5. Decision Criteria

The spike outcome is one of:

1. **Candidate A** — standalone RAG service is the selected architecture
2. **Candidate B** — prebuilt content image is the selected architecture
3. **No-go** — neither candidate can use the existing `rag.byok.stores`
   contract, or no supportable embedding-model delivery mechanism exists

### Decision gates (in order):

1. **BYOK compatibility**: Can the candidate register with LCORE's
   `rag.byok.stores` and be queried via `file_search`? If no → no-go.
2. **Embedding model delivery**: Can the embedding model be delivered
   without a runtime download and without permanently adding it to
   the LCORE image? If no → no-go.
3. **Resource budgets**: Does the candidate fit within acceptable CPU,
   memory, and image-size budgets for RHDH 2.2?
4. **Disconnected operation**: Does it work in air-gapped environments?
5. **Operational complexity**: Is the deployment, upgrade, and ownership
   model sustainable?

### BYOK-only outcome

If both candidates are viable but the team determines that only a
BYOK-only solution (users bring their own RAG configuration rather than
RHDH shipping one) meets the constraints, this requires explicit product
and release approval plus OpenSpec and Jira rebaselining per
RHDHPLAN-1866.

---

## 6. Decision Record Template

After completing prototyping and measurement, fill in:

| Field                        | Value                                                |
| ---------------------------- | ---------------------------------------------------- |
| **Selected architecture**    | Candidate A / Candidate B / No-go                    |
| **Embedding model**          | e.g., nomic-embed-text-v1.5                          |
| **Embedding dimension**      | e.g., 768                                            |
| **Vector-store engine**      | e.g., FAISS / Qdrant / Chroma                        |
| **Delivery mechanism**       | e.g., Sidecar volume mount / BYOK config             |
| **API surface**              | e.g., OpenAI-compatible /v1/vector-stores            |
| **Ingestion pipeline**       | e.g., GitHub Actions workflow in repo X              |
| **Repository**               | e.g., quay.io/redhat-developer/rhdh-docs-vectorstore |
| **Ownership**                | e.g., Intelligent Assistant team                     |
| **Release responsibilities** | e.g., Built per RHDH minor release                   |
| **Disconnected behavior**    | e.g., Fully self-contained, no runtime downloads     |
| **Image size**               | e.g., 450 MB                                         |
| **Startup time**             | e.g., 12s to first query                             |
| **Memory (idle/peak)**       | e.g., 200 MB / 450 MB                                |
| **P50/P95/P99 latency**      | e.g., 120ms / 250ms / 400ms                          |
| **Retrieval relevance**      | e.g., Recall@5 = 0.82, MRR = 0.71                    |
| **BYOK suitability**         | e.g., Also usable as a BYOK pattern for customers    |
| **Evaluation set location**  | e.g., redhat-developer/rhdh-rag-eval                 |

---

## 7. References

- **RHDHPLAN-1866**: Parent feature — remove product-managed OKP from RHDH 2.2
- **RHIDP-18494**: Parent epic
- **RHIDP-14137**: (Closed) Historical FAISS RAG baseline data — do not reopen
- **RHDHPLAN-1828**: Aligned performance-measurement methodology
- **redhat-developer/agentic-feature-refinement PR #51**: Merged OpenSpec
  identifying architecture selection as first workstream
- **lightspeed-stack repository**: LCORE configuration and deployment
  (lightspeed-stack.yaml format)
- **VectorStoresOperator**: `workspaces/intelligent-assistant/plugins/intelligent-assistant-backend/src/service/notebooks/VectorStoresOperator.ts`
- **notebooksRouter**: `workspaces/intelligent-assistant/plugins/intelligent-assistant-backend/src/service/notebooks/notebooksRouters.ts`
- **DocumentService**: `workspaces/intelligent-assistant/plugins/intelligent-assistant-backend/src/service/notebooks/documents/documentService.ts`
- **config.d.ts**: `workspaces/intelligent-assistant/plugins/intelligent-assistant-backend/config.d.ts`
