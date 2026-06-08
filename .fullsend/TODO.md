# Fullsend Integration TODO

Friction points and improvements discovered during monorepo onboarding.

## What worked (issue #3314 test run, 2026-06-08)

- [x] Routing skill loaded into sandbox (`Skills: .../code-implementation, .../monorepo-workspace-routing`)
- [x] Agent immediately invoked routing skill as first action
- [x] Correctly identified `workspaces/boost/` from issue context, cd'd in, read AGENTS.md
- [x] Agent made correct, minimal 4-line fix (SHALL/MUST keywords in spec)
- [x] Post-script verification passed: secret scan, pre-commit, tests
- [x] Branch naming followed convention: `fix/boost-openspec-rfc2119-keywords-3314`
- [x] PR #3325 created automatically with `Closes #3314`
- [x] Triage correctly identified problem, severity, and verification steps
- [x] Full agent transcript available as GHA artifact (`fullsend-code` → `iteration-1/transcripts/*.jsonl`)

## What didn't work (issue #3314 test run)

- [ ] `yarn install` failed — sandbox is network-isolated (OpenShell). Agent tried multiple times before giving up
- [ ] `yarn openspec:validate` never ran — openspec not available without network install
- [ ] The `@fission-ai/openspec` devDep approach is useless in the sandbox — deps must be pre-installed in the image or mounted via `host_files`
- [ ] Agent fell back to manual `grep` verification — correct but not ideal
- [ ] Agent spent ~25min total, significant time wasted on yarn install retries

## Routing skill

- [ ] Prioritize `workspace/*` label over title/body parsing — if the label exists, trust it, don't guess
- [ ] Add routing skill to triage harness — triage currently has no workspace awareness, misrouted #3314 to `workspace/ai-integrations` instead of `workspace/boost`
- [ ] Routing skill step 4 says `yarn install` — this won't work in sandbox. Remove or gate behind network check

## Labels

- [ ] Automate `workspace/*` label creation when a new workspace is added (currently manual)
- [ ] Triage applied `workspace/ai-integrations` because `workspace/boost` didn't exist — labels must be kept in sync with `workspaces/` directory

## Observability

- [x] Agent transcript IS available as GHA artifact (download via `gh run download --name fullsend-code`)
- [x] Transcript is JSONL with full tool calls, text output, and reasoning
- [ ] Transcript not visible inline in GHA logs — need to download artifact separately
- [ ] Consider a post-script step that extracts key actions from transcript into a GHA summary

## Sandbox / tooling

- [ ] openspec needs to be available in sandbox without network. Options:
  - Pre-install in custom sandbox image (`image:` in harness)
  - Mount via `host_files` from the runner
  - Install in `pre_script` (runs on host) and copy binary into sandbox
- [ ] Routing skill should not tell agent to run `yarn install` — sandbox has no network

## Upstream (fullsend-ai/fullsend)

- [ ] Feature request filed: [fullsend-ai/fullsend#1937](https://github.com/fullsend-ai/fullsend/issues/1937) — native `working_dir` field in harness schema
- [ ] Drift risk: customized `harness/code.yaml` and `agents/code.md` are full copies of upstream (baseline 2025-06-05) — need to track upstream changes

## CLAUDE.md

- [ ] Decide whether root CLAUDE.md should exist at all — currently minimal, but may still confuse non-agent contributors
