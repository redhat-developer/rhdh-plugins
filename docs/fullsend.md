# Fullsend AI Pilot

## What is fullsend?

[Fullsend](https://github.com/fullsend-ai/fullsend) is an agentic SDLC platform that provides AI-powered agents for triage, code review, code generation, and retrospectives. It runs as a GitHub Actions pipeline, triggered by GitHub events or the Jira poller, and uses Vertex AI (Anthropic Claude) for inference.

## Pilot scope

### Enabled agents

| Agent           | Trigger                        | How to use                                        |
| --------------- | ------------------------------ | ------------------------------------------------- |
| Triage          | `/fs-triage` slash command     | Post on any issue                                 |
| Coder           | `/fs-code` slash command       | Post on a triaged issue                           |
| Review          | `/fs-review` slash command     | Post on a PR                                      |
| Fix             | `/fs-fix` slash command        | Post on a PR                                      |
| Spec generation | `/fs-spec [guidance]`          | Post on a GitHub issue or eligible Jira work item |
| Spec audit      | `/fs-spec audit [change-path]` | Post on a PR containing OpenSpec artifacts        |
| Grillme         | `/fs-grillme [guidance]`       | Post on an open, non-fork PR                      |

### Manual triggers and workspace scope

The workflow forwards human `/fs-*` issue comments and PR label changes.
It does not subscribe to issue creation, PR open/update, or submitted reviews,
so those events do not automatically chain agents. Slash commands are available
repository-wide, subject to Fullsend's authorization checks.

The PR label event path filter covers `workspaces/boost/`,
`workspaces/scorecard/`, and `workspaces/ai-integrations/`. It does not limit
issue-comment commands to those workspaces.

### What does NOT run

| Agent      | Why                            |
| ---------- | ------------------------------ |
| Retro      | Out of scope for initial pilot |
| Prioritize | Out of scope for initial pilot |

## Slash commands

The workflow forwards slash commands from human commenters to Fullsend.
Fullsend checks repository permissions before dispatching an agent; the custom
spec and grillme commands use the same authorization gate.

Available commands:

| Command                        | What it does                                                           |
| ------------------------------ | ---------------------------------------------------------------------- |
| `/fs-triage`                   | Run triage on an issue                                                 |
| `/fs-code`                     | Generate code for a triaged issue                                      |
| `/fs-review`                   | Run review on a PR                                                     |
| `/fs-fix`                      | Fix issues flagged in a review                                         |
| `/fs-fix-stop`                 | Disable fix agent for a PR (adds `fullsend-no-fix` label)              |
| `/fs-spec [guidance]`          | Generate a spec-only PR from a GitHub issue or eligible Jira work item |
| `/fs-spec audit [change-path]` | Publish an advisory OpenSpec audit comment on a PR                     |
| `/fs-grillme [guidance]`       | Ask design questions on a PR and follow up on answers                  |

### Specifications and design questions

`/fs-spec` creates an apply-ready OpenSpec change in the owning workspace's
`openspec/` directory without implementing it. Name the workspace in the
command when the issue does not make ownership clear, for example:

```text
/fs-spec Focus on workspaces/ai-integrations; keep the first version read-only.
```

The agent installs the RHDH schema if needed, generates and validates the
required artifacts, and opens a spec-only PR against `main`. The work item
stays open for implementation. After the spec PR merges, use `/fs-code` to
request implementation.

On the spec PR, use `/fs-spec audit` for an independent consistency audit.
With multiple changes or duplicate names across workspaces, specify the full
repository-relative change directory:

```text
/fs-spec audit workspaces/ai-integrations/openspec/changes/example-change
```

The audit reads the verified PR head, including fork PRs, and updates a separate
advisory comment. It does not edit files, approve the PR, request changes, or
replace code-review findings. If the head changes during the audit, its comment
asks for a rerun instead of reporting a current outcome.

`/fs-grillme` works on any open, non-fork PR, including code, documentation, and
spec changes. Each invocation asks a round of design questions pinned to the
diff. Reply to the inline comments and invoke `/fs-grillme` again to resolve
answered threads, follow up, and identify remaining decisions. The agent does
not edit files; capture agreed decisions yourself or request `/fs-fix`.

Spec generation and audit use separate `spec-generate` and `spec-audit`
registrations so `/fs-spec` has one dispatch path. The new agents explicitly
use the Claude runtime and Opus 4.6; grillme's publisher consumes Claude's
transcript format. Their base harnesses and providers match Fullsend 0.45.0.

### Jira pilot for RHDH AI

The [Jira poll workflow](../.github/workflows/fullsend-poll-jira.yml) checks
every five minutes for `/fs-triage`, `/fs-code`, and `/fs-spec` comments on
RHIDP work items. Fullsend checks the command author's Jira project role. The existing
GitHub Fullsend commands are unchanged.

Each Jira query requires all of these gates:

- Project: `RHIDP`.
- Jira `Team`: `RHDH AI`, selected by `cf[10001]` and its Atlassian team ID.
- Label: `fullsend` (agent opt-in).
- Status category is not Done.

Add the `fullsend` label to an eligible Jira work item before posting a
command. `/fs-triage` does not automatically start coding; use `/fs-code`
explicitly when implementation is ready. `/fs-spec` generates specifications;
`/fs-spec audit` and `/fs-grillme` run only on GitHub PRs.

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
- **Fullsend Review** — invoked explicitly with `/fs-review`

This parallel setup allows comparing review quality. Neither blocks the other. PR Agent configuration is not modified.

## Authorization model

### Slash command auth gate

Fullsend checks the commenter's repository permissions before evaluating
custom command triggers. The workflow itself filters out bot comments and
comments that do not start with `/fs-`.

### CODEOWNERS protection

The `.fullsend/` directory and `.github/workflows/fullsend.yaml` are protected via CODEOWNERS, requiring `@redhat-developer/rhdh-plugins-maintainers` approval. This prevents agents from modifying their own configuration.

### GitHub branch protection

`require_code_owner_reviews: true` on the default branch ensures CODEOWNERS rules are enforced. This is the actual merge safety layer — independent of fullsend.

### Inference authentication

Fullsend uses GCP Workload Identity Federation (WIF) to authenticate GitHub Actions runs against Vertex AI. The WIF provider is scoped to this specific repo. Credentials are stored as GitHub secrets, not in committed files.

## Configuration files

| Path                              | Purpose                                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `.fullsend/config.yaml`           | Registers agents, their harnesses, and enabled roles                                                 |
| `.fullsend/rhdh/`                 | Repository-owned agents, harnesses, scripts, schemas, environment files, and skills                  |
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

| Symptom                               | Likely cause                                                    |
| ------------------------------------- | --------------------------------------------------------------- |
| Slash command ignored                 | Commenter lacks the repository permissions required by Fullsend |
| Review doesn't trigger                | Review is manual; use `/fs-review` on the PR                    |
| 403 from mint                         | Repo not in mint's `ALLOWED_ORGS` — contact fullsend team       |
| `aiplatform.endpoints.predict` denied | WIF IAM binding missing on GCP project                          |
| Agent produces no output              | Check transcript artifact for agent errors                      |

## Reference

For a comprehensive deep-dive into fullsend agents, customization, and debugging, see the [fullsend-agents.md](https://github.com/redhat-developer/rhdh-agentic/blob/main/docs/fullsend-agents.md) in rhdh-agentic.

## Validating custom commands

Run the regression tests with Python 3, `jsonschema`, `PyYAML`, Git, and
`jq` installed. Routing tests also require the Fullsend CLI (otherwise they
are skipped):

```bash
python3 -m unittest discover -s .fullsend/rhdh/scripts/tests -v
shellcheck .fullsend/rhdh/scripts/*.sh
```

With Fullsend 0.45.0 installed, resolve each new harness without running an
agent (this requires access to its pinned GitHub resources):

```bash
fullsend lock spec-generate --forge github --fullsend-dir .fullsend
fullsend lock spec-audit --forge github --fullsend-dir .fullsend
fullsend lock grillme --forge github --fullsend-dir .fullsend
```

When updating the spec-generation base, also update
`SPEC_GENERATE_BASE_SCRIPTS_SHA256` to the resolved `post_script` directory
digest. The wrapper uses that cached, pinned publisher for branch validation,
secret scanning, pushing, and PR creation.
