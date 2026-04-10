# Augment Demo Walkthrough

**Purpose:** Walk a Red Hat Developer Hub PM through the key outcomes in a live or recorded demo.
**Duration:** 15-20 minutes
**Prerequisite:** Augment deployed on RHDH with at least one MCP server (e.g., kubernetes-mcp-server) and documents ingested.

---

## Scene 1: First Impressions (2 min)

**What you show:** The welcome screen

**Talking points:**

- Open RHDH and navigate to Augment. The branded welcome screen appears with the customer's logo, name, and colors — all configured from the admin UI, no code.
- Point out the prompt groups: organized cards (e.g., "Migration," "Troubleshooting," "Knowledge") that guide developers toward common tasks.
- Point out the agent gallery: developers can browse available specialist agents, pin favorites, and read descriptions before starting a conversation.
- Call out: "Everything you see here — the name, the colors, the prompt cards, which agents appear — is configurable by the platform team at runtime."

**Key outcome demonstrated:** White-labeled, governed developer experience

---

## Scene 2: Knowledge Q&A with RAG (3 min)

**What you show:** Ask a documentation question

**Script:**

1. Type: "How should I configure liveness probes for a Spring Boot app on OpenShift?"
2. As the response streams, point out the "Searching knowledge base..." indicator in the streaming UI — the model is retrieving from ingested documentation, not making things up.
3. When the response appears, expand the RAG sources section. Show the chunk text, filename, and relevance score.
4. Say: "This answer is grounded in the customer's own documentation. The platform team ingested these docs from a GitHub repo, and they sync automatically every hour. If someone updates a runbook tomorrow, the knowledge base updates without anyone doing anything."

**Key outcome demonstrated:** Grounded answers from customer documentation, not hallucination

---

## Scene 3: Multi-Agent Handoff (3 min)

**What you show:** Ask a question that triggers agent routing

**Script:**

1. Type: "My deployment in namespace staging-orders is failing with ImagePullBackOff errors."
2. Point out: the router agent receives this, recognizes it as a cluster operations question, and hands off to the ops specialist. A visual divider appears: "Handed off from Router to Cluster Operations."
3. As the ops agent streams, point out the tool calls appearing in real time: "Calling get_pods on OpenShift Cluster...", "Calling get_events..."
4. Expand a tool call output to show the raw pod/event data.
5. When the answer arrives, say: "The developer asked one question. Behind the scenes, a routing agent identified the right specialist, that specialist called three different tools against the live cluster, and synthesized a diagnosis — all in a few seconds."

**Key outcome demonstrated:** Specialized agents collaborate on complex questions; developer effort is zero

---

## Scene 4: Human-in-the-Loop Approval (3 min)

**What you show:** A tool call that requires approval

**Script:**

1. Following from Scene 3, type: "Fix the image pull secret for me."
2. The agent proposes a `kubectl` command (or MCP tool call) to create/patch the image pull secret.
3. Because the OpenShift MCP server has `requireApproval: always`, the approval dialog appears.
4. Walk through the dialog:
   - Show the tool name and server label
   - Show the arguments (editable JSON)
   - Point out: "The developer can modify the arguments before approving — or reject with a reason."
5. Approve the action. The stream resumes with the tool output.
6. Say: "The platform team decides which tools require approval. This is not an all-or-nothing switch — it's per-server and per-tool. Destructive operations require sign-off. Read-only operations execute automatically."

**Key outcome demonstrated:** Sensitive operations stay under human control

---

## Scene 5: Persistent Conversations (1 min)

**What you show:** Conversation history

**Script:**

1. Open the right sidebar showing conversation history.
2. Point out: grouped sessions, search bar, session timestamps.
3. Click a previous session to show it loads with full message history.
4. Say: "Conversations persist across sessions. The developer can pick up where they left off tomorrow, or next week."

**Key outcome demonstrated:** Continuity across sessions

---

## Scene 6: Admin Panel — Platform Configuration (3 min)

**What you show:** The admin panel (switch to admin view)

**Script:**

1. Click the admin button. Show the Platform tab.
2. **Model connection:** Show the configured model (Llama 3.3 70B), base URL, and the "Test Connection" button. Say: "This is pointing at the customer's own Llama Stack server running on their GPUs. No data leaves the environment."
3. **MCP servers:** Show configured servers with their URLs, auth status, and approval settings. Say: "Each MCP server is a tool endpoint. Adding a new one is configuration, not code."
4. **RAG / Knowledge Base:** Show the vector store, document count, last sync time. Click into the RAG Testing tab and run a quick test query — show chunks and scores.
5. **Safety:** Show safety shields (if configured). Say: "Input shields filter prompt injection. Output shields filter harmful content. The platform team controls this, not the developer."

**Key outcome demonstrated:** Platform teams govern the AI experience centrally

---

## Scene 7: Admin Panel — Agent Management (2 min)

**What you show:** The Agents tab (non-Kagenti) or Kagenti agents panel

**Script:**

1. Show the list of configured agents with their names, descriptions, and tool access.
2. Open one agent's config: instructions, MCP server assignments, vector store linkage, handoff targets.
3. Say: "Adding a new use case is adding a new agent. The platform team writes instructions, assigns tools and knowledge, and the new specialist is immediately available to developers."
4. If showing Kagenti mode, also show: agent gallery configuration (display names, avatars, featured agents, greeting messages).

**Key outcome demonstrated:** New use cases via configuration, not code

---

## Scene 8: Branding (1 min)

**What you show:** The Branding tab

**Script:**

1. Show the Appearance section: app name, tagline, logo URL, color pickers, theme presets.
2. Change the primary color or app name. Show the live preview updating.
3. Say: "The portal team can customize everything the developer sees — no restart required."

**Key outcome demonstrated:** Enterprise white-labeling

---

## Closing Talking Points (2 min)

Wrap up with the five things to remember:

1. **Agents that act, not just answer.** They execute real operations against live systems, with human approval for anything sensitive.

2. **Grounded in customer data.** RAG over the customer's own documentation, synced automatically. Not generic AI — answers from their docs.

3. **Governed by the platform team.** Agents, tools, knowledge, safety, branding — all config-driven, centrally managed.

4. **Runs on customer infrastructure.** Open-source models, their GPUs, their data stays theirs. No external API calls.

5. **No code changes for new use cases.** New specialist agent = new YAML configuration. New knowledge base = new document source. New tool = new MCP server URL.

---

## If the PM Asks About Kagenti Specifically

Add a bonus scene:

**Script:**

1. Show the Kagenti sidebar: namespace picker, agents, tools, builds, sandbox, observability links.
2. Say: "Kagenti adds the infrastructure layer. When agents need to call tools, traffic goes through a centralized Envoy-based MCP gateway. The platform team manages tool access, observability, and security in one place."
3. Show the dashboard links: traces (Phoenix/Jaeger), network (Kiali), MCP inspector.
4. Say: "Every question, every agent decision, every tool call — traceable end to end."
5. Show agent lifecycle: create agent, trigger build (Shipwright), monitor build pipeline.
6. Say: "Different teams can build agents in different frameworks — LangGraph, CrewAI, anything that speaks A2A — and they all appear in the same developer experience."

**Key outcome demonstrated:** Infrastructure-grade governance for AI agents at scale
