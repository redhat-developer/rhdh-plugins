# Fullsend AI Pilot

## What is fullsend?

[Fullsend](https://github.com/fullsend-ai/fullsend) is an agentic SDLC platform that provides AI-powered agents for triage, code review, code generation, and retrospectives. It runs as a GitHub Actions pipeline, triggered by GitHub events or the Jira poller, and uses Vertex AI (Anthropic Claude) for inference.

## Pilot scope

### Enabled agents

| Agent | Trigger | How to use |
|-------|---------|------------|
| Triage | `/fs-triage` slash command | Post on any issue |
| Coder | `/fs-code` slash command, or `ready-to-code` label | Post on a triaged issue |
| Review | Auto-triggers on PR open/update | Automatic for PRs in all workspaces |
| Fix | `/fs-fix` slash command, or `changes_requested` review | Post on a PR, or request changes on a fullsend PR |

### Auto-trigger vs. manual trigger

Fullsend is designed to chain agents automatically (issue → triage → code → review → fix). In practice, most of that chain requires manual triggering. Here's what actually happens:

| Agent | Designed auto-trigger | What actually happens | How to trigger manually |
|-------|----------------------|----------------------|------------------------|
| Triage | `issues/opened` | **Does not auto-trigger.** The upstream dispatcher only handles `issues/labeled`, not `issues/opened`. | `/fs-triage` on an issue |
| Coder | `ready-to-code` label | **Does not auto-trigger from triage.** Triage labels issues `triaged`, not `ready-to-code`. | `/fs-code` on a triaged issue, or manually add `ready-to-code` label |
| Review | `pull_request_target/opened\|synchronize\|ready_for_review` | **Auto-triggers on all PRs** whose author has triage+ access (or is a bot). This is the only agent that reliably auto-triggers. | `/fs-review` on any PR (auth-gated), or the `ready-for-review` label |
| Fix | `pull_request_review/submitted` with `changes_requested` | **Partially auto-triggers.** Only fires from bot reviews (e.g., fullsend-review requesting changes), not from human reviews. | `/fs-fix` on a PR, `/fs-fix-stop` to disable |

The "autonomous pipeline" does not chain automatically. In practice: review auto-triggers on PRs, everything else is slash-command-driven.

### Scope details

There is no `paths` filter, so all triggers are repo-wide:

- **`issue_comment`** — fires for all comments (auth-gated to OWNER/MEMBER/COLLABORATOR)
- **`pull_request_target`** — fires on PR open/update/ready-for-review (review agent) and on label changes (`ready-for-review` label).

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

### Jira pilot for RHDH AI

The [Jira poll workflow](../.github/workflows/fullsend-poll-jira.yml) checks
every five minutes for `/fs-triage` and `/fs-code` comments on RHIDP work
items. Fullsend checks the command author's Jira project role. The existing
GitHub Fullsend commands are unchanged.

Each Jira query requires all of these gates:

- Project: `RHIDP`.
- Jira `Team`: `RHDH AI`, selected by `cf[10001]` and its Atlassian team ID.
- Label: `fullsend` (agent opt-in).
- Status category is not Done.

Add the `fullsend` label to an eligible Jira work item before posting a
command. `/fs-triage` does not automatically start coding; use `/fs-code`
explicitly when implementation is ready. Grillme and spec commands are not
part of this Jira pilot.

To expand the cohort, add a project/team pair to the `poll_project` calls in
the workflow. Keep the `fullsend` opt-in label for each cohort.

Before enabling the scheduled workflow, configure the Actions variable
`JIRA_BASE_URL` and secrets `JIRA_TOKEN` and `JIRA_USER_EMAIL`. The workflow
fails visibly when any are missing. Its existing Fullsend GCP and mint
credentials are also required for the downstream agents. The RHDH AI team ID
comes from Parasol's poller for `https://stage-redhat.atlassian.net`; verify
the ID if `JIRA_BASE_URL` points to a different Jira instance.

## Coexistence with PR Agent

rhdh-plugins already has [PR Agent](https://github.com/Codium-ai/pr-agent) configured (`.pr_agent.toml`). Both agents run independently:

- **PR Agent** — runs on all PRs across the entire repo
- **Fullsend Review** — auto-triggers on PRs across all workspaces

This parallel setup allows comparing review quality. Neither blocks the other. PR Agent configuration is not modified.

## Limiting review to specific workspaces

Review auto-triggers on all workspaces. To restrict it again, add a `paths`
filter to the `pull_request_target` trigger in `.github/workflows/fullsend.yaml`:

```yaml
on:
  pull_request_target:
    types: [opened, synchronize, ready_for_review, labeled, unlabeled]
    paths:
      - "workspaces/scorecard/**"
```

Note: a `paths` filter only affects the `pull_request_target` triggers. Slash commands keep working repo-wide.

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
| Review doesn't trigger | PR author lacks triage+ access — use `/fs-review` or the `ready-for-review` label |
| 403 from mint | Repo not in mint's `ALLOWED_ORGS` — contact fullsend team |
| `aiplatform.endpoints.predict` denied | WIF IAM binding missing on GCP project |
| Agent produces no output | Check transcript artifact for agent errors |

## Reference

For a comprehensive deep-dive into fullsend agents, customization, and debugging, see the [fullsend-agents.md](https://github.com/redhat-developer/rhdh-agentic/blob/main/docs/fullsend-agents.md) in rhdh-agentic.
