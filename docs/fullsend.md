# Fullsend AI Pilot

## What is fullsend?

[Fullsend](https://github.com/fullsend-ai/fullsend) is an agentic SDLC platform that provides AI-powered agents for triage, code review, code generation, and retrospectives. It runs as a GitHub Actions pipeline, triggered by GitHub events or the Jira poller, and uses Vertex AI (Anthropic Claude) for inference.

## Pilot scope

### Enabled agents

| Agent  | Trigger                                                | How to use                                        |
| ------ | ------------------------------------------------------ | ------------------------------------------------- |
| Triage | `/fs-triage` slash command                             | Post on any issue                                 |
| Coder  | `/fs-code` slash command, or `ready-to-code` label     | Post on a triaged issue                           |
| Review | Auto-triggers on PR open/update                        | Automatic for `workspaces/scorecard/` PRs         |
| Fix    | `/fs-fix` slash command, or `changes_requested` review | Post on a PR, or request changes on a fullsend PR |

### Auto-trigger vs. manual trigger

Fullsend is designed to chain agents automatically (issue → triage → code → review → fix). In practice, most of that chain requires manual triggering. Here's what actually happens:

| Agent  | Designed auto-trigger                                    | What actually happens                                                                                                                                                                                          | How to trigger manually                                              |
| ------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Triage | `issues/opened`                                          | **Does not auto-trigger.** The upstream dispatcher only handles `issues/labeled`, not `issues/opened`.                                                                                                         | `/fs-triage` on an issue                                             |
| Coder  | `ready-to-code` label                                    | **Does not auto-trigger from triage.** Triage labels issues `triaged`, not `ready-to-code`.                                                                                                                    | `/fs-code` on a triaged issue, or manually add `ready-to-code` label |
| Review | `pull_request_target/opened\|synchronize`                | **Auto-triggers on `workspaces/scorecard/` PRs.** This is the only agent that reliably auto-triggers. Scoped via `paths` filter.                                                                               | `/fs-review` on any PR (auth-gated)                                  |
| Fix    | `pull_request_review/submitted` with `changes_requested` | **Partially auto-triggers.** Only fires from bot reviews (e.g., fullsend-review requesting changes), not from human reviews. Effectively scoped to scorecard PRs because only scorecard PRs get auto-reviewed. | `/fs-fix` on a PR, `/fs-fix-stop` to disable                         |

The "autonomous pipeline" does not chain automatically. In practice: review auto-triggers on augment PRs, everything else is slash-command-driven.

### Scope details

The `paths` filter (`workspaces/scorecard/**`) only applies to the `pull_request_target` event. Other triggers are repo-wide:

- **`issues`** — fires for all issues (fine, since auto-triage doesn't work; slash commands are auth-gated)
- **`issue_comment`** — fires for all comments (auth-gated to OWNER/MEMBER/COLLABORATOR)
- **`pull_request_review`** — fires for all PR reviews (no `paths` support for this event type). Fix is transitively scoped: it only auto-fires from bot reviews, and the review bot only auto-reviews scorecard PRs.

### What does NOT run

| Agent      | Why                            |
| ---------- | ------------------------------ |
| Retro      | Out of scope for initial pilot |
| Prioritize | Out of scope for initial pilot |

## Slash commands

Slash commands are **restricted to org members and collaborators** via an `author_association` check in the workflow shim. This prevents external users from burning Vertex AI tokens on this public repo.

Available commands:

| Command        | What it does                                              |
| -------------- | --------------------------------------------------------- |
| `/fs-triage`   | Run triage on an issue                                    |
| `/fs-code`     | Generate code for a triaged issue                         |
| `/fs-review`   | Run review on a PR                                        |
| `/fs-fix`      | Fix issues flagged in a review                            |
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

## CVE schedule (Dependabot lockfile bumps)

The [Fullsend CVE schedule](../.github/workflows/fullsend-cve-schedule.yml) workflow is a sibling of the event shim (not wired into `fullsend.yaml`). It plans a workspace matrix, runs the `cve-bump` agent per cell, and opens `chore/<workspace>-cve-bumps` PRs.

### Trigger

| Trigger  | Detail                                                                       |
| -------- | ---------------------------------------------------------------------------- |
| Schedule | Mondays `08:00` UTC (`0 8 * * 1`)                                            |
| Manual   | Actions → **Fullsend CVE schedule** (`workspace`, `issue_number`, `dry_run`) |

Concurrency group `fullsend-cve-schedule` does not cancel in-progress runs.

### Queue / work selection

There is no external queue. [`plan-cve-matrix.cjs`](../.fullsend/rhdh/scripts/plan-cve-matrix.cjs) builds the run set from:

1. Allowlist / skip list in [`.fullsend/rhdh/cve-schedule.yaml`](../.fullsend/rhdh/cve-schedule.yaml) (`max_parallel: 3`)
2. Open Dependabot alerts (requires repo secret `DEPENDABOT_TOKEN` with **Dependabot alerts: read**)
3. Skip a workspace when an open PR already exists on `chore/<workspace>-cve-bumps` (or one labeled `fullsend-cve-failed`)
4. Ensure a tracking issue labeled `package-impact-report`

Per-workspace alert JSON is uploaded as the `cve-schedule-alerts` artifact (not embedded in matrix output). Fan-out uses GHA `max-parallel` plus concurrency `fullsend-cve-<workspace>`.

### How PRs are opened

1. Each matrix cell dispatches Fullsend `cve-bump` (`role: coder`).
2. Pre-script loads the workspace alert artifact and checks out `chore/<workspace>-cve-bumps` from `main`.
3. The agent classifies / bumps the lockfile and writes `cve-result.json` (it does not push or open the PR).
4. Post-script pushes the branch, runs `gh pr create` (labels `fullsend-cve`, `workspace/<ws>`), and comments on the tracking issue.
5. The schedule summary job posts selected / skipped workspaces to the same issue.

Ops: set `DEPENDABOT_TOKEN` before relying on the Monday cron. First enablement: `dry_run=true`, then a single-`workspace` dispatch.

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
      - 'workspaces/scorecard/**'
      - 'workspaces/your-new-workspace/**' # add here
```

To enable review for ALL workspaces, remove the `paths` filter entirely.

Note: the `paths` filter only affects the Review agent's auto-trigger. Triage, coder, and fix are already available repo-wide via slash commands.

## Authorization model

### Slash command auth gate

The dispatch job checks `author_association` on `issue_comment` events. Only `OWNER`, `MEMBER`, and `COLLABORATOR` can trigger agents via slash commands. External contributors are silently ignored.

### CODEOWNERS protection

The `.fullsend/` directory and Fullsend workflows (`fullsend.yaml`, `fullsend-poll-jira.yml`, `fullsend-cve-schedule.yml`) are protected via CODEOWNERS, requiring `@redhat-developer/rhdh-plugins-maintainers` / `@redhat-developer/rhdh-fullsend` approval. This prevents agents from modifying their own configuration.

### GitHub branch protection

`require_code_owner_reviews: true` on the default branch ensures CODEOWNERS rules are enforced. This is the actual merge safety layer — independent of fullsend.

### Inference authentication

Fullsend uses GCP Workload Identity Federation (WIF) to authenticate GitHub Actions runs against Vertex AI. The WIF provider is scoped to this specific repo. Credentials are stored as GitHub secrets, not in committed files.

## Configuration files

| Path                                          | Purpose                                                                                              |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `.fullsend/config.yaml`                       | Declares enabled agents/roles (triage, code, review, fix, cve-bump, …)                               |
| `.fullsend/rhdh/cve-schedule.yaml`            | Allowlist / skip / `max_parallel` for the CVE schedule planner                                       |
| `.fullsend/customized/`                       | Scaffold for future agent customization (agents, harness, policies, schemas, env, scripts, skills)   |
| `.github/workflows/fullsend.yaml`             | Event shim — routes GitHub events to fullsend's reusable workflows, with auth gate on slash commands |
| `.github/workflows/fullsend-cve-schedule.yml` | Weekly Dependabot CVE bump fan-out (`cve-bump` → lockfile PR)                                        |

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

| Symptom                               | Likely cause                                              |
| ------------------------------------- | --------------------------------------------------------- |
| Slash command ignored                 | Commenter is not OWNER/MEMBER/COLLABORATOR                |
| Review doesn't trigger                | PR doesn't touch files in `workspaces/scorecard/`         |
| CVE schedule plan fails on alerts     | Missing or under-scoped `DEPENDABOT_TOKEN` secret         |
| CVE workspace skipped                 | Open PR already on `chore/<workspace>-cve-bumps`          |
| 403 from mint                         | Repo not in mint's `ALLOWED_ORGS` — contact fullsend team |
| `aiplatform.endpoints.predict` denied | WIF IAM binding missing on GCP project                    |
| Agent produces no output              | Check transcript artifact for agent errors                |

## Reference

For a comprehensive deep-dive into fullsend agents, customization, and debugging, see the [fullsend-agents.md](https://github.com/redhat-developer/rhdh-agentic/blob/main/docs/fullsend-agents.md) in rhdh-agentic.
