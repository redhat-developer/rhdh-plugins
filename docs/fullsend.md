# Fullsend AI Pilot

## What is fullsend?

[Fullsend](https://github.com/fullsend-ai/fullsend) is an agentic SDLC platform that provides AI-powered agents for triage, code review, code generation, and retrospectives. It runs as a GitHub Actions pipeline, triggered by GitHub events, and uses Vertex AI (Anthropic Claude) for inference.

## Pilot scope

### Enabled agents

| Agent | Trigger | How to use |
|-------|---------|------------|
| Triage | `/fs-triage` slash command | Post on any issue |
| Coder | `/fs-code` slash command, or `ready-to-code` label | Post on a triaged issue |
| Review | Auto-triggers on PR open/update | Automatic for `workspaces/scorecard/` PRs |
| Fix | `/fs-fix` slash command, or `changes_requested` review | Post on a PR, or request changes on a fullsend PR |

### Auto-trigger vs. manual trigger

Fullsend is designed to chain agents automatically (issue → triage → code → review → fix). In practice, most of that chain requires manual triggering. Here's what actually happens:

| Agent | Designed auto-trigger | What actually happens | How to trigger manually |
|-------|----------------------|----------------------|------------------------|
| Triage | `issues/opened` | **Does not auto-trigger.** The upstream dispatcher only handles `issues/labeled`, not `issues/opened`. | `/fs-triage` on an issue |
| Coder | `ready-to-code` label | **Does not auto-trigger from triage.** Triage labels issues `triaged`, not `ready-to-code`. | `/fs-code` on a triaged issue, or manually add `ready-to-code` label |
| Review | `pull_request_target/opened\|synchronize` | **Auto-triggers on `workspaces/scorecard/` PRs.** This is the only agent that reliably auto-triggers. Scoped via `paths` filter. | `/fs-review` on any PR (auth-gated) |
| Fix | `pull_request_review/submitted` with `changes_requested` | **Partially auto-triggers.** Only fires from bot reviews (e.g., fullsend-review requesting changes), not from human reviews. Effectively scoped to scorecard PRs because only scorecard PRs get auto-reviewed. | `/fs-fix` on a PR, `/fs-fix-stop` to disable |

The "autonomous pipeline" does not chain automatically. In practice: review auto-triggers on augment PRs, everything else is slash-command-driven.

### Scope details

The `paths` filter (`workspaces/scorecard/**`) only applies to the `pull_request_target` event. Other triggers are repo-wide:

- **`issues`** — fires for all issues (fine, since auto-triage doesn't work; slash commands are auth-gated)
- **`issue_comment`** — fires for all comments (auth-gated to OWNER/MEMBER/COLLABORATOR)
- **`pull_request_review`** — fires for all PR reviews (no `paths` support for this event type). Fix is transitively scoped: it only auto-fires from bot reviews, and the review bot only auto-reviews scorecard PRs.

### What does NOT run

| Agent | Why |
|-------|-----|
| Retro | Out of scope for initial pilot |
| Prioritize | Out of scope for initial pilot |

## Slash commands

Slash commands are **restricted to org members and collaborators** via an `author_association` check in the workflow shim. This prevents external users from burning Vertex AI tokens on this public repo.

Available commands:

| Command | What it does |
|---------|-------------|
| `/fs-triage` | Run triage on an issue |
| `/fs-code` | Generate code for a triaged issue |
| `/fs-review` | Run review on a PR |
| `/fs-fix` | Fix issues flagged in a review |
| `/fs-fix-stop` | Disable fix agent for a PR (adds `fullsend-no-fix` label) |

## Coexistence with PR Agent

rhdh-plugins already has [PR Agent](https://github.com/Codium-ai/pr-agent) configured (`.pr_agent.toml`). Both agents run independently:

- **PR Agent** — runs on all PRs across the entire repo
- **Fullsend Review** — auto-triggers only on PRs touching `workspaces/scorecard/`

This parallel setup allows comparing review quality. Neither blocks the other. PR Agent configuration is not modified.

## How to expand review to more workspaces

Add paths to the `paths` filter in `.github/workflows/fullsend.yaml`:

```yaml
on:
  pull_request_target:
    types: [opened, synchronize, ready_for_review, closed]
    paths:
      - "workspaces/scorecard/**"
      - "workspaces/your-new-workspace/**"  # add here
```

To enable review for ALL workspaces, remove the `paths` filter entirely.

Note: the `paths` filter only affects the Review agent's auto-trigger. Triage, coder, and fix are already available repo-wide via slash commands.

## Authorization model

### Slash command auth gate

The dispatch job checks `author_association` on `issue_comment` events. Only `OWNER`, `MEMBER`, and `COLLABORATOR` can trigger agents via slash commands. External contributors are silently ignored.

### CODEOWNERS protection

The `.fullsend/` directory and `.github/workflows/fullsend.yaml` are protected via CODEOWNERS, requiring `@redhat-developer/rhdh-plugins-maintainers` approval. This prevents agents from modifying their own configuration.

### GitHub branch protection

`require_code_owner_reviews: true` on the default branch ensures CODEOWNERS rules are enforced. This is the actual merge safety layer — independent of fullsend.

### Inference authentication

Fullsend uses GCP Workload Identity Federation (WIF) to authenticate GitHub Actions runs against Vertex AI. The WIF provider is scoped to this specific repo. Credentials are stored as GitHub secrets, not in committed files.

## Configuration files

| Path | Purpose |
|------|---------|
| `.fullsend/config.yaml` | Declares enabled roles (triage, coder, review, fix) |
| `.fullsend/customized/` | Scaffold for future agent customization (agents, harness, policies, schemas, env, scripts, skills) |
| `.github/workflows/fullsend.yaml` | Event shim — routes GitHub events to fullsend's reusable workflows, with auth gate on slash commands |

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
| Slash command ignored | Commenter is not OWNER/MEMBER/COLLABORATOR |
| Review doesn't trigger | PR doesn't touch files in `workspaces/scorecard/` |
| 403 from mint | Repo not in mint's `ALLOWED_ORGS` — contact fullsend team |
| `aiplatform.endpoints.predict` denied | WIF IAM binding missing on GCP project |
| Agent produces no output | Check transcript artifact for agent errors |

## Reference

For a comprehensive deep-dive into fullsend agents, customization, and debugging, see the [fullsend-agents.md](https://github.com/redhat-developer/rhdh-agentic/blob/main/docs/fullsend-agents.md) in rhdh-agentic.
