# Augment: Outcomes and Use Cases That Customers Value

**Audience:** Red Hat Developer Hub product leadership, field teams, customer-facing stakeholders
**Status:** Based on production-deployed codebase (April 2026)

> For platform capabilities and technical architecture, see [Augment Platform](augment-platform.md).

---

## What Augment Is

Augment is an agentic AI platform embedded in Red Hat Developer Hub. It lets organizations run **multiple specialist AI agents** that collaborate to help developers — reasoning over questions, executing operations against live infrastructure, and synthesizing answers grounded in real data.

The platform is **agent framework-agnostic**:

- **Define agents in configuration** — create specialist agents with their own instructions, tools, model, and knowledge base via YAML or the admin UI. An in-process orchestration layer (ADK) runs multi-agent workflows on top of Llama Stack's inference APIs.
- **Bring your own agents** — deploy agents built in any framework (LangGraph, CrewAI, custom Python, or any A2A-compatible service) as Kubernetes workloads. Kagenti manages them, and Augment lists them from Kagenti's API in an agent gallery for developers.

Augment connects to **Llama Stack** (inference, RAG, safety APIs) and **Kagenti** (remote agent management, discovery, centralized tool gateway) via their APIs. Everything runs on the customer's own infrastructure. No data leaves the customer's environment.

---

## Outcomes

### 1. Specialist agents collaborate on complex tasks

This is not a single chatbot. Augment supports multiple specialist agents, each with its own purpose, tools, and knowledge. In the Llama Stack path, a router agent can be configured as the default entry point — it receives the first message and delegates to the right specialist. In the Kagenti path, developers pick a specialist directly from the agent gallery. Either way, handoffs happen mid-conversation — the developer sees which agent is working and why.

What this looks like:

- A developer asks about containerizing an app. The router recognizes it as a migration topic and hands off to the migration specialist — the developer sees a real-time divider showing the handoff. Subsequent messages in the conversation continue with the active specialist, not back through the router.
- The migration specialist has access to migration documentation and the OpenShift cluster. It retrieves relevant guide sections, generates manifests, and can apply them to the cluster with the developer's approval.
- If the developer then asks about monitoring, the active agent can hand off to an ops specialist with different tools and a different knowledge base — all in the same conversation.

Adding a new specialist is a configuration change. No code, no redeployment — just define the agent's name, instructions, tool access, and knowledge base in YAML or the admin UI.

**Platform capabilities at work:** Multi-Agent Orchestration, MCP Tool Connectivity, Runtime Configuration.

### 2. Teams bring their own agents in any framework

The platform does not lock teams into a single agent framework. Via Kagenti, teams build agents in LangGraph, CrewAI, custom Python, or any framework that supports the A2A protocol — and deploy them as standard Kubernetes workloads. The Augment plugin lists agents from Kagenti's API and surfaces them in an agent gallery for developers.

What the platform team gets:

- **Agent gallery.** When Kagenti is the active provider, developers browse, search, and pin favorites across all Kagenti-managed agents. Admins control visibility, display names, avatars, and featured agents via the Chat Experience panel.
- **Centralized governance.** When configured with Kagenti's MCP gateway, all tool traffic flows through a single control point — one place to manage tool access, observe usage (distributed tracing), enforce policy, and issue workload identity (X.509 certificates via SPIFFE/SPIRE per agent pod).
- **Full lifecycle management.** The Augment admin panel supports creating/deleting agents, triggering container builds (Shipwright), monitoring build pipelines, and managing sandbox sessions.

**Platform capabilities at work:** Provider Abstraction (Kagenti), Multi-Agent Orchestration, Safety and Governance.

### 3. Agents act on live infrastructure

Agents don't just answer questions — they execute. Connected via MCP (Model Context Protocol), agents can inspect clusters, apply manifests, query databases, call external APIs, and run operations against any system that speaks the protocol. In backend execution mode, the platform queries each MCP server's tool list automatically; in direct mode, Llama Stack handles tool discovery and execution.

The answer is not "you might try checking your logs" — it is "your pods in namespace prod-payments are OOMKilled because memory limit is 256Mi but the app uses 380Mi at startup," because the agent just called `get_pods`, `get_events`, and `get_pod_logs` against the live cluster.

**Platform capabilities at work:** MCP Tool Connectivity, Multi-Agent Orchestration, Streaming Chat UX.

### 4. Sensitive operations stay under human control

When an agent proposes a destructive or sensitive action — applying a Kubernetes manifest, deleting a resource, modifying a configuration — the developer is presented with an approval dialog showing exactly what the agent wants to do.

What the developer gets:

- **Full transparency.** The approval dialog shows the tool name, the target system, and the exact arguments the agent wants to send.
- **Edit before approve.** The developer can modify the arguments before approving. Change a namespace, adjust a resource limit, fix a typo — then approve.
- **Reject the action.** The developer can reject the tool call. The agent receives the rejection and adjusts its approach — proposing an alternative or asking for clarification.
- **No surprise actions.** The platform team controls which tools require approval and at what granularity — per server, per tool, or blanket approval for everything.

Beyond tool approval, the platform supports structured human input: form cards for typed data (namespace, parameters), auth cards when external sign-in is needed, and secrets cards for credentials.

**Platform capabilities at work:** Human-in-the-Loop, MCP Tool Connectivity, Safety and Governance.

### 5. Agents are grounded in customer knowledge

When an agent needs documentation context, it uses agentic RAG — the agent decides when retrieval is relevant, searches the customer's own knowledge base, and synthesizes an answer with sources shown alongside. This is one tool agents use, not the whole experience.

Platform admins manage knowledge without touching the deployment:

- **Ingest from anywhere.** Upload files via drag-and-drop, connect GitHub repos (private or public, with path filters and glob patterns), or fetch from URLs. Documents auto-sync on a configurable schedule — new files added, changed files updated, deleted files removed.
- **Per-agent knowledge.** Different agents can search different knowledge bases. The migration agent searches migration docs; the ops agent searches runbooks.
- **Test before shipping.** A built-in RAG playground lets admins test search queries, see retrieved chunks with relevance scores, and adjust thresholds before developers see the results. Search mode (semantic, keyword, or hybrid) is configurable per vector store.

**Platform capabilities at work:** RAG / Knowledge Management, Multi-Agent Orchestration, Runtime Configuration.

### 6. Enterprise security is built in, not bolted on

The platform team controls who can access what, what agents can do, and what data is retained:

- **Access control.** Chat access and admin access are gated by Backstage RBAC, mapped to Keycloak groups. Only authorized users interact with agents; only admins configure them.
- **Content safety.** Input and output filtering via safety shields — prompt injection detection, harmful content filtering, destructive command detection. Configurable per shield, with fail-open or fail-closed behavior.
- **Network protection.** All backend HTTP calls are protected against server-side request forgery (SSRF), including DNS resolution checks to prevent rebinding attacks.
- **Zero Data Retention.** For organizations with strict data retention policies, ZDR mode ensures responses are not stored on the inference server. Conversation continuity is maintained via encrypted reasoning tokens returned to the client, rather than full server-side transcripts.
- **Tool authentication.** Tool connections support multiple authentication methods — OAuth client credentials, Kubernetes service account tokens, static headers, or infrastructure-level mTLS in Kagenti mode. The platform team controls which method each tool uses.

**Platform capabilities at work:** Safety and Governance, MCP Tool Connectivity (auth chain), Runtime Configuration.

### 7. The entire experience is white-labeled

The portal team customizes everything the developer sees — application name, logo, colors, welcome screen, prompt suggestions, agent gallery — all from the admin UI at runtime. The developer sees a branded experience that matches their organization, not a generic chatbot.

**Platform capabilities at work:** Branding and White-Labeling, Runtime Configuration.

---

## Use Cases

### Application Migration to OpenShift

**Persona:** Developer migrating a legacy application to OpenShift

**The problem:** Migration is high-friction, documentation-heavy, and error-prone. Developers spend days reading guides, writing Dockerfiles, crafting manifests, and debugging deployment issues.

**What happens with Augment:**

1. Developer opens Augment in RHDH. The welcome screen shows prompt cards for common migration tasks.

2. Developer types: "I need to containerize my Spring Boot app and deploy it to OpenShift."

3. The router agent recognizes this as a migration topic and hands off to the migration specialist. The developer sees a divider: "Handed off from Router to Migration Assistant."

4. The migration agent searches the knowledge base (ingested with Red Hat migration guides) and combines what it finds with its instructions to provide Dockerfile best practices for OpenShift (non-root, UBI base images), deployment manifest generation, Route/Service configuration, and health check setup.

5. When the developer says "create the deployment on my cluster," the agent proposes the exact manifest and waits for approval. The developer reviews, edits if needed, and approves.

6. The conversation persists — the developer can return tomorrow and ask follow-up questions.

**Why this is valuable:** A specialist agent that combines documentation knowledge with live cluster access reduces time-to-first-deployment from days to hours.

**Platform capabilities at work:** Multi-Agent Orchestration, RAG, MCP Tool Connectivity, Human-in-the-Loop, Persistent Conversations.

### OpenShift Operations and Troubleshooting

**Persona:** Developer or SRE debugging a failing deployment

**The problem:** Diagnosing cluster issues requires knowing the right `kubectl` commands, understanding event schemas, parsing log formats, and cross-referencing documentation. Junior developers are blocked; senior engineers spend time on repetitive investigation.

**What happens with Augment:**

1. Developer asks: "My pods in namespace prod-payments keep crashing. What's wrong?"

2. The router hands off to the cluster operations specialist.

3. The ops agent inspects the cluster — listing pods and their status, fetching recent events, reading container logs, checking resource limits vs. actual usage. Each step appears in real time in the streaming UI.

4. The agent synthesizes: "Your pods are OOMKilled. The memory limit is 256Mi but the app is using 380Mi at startup. You can fix this by increasing the memory limit." The answer includes links to the relevant troubleshooting runbook from the knowledge base.

5. If the developer says "increase the memory limit to 512Mi," the agent proposes the change and waits for approval.

**Why this is valuable:** The developer never leaves RHDH. The ops agent does the investigation and proposes the fix — with approval before any change is applied.

**Platform capabilities at work:** Multi-Agent Orchestration, MCP Tool Connectivity, RAG, Human-in-the-Loop, Streaming Chat UX.

### Multi-Framework Agent Collaboration

**Persona:** Platform team operating a multi-team, multi-framework environment

**The problem:** Different teams want to build agents in different frameworks. Without centralized governance, tool access is fragmented, security is inconsistent, and observability is nonexistent.

**What happens with Augment:**

1. The platform team deploys Kagenti alongside RHDH. The Augment plugin connects to Kagenti as its provider.

2. Different teams build specialized agents in their preferred frameworks — LangGraph for a security scanner, CrewAI for a cost optimizer, a custom Python service for code review — and deploy them as standard Kubernetes workloads.

3. The Augment agent gallery lists all agents available through Kagenti. The Augment plugin queries Kagenti's API to list agents and caches their agent cards for the gallery UI. Developers see all available agents in one place.

4. When configured with a centralized MCP gateway, all tool traffic flows through a single control point. The platform team has one place to manage tool access, observe tool usage (distributed tracing), enforce policy, and issue infrastructure-level workload identity (X.509 certificates via SPIFFE/SPIRE per agent pod).

5. The Augment admin panel provides full lifecycle management: create/delete agents, trigger container builds, monitor build pipelines, manage sandbox sessions.

**Why this is valuable:** Different teams build agents independently in any framework. The platform team gets centralized governance, observability, and security. The developer gets a unified experience.

**Platform capabilities at work:** Provider Abstraction (Kagenti), Multi-Agent Orchestration, Safety and Governance.

### Internal Knowledge Q&A

**Persona:** Any developer on the platform

**The problem:** Tribal knowledge and scattered documentation are the top productivity killers in large engineering organizations. Developers don't know where to look, and the answer is often buried in a Google Doc, a Confluence page, or someone's head.

**What happens with Augment:**

1. The platform team connects internal documentation — engineering docs, runbooks, onboarding guides — to Augment. Documents auto-sync hourly from GitHub repos.

2. Developer asks: "How do we handle database migrations in the payments service?"

3. The agent searches the knowledge base. The developer sees "Searching knowledge base..." in real time. The agent synthesizes an answer with citations to the source documents. The developer can expand RAG sources to see the raw chunks, filenames, and relevance scores.

4. Developer drills down: "Show me the rollback procedure." The agent retrieves the specific runbook section.

**Why this is valuable:** Agents grounded in the customer's documentation surface the right answer from the right document. Automatic sync keeps the knowledge base current as docs are updated.

**Platform capabilities at work:** RAG / Knowledge Management, Multi-Agent Orchestration, Streaming Chat UX, Persistent Conversations.

---

## What Makes This Different

1. **Agents, not a chatbot.** Multiple specialist agents collaborate on complex tasks. They hand off mid-conversation without losing context. Each agent has its own tools, knowledge, and instructions.

2. **Any framework.** Teams build agents in LangGraph, CrewAI, custom Python, or any A2A-compatible framework and deploy them as Kubernetes workloads. Kagenti manages them; Augment surfaces them in a gallery for developers.

3. **Agents that act.** Agents call tools against live systems — inspecting clusters, applying manifests, querying databases. Every action is visible to the developer and requires approval for sensitive operations.

4. **Human in the loop.** Sensitive operations require explicit developer approval. The developer sees exactly what the agent wants to do and can edit the parameters before approving.

5. **Grounded in customer data.** Agents use agentic RAG — searching customer documentation when needed, with sources shown alongside the answer. Automatic sync keeps knowledge current.

6. **Governed.** Access control, content safety, SSRF protection, per-tool approval policies, Zero Data Retention mode. The platform team controls everything.

7. **On your infrastructure.** Your models, your GPUs, your data stays yours. No external API calls for inference. Llama Stack serves any compatible model.

---

## Questions

| Question                          | Answer                                                                                                                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How do we add a new use case?     | Configure a new agent with instructions, tool access, and a knowledge base. No code changes, no redeployment.                                                               |
| Can teams bring their own agents? | Yes — deploy agents built in any framework as Kubernetes workloads via Kagenti. They appear in the agent gallery automatically.                                             |
| What models does it support?      | Any model served by Llama Stack's Responses API — Llama 3.3 is the default, but any compatible model works. Model is a configuration parameter, changeable per agent.       |
| How does it handle multi-tenancy? | Namespace-based scoping in Kagenti mode with namespace allowlists. Backstage identity scoping in all modes.                                                                 |
| What about audit and compliance?  | Safety shields log violations. Approval decisions are stored in session history. ZDR mode for data retention compliance.                                                    |
| What about cost/token control?    | Token usage shown in the UI. Configurable caps on output tokens, tool calls, and agent turns prevent runaway loops.                                                         |
| What is the deployment footprint? | RHDH plugin + Llama Stack server + PostgreSQL. Optional Kagenti platform for multi-framework agent governance.                                                              |
| What if the AI server goes down?  | The UI shows a provider-offline banner. Config and sessions are unaffected. Chat resumes when the server recovers. Provider can be hot-swapped to a backup without restart. |
