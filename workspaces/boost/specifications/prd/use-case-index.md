# Use Case Index

**Product:** Boost — Agentic Developer Portal for Red Hat Developer Hub
**Updated:** 2026-06-30

Concise reference for all use cases across the PRDs. For detailed descriptions, see the owning PRD.

---

## Foundation

| Item | Title                 | Priority | Description                                                                                                                                                           |
| ---- | --------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —    | AI Catalog Foundation | P0       | NFS frontend plugin, `/ai-catalog` route scaffold, local dev shell — prerequisite for UC-4/UC-9 gallery UX. See [ai-catalog-foundation.md](ai-catalog-foundation.md). |

## AI Chat & Interaction Experience

| UC   | Title                            | Priority | Description                                                                                                             |
| ---- | -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| UC-1 | Streaming Chat                   | P0       | Ask a question, receive a streamed answer from a specialist AI agent with real-time phase indicators and rich rendering |
| UC-2 | Knowledge-Grounded Answers (RAG) | P0       | Ask about internal docs/runbooks, receive an answer grounded in the org's knowledge base with source citations          |
| UC-3 | Human-in-the-Loop Approval       | P0       | Review a proposed agent action (tool call) before execution — edit parameters, approve, or reject                       |
| UC-5 | Conversation History             | P0       | Return to past conversations, search, provide feedback, edit/regenerate, export                                         |
| UC-6 | Debug & Inspect Execution        | P2       | Execution trace panel, message inspector, session state inspector for agent transparency                                |

## Agent Creation & Discovery

| UC    | Title                        | Priority | Description                                                                                   |
| ----- | ---------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| UC-4  | Browse and Select an Agent   | P1       | Discover agents in the gallery, evaluate capabilities, select one to start a conversation     |
| UC-7  | Create an Agent (umbrella)   | P0       | Four creation paths converge on unified ChatAgent model: no-code, template, DevSpaces, import |
| UC-8  | No-Code Agent Builder        | P0       | Create an agent visually — purpose, tools, knowledge base, handoffs — without writing code    |
| UC-9  | Discover Agents in Gallery   | P1       | Browse curated collection of pre-built agents with rich metadata and preview panels           |
| UC-10 | Agent from Software Template | P1       | Bootstrap agent project via Backstage scaffolder with boilerplate, CI/CD, and registration    |
| UC-11 | Agent from DevSpaces         | P1       | Write agent code in cloud IDE, build container, deploy to Kagenti                             |
| UC-12 | Import Existing Agent        | P0       | Bring an already-built agent (container image or source repo) into Boost                      |
| UC-13 | Configure MCP Tools          | P1       | Register MCP servers, configure auth (4-level chain), set tool approval policies              |

## Pluggable AI Platform Architecture

| UC    | Title                         | Priority | Description                                                                                                    |
| ----- | ----------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| UC-14 | Integrate a New AI Provider   | P1       | Implement AgenticProvider interface, create backend module, register via extension point — zero source changes |
| UC-16 | Switch AI Provider at Runtime | P0       | Hot-swap between providers with rollback on failure; frontend auto-adapts via capability gating                |

## Platform Operations & Deployment

| UC    | Title                                  | Priority | Description                                                                                             |
| ----- | -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| UC-15 | Deploy Boost                           | P0       | Install and configure in RHDH (dynamic plugins) or vanilla Backstage (static plugins)                   |
| UC-17 | Manage Platform Agents & Orchestration | P0       | Create, edit, delete agents and orchestration rules from the admin panel                                |
| UC-18 | Configure RAG Knowledge Pipelines      | P0       | Ingest docs into vector stores — GitHub, URL, file upload — with change detection and per-agent scoping |
| UC-21 | Manage Runtime Configuration           | P0       | Change model, prompts, tools, caps at runtime via admin panel — 25+ keys, immediate effect              |
| UC-22 | White-Label the Portal                 | P1       | Customize name, logo, colors, prompt groups, featured agents — all at runtime                           |

## Security, Safety & Governance

| UC    | Title                               | Priority | Description                                                                                          |
| ----- | ----------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| UC-19 | Safety Shields and Guardrails       | P1       | Content safety filtering on inputs/outputs — prompt injection, harmful content, destructive commands |
| UC-20 | Security Posture and Access Control | P0       | Three security modes, 16 fine-grained RBAC permissions, MCP auth chain, SSRF protection, ZDR mode    |
| UC-23 | Agent Lifecycle Governance          | P0       | 4-stage lifecycle (Draft→Pending→Published→Archived) with ownership, approval workflows              |
| UC-24 | Approval Workflow (SonataFlow)      | P0       | Dual-mode approval — built-in transitions or SonataFlow-managed with CloudEvents                     |
| UC-25 | Self-Approval Prevention            | P0       | Separation of duties — agent creator cannot approve their own agent for publication                  |

---

## Summary

| PRD                                | Use Cases                                          | P0 Count  |
| ---------------------------------- | -------------------------------------------------- | --------- |
| AI Catalog Foundation              | (prerequisite for UC-4, UC-9, UC-15)               | 1         |
| AI Chat & Interaction Experience   | UC-1, UC-2, UC-3, UC-5, UC-6                       | 4         |
| Agent Creation & Discovery         | UC-4, UC-7, UC-8, UC-9, UC-10, UC-11, UC-12, UC-13 | 3         |
| Pluggable AI Platform Architecture | UC-14, UC-16                                       | 1         |
| Platform Operations & Deployment   | UC-15, UC-17, UC-18, UC-21, UC-22                  | 4         |
| Security, Safety & Governance      | UC-19, UC-20, UC-23, UC-24, UC-25                  | 4         |
| **Total**                          | **25 use cases**                                   | **16 P0** |

## Diagram Reference

All use case flow diagrams are in `use-case-flow-diagrams/`. Updated May 26 versions (suffix `-may26`) exist for: UC-4, UC-7, UC-9, UC-17, UC-20. Use cases UC-23, UC-24, UC-25 were added May 26.
