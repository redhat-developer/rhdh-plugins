# Fullsend AI Review Pilot

## What is fullsend?

[Fullsend](https://github.com/fullsend-ai/fullsend) is an agentic SDLC platform that provides AI-powered agents for triage, code review, code generation, and retrospectives. It runs as a GitHub Actions pipeline, triggered by GitHub events, and uses Vertex AI (Anthropic Claude) for inference.

This repo uses fullsend in **review-only pilot mode** — only the Review agent is enabled, scoped to a subset of workspaces.

## Pilot scope

### Enabled workspaces

| Workspace | Why |
|-----------|-----|
| `workspaces/ai-integrations/` | AI-related plugins — team is familiar with agent tooling |
| `workspaces/lightspeed/` | AI assistant plugin — natural fit for agent-assisted review |
| `workspaces/mcp-integrations/` | MCP plugin — new workspace, benefits from early review coverage |

### What runs

- **Review agent** — auto-triggers on `pull_request_target` (opened, synchronize, ready_for_review)
- Only PRs touching files in the pilot workspaces trigger the agent (GitHub Actions `paths` filter)

### What does NOT run (and why)

| Agent | Why disabled |
|-------|-------------|
| Triage | Not needed — rhdh-plugins doesn't use issue-driven workflows |
| Coder | Sandbox timeout issue upstream (fullsend #1bf016d9), and not needed for the pilot |
| Fix | Depends on coder agent; also not needed for pilot |
| Retro / Prioritize | Out of scope for initial pilot |
| **Slash commands** | **Security risk** — rhdh-plugins is a public repo. Fullsend's triage/code/review agents have no authorization check on slash commands. Any external user posting `/fs-review`, `/fs-code`, or `/fs-triage` would trigger Vertex AI inference on our GCP project, burning tokens. The `issue_comment` trigger is intentionally omitted. |

## Coexistence with PR Agent

rhdh-plugins already has [PR Agent](https://github.com/Codium-ai/pr-agent) configured (`.pr_agent.toml`). Both agents run independently on PRs in the pilot workspaces:

- **PR Agent** — runs on all PRs across the entire repo
- **Fullsend Review** — runs only on PRs touching pilot workspaces

This parallel setup allows comparing review quality between the two agents. Neither blocks the other. PR Agent configuration is not modified by this pilot.

## How to expand to more workspaces

Add paths to the `paths` filter in `.github/workflows/fullsend.yaml`:

```yaml
on:
  pull_request_target:
    types: [opened, synchronize, ready_for_review]
    paths:
      - "workspaces/ai-integrations/**"
      - "workspaces/lightspeed/**"
      - "workspaces/mcp-integrations/**"
      - "workspaces/your-new-workspace/**"  # add here
```

To enable fullsend for ALL workspaces, remove the `paths` filter entirely.

## How to enable slash commands safely

If the repo were private, or if fullsend adds an authorization check on slash commands, re-enable by adding to `.github/workflows/fullsend.yaml`:

```yaml
on:
  issue_comment:
    types: [created]
  # ... existing triggers
```

And add the bot-comment filter to the dispatch job:

```yaml
if: >-
  github.event_name != 'issue_comment'
  || github.event.comment.user.type != 'Bot'
```

Until then, slash commands remain disabled for external safety.

## Authorization model

### CODEOWNERS protection

The `.fullsend/` directory and `.github/workflows/fullsend.yaml` are protected via CODEOWNERS, requiring maintainer approval for any changes. This prevents agents from modifying their own configuration.

### GitHub branch protection

`require_code_owner_reviews: true` on the default branch ensures CODEOWNERS rules are enforced. This is the actual merge safety layer — independent of fullsend.

### Inference authentication

Fullsend uses GCP Workload Identity Federation (WIF) to authenticate GitHub Actions runs against Vertex AI. The WIF provider is scoped to this specific repo. Credentials are stored as GitHub secrets, not in committed files.

## Configuration files

| Path | Purpose |
|------|---------|
| `.fullsend/config.yaml` | Declares enabled roles (`review` only) |
| `.fullsend/customized/` | Scaffold for future agent customization (agents, harness, policies, schemas, env, scripts, skills) |
| `.github/workflows/fullsend.yaml` | Event shim — routes `pull_request_target` to fullsend's reusable workflows |

## Debugging

### Layer 1: Workflow logs

```bash
gh run list --workflow=fullsend.yaml --repo redhat-developer/rhdh-plugins
gh run view <run-id> --repo redhat-developer/rhdh-plugins --log
```

### Layer 2: Agent transcripts

```bash
gh run download <run-id> --repo redhat-developer/rhdh-plugins -n transcript
```

### Layer 3: Sandbox logs

Available in the workflow run logs under the sandbox creation step. Look for `fullsend run` output.

### Common issues

| Symptom | Likely cause |
|---------|-------------|
| Workflow doesn't trigger | PR doesn't touch files in pilot workspace paths |
| 403 from mint | Repo not in mint's `ALLOWED_ORGS` — contact fullsend team |
| `aiplatform.endpoints.predict` denied | WIF IAM binding missing on GCP project |
| Agent produces no review | Check transcript artifact for agent errors |

## Reference

For a comprehensive deep-dive into fullsend agents, customization, and debugging, see the [fullsend-agents.md](https://github.com/redhat-developer/rhdh-agentic/blob/main/docs/fullsend-agents.md) in rhdh-agentic.
