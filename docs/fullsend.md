# Fullsend AI Pilot

## What is fullsend?

[Fullsend](https://github.com/fullsend-ai/fullsend) is an agentic SDLC platform that provides AI-powered agents for triage, code review, code generation, and retrospectives. It runs as a GitHub Actions pipeline, triggered by GitHub events or the Jira poller, and uses Vertex AI (Anthropic Claude) for inference.

## GitHub triggers

The [Fullsend workflow](../.github/workflows/fullsend.yaml) uses `pull_request`
for labels added to or removed from same-repository PRs. Its `paths` filter
limits those label events to enrolled workspaces. The workflow handles
authorized `/fs-*` comments across the repository.

For PRs from forks, a maintainer can use `/fs-review` or another applicable
slash command. The CI repair labels also run on same-repository PRs. The
[CI repair workflow](../.github/workflows/fullsend-ci-repair.yml) provides a
manual dispatch when a repair or retry needs to be requested directly.

## Slash commands

The workflow accepts human `/fs-*` comments and delegates authorization to Fullsend.

Available commands:

| Command        | What it does                                              |
| -------------- | --------------------------------------------------------- |
| `/fs-triage`   | Run triage on an issue                                    |
| `/fs-code`     | Generate code for a triaged issue                         |
| `/fs-review`   | Run review on a PR                                        |
| `/fs-fix`      | Fix issues flagged in a review                            |
| `/fs-fix-stop` | Disable fix agent for a PR (adds `fullsend-no-fix` label) |

### Jira pilot for RHDH AI and Plugins

The [Jira poll workflow](../.github/workflows/fullsend-poll-jira.yml) checks
every five minutes for `/fs-triage` and `/fs-code` comments on RHIDP work
items. Fullsend checks the command author's Jira project role. The existing
GitHub Fullsend commands are unchanged.

Each Jira query requires all of these gates:

- Project: `RHIDP`.
- Jira `Team` is RHDH AI or Plugins, selected by `cf[10001]` and the Atlassian team ID.
- Label: `fullsend` (agent opt-in).
- Status category is not Done.

Add the `fullsend` label to an eligible Jira work item before posting a
command. `/fs-triage` does not automatically start coding; use `/fs-code`
explicitly when implementation is ready. Grillme and spec commands are not
part of this Jira pilot.

To expand the cohort, add a project/team pair to the `poll_project` calls in
the workflow. Keep the `fullsend` opt-in label for each cohort.

Configure the Actions variable `JIRA_BASE_URL` and secrets
`FULLSEND_JIRA_TOKEN` and `FULLSEND_JIRA_EMAIL`. The workflow also accepts
the existing `JIRA_TOKEN` and `JIRA_USER_EMAIL` names. Its existing Fullsend GCP and mint
credentials are also required for the downstream agents. The RHDH AI team ID
comes from Parasol's poller for `https://stage-redhat.atlassian.net`; verify
the ID if `JIRA_BASE_URL` points to a different Jira instance.

## Coexistence with PR Agent

rhdh-plugins already has [PR Agent](https://github.com/Codium-ai/pr-agent) configured (`.pr_agent.toml`). Both agents run independently:

- **PR Agent** — runs on all PRs across the entire repo
- **Fullsend Review** — listens for label events on same-repository PRs touching enrolled workspaces

This parallel setup allows comparing review quality. Neither blocks the other. PR Agent configuration is not modified.

## How to expand review to more workspaces

Add paths to the `paths` filter in `.github/workflows/fullsend.yaml`:

```yaml
on:
  pull_request:
    types: [labeled, unlabeled]
    paths:
      - 'workspaces/scorecard/**'
      - 'workspaces/your-new-workspace/**' # add here
```

To enable review for ALL workspaces, remove the `paths` filter entirely.

The `paths` filter applies to PR label events. Slash commands remain available across the repository.

## Authorization model

### Slash command auth gate

The dispatcher checks repository permissions and applicable ownership rules for each command.

### CODEOWNERS protection

The `.fullsend/` directory and `.github/workflows/fullsend.yaml` are protected via CODEOWNERS, requiring `@redhat-developer/rhdh-plugins-maintainers` approval. This prevents agents from modifying their own configuration.

### GitHub branch protection

`require_code_owner_reviews: true` on the default branch ensures CODEOWNERS rules are enforced. This is the actual merge safety layer — independent of fullsend.

### Inference authentication

Fullsend uses GCP Workload Identity Federation (WIF) to authenticate GitHub Actions runs against Vertex AI. The WIF provider is scoped to this specific repo. Credentials are stored as GitHub secrets, not in committed files.

## Configuration files

| Path                              | Purpose                                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `.fullsend/config.yaml`           | Declares enabled roles (triage, coder, review, fix)                                                  |
| `.fullsend/customized/`           | Scaffold for future agent customization (agents, harness, policies, schemas, env, scripts, skills)   |
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

| Symptom                               | Likely cause                                              |
| ------------------------------------- | --------------------------------------------------------- |
| Slash command ignored                 | Commenter lacks permission to run the command             |
| Review doesn't trigger                | PR comes from a fork or touches no enrolled workspace     |
| 403 from mint                         | Repo not in mint's `ALLOWED_ORGS` — contact fullsend team |
| `aiplatform.endpoints.predict` denied | WIF IAM binding missing on GCP project                    |
| Agent produces no output              | Check transcript artifact for agent errors                |

## Reference

For a comprehensive deep-dive into fullsend agents, customization, and debugging, see the [fullsend-agents.md](https://github.com/redhat-developer/rhdh-agentic/blob/main/docs/fullsend-agents.md) in rhdh-agentic.
