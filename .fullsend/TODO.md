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

- [x] `yarn install` failed — root cause: `yarn` not in PATH (corepack enable fails on read-only /usr/bin) + postinstall recursion. Fixed via sandbox-yarn-setup.sh + YARN_ENABLE_SCRIPTS=false
- [x] `yarn openspec:validate` never ran — fixed: yarn now available after sourcing setup script, openspec accessible via workspace devDeps after install
- [x] The `@fission-ai/openspec` devDep approach works IF yarn install succeeds — the sandbox DOES have network access (registry.npmjs.org was ALLOWED in sandbox logs)
- [ ] Agent fell back to manual `grep` verification — correct but not ideal
- [x] Agent spent ~25min total, significant time wasted on yarn install retries — fixed by making yarn available upfront

## Routing skill

- [ ] Prioritize `workspace/*` label over title/body parsing — if the label exists, trust it, don't guess
- [ ] Add routing skill to triage harness — triage currently has no workspace awareness, misrouted #3314 to `workspace/ai-integrations` instead of `workspace/boost`
- [x] Routing skill step 4 says `yarn install` — replaced with `source sandbox-yarn-setup.sh` + `YARN_ENABLE_SCRIPTS=false yarn install`

## Labels

- [ ] Automate `workspace/*` label creation when a new workspace is added (currently manual)
- [ ] Triage applied `workspace/ai-integrations` because `workspace/boost` didn't exist — labels must be kept in sync with `workspaces/` directory

## Observability

- [x] Agent transcript IS available as GHA artifact (download via `gh run download --name fullsend-code`)
- [x] Transcript is JSONL with full tool calls, text output, and reasoning
- [ ] Transcript not visible inline in GHA logs — need to download artifact separately
- [ ] Consider a post-script step that extracts key actions from transcript into a GHA summary

## Sandbox / tooling

- [x] openspec needs to be available in sandbox — resolved: sandbox HAS network access, yarn install works after corepack setup. openspec installed as workspace devDep via `yarn install`
- [x] Routing skill should not tell agent to run bare `yarn install` — replaced with setup script + YARN_ENABLE_SCRIPTS=false
- [x] Custom fix harness created with host_files mounting sandbox-yarn-setup.sh
- [x] Custom fix policy created with registry.yarnpkg.com + repo.yarnpkg.com + yarn/corepack binaries in allowlist
- [x] Custom code policy created — upstream code.yaml also missing repo.yarnpkg.com (corepack downloads yarn binary from repo.yarnpkg.com, not registry.yarnpkg.com)
- [x] Validated locally (2026-06-08): YARN_SETUP_OK: 4.12.0, yarn install completed, openspec validate ran successfully
- [ ] Git hooks (husky) need yarn in PATH — solved with /tmp/workspace/bin/yarn wrapper in setup script. Validate this works in CI too
- [ ] yarn install takes ~10-15 min in sandbox for boost workspace (monorepo overhead) — consider pre-installing deps in custom image for faster runs

## DNS / networking (investigated 2026-06-09)

See `HANDOFF-local-sandbox-dns.md` for full technical writeup.

- [ ] **DNS is intentionally broken inside sandboxes.** All network must go through the L7 transparent proxy at `10.200.0.1:3128`. The inner sandbox netns (`10.200.0.2`) has no route to the Podman DNS (`10.89.0.1`). This is by design — OpenShell#364 was closed wontfix.
- [ ] `yarn install` fails locally because Yarn resolves DNS via `getaddrinfo` before connecting. The transparent proxy intercepts TCP, not DNS.
- [ ] Same architecture in CI (GitHub Actions) — Podman + OpenShell 0.0.54. yarn install works in CI because Node.js `undici`/`fetch` gets intercepted by the transparent proxy before DNS is needed.
- [x] Test workaround: `httpProxy`/`httpsProxy` in `.yarnrc.yml` pointing to `http://10.200.0.1:3128` — **WORKS**. Proxy accepts explicit CONNECT from `node`/`yarn`. Smoke test: `yarn add is-odd` completed in 497ms. `sandbox-yarn-setup.sh` updated to inject proxy config.
- [ ] Full test: run `yarn install` on rhdh-plugins monorepo via sandbox with proxy config (smoke test only covered a single package)
- [ ] Watch [NVIDIA/OpenShell#1107](https://github.com/NVIDIA/OpenShell/issues/1107) — proposes `/etc/hosts` injection for policy-allowed hostnames at sandbox creation. Would fix this cleanly.
- [ ] Consider filing new OpenShell issue: `/etc/resolv.conf` points to unreachable nameserver — tools should fail fast (empty resolv.conf) instead of timing out on unreachable `10.89.0.1`

## Upstream (fullsend-ai/fullsend)

- [ ] Feature request filed: [fullsend-ai/fullsend#1937](https://github.com/fullsend-ai/fullsend/issues/1937) — native `working_dir` field in harness schema
- [ ] Drift risk: customized harness/policy files are copies of upstream (baseline 2025-06-05) — need to track upstream changes. Now includes: `harness/code.yaml`, `harness/fix.yaml`, `policies/code.yaml`, `policies/fix.yaml`, `agents/code.md`
- [ ] File upstream issue: repo.yarnpkg.com missing from upstream code.yaml and fix.yaml policies — any JS monorepo using corepack + yarn will hit this
- [ ] File upstream issue: request `sandbox_init_script` field in harness schema — current workaround (host_files + source in skill) works but is fragile and requires every skill to know about the setup script. A native `sandbox_init_script` would run before the agent starts, making PATH/env changes automatic
- [ ] Fallback plan: if corepack workaround proves unreliable across sandbox image updates, build a custom image with yarn pre-installed (`FROM fullsend-code:latest` + `RUN corepack enable && corepack prepare yarn@stable --activate`)

## CLAUDE.md

- [ ] Decide whether root CLAUDE.md should exist at all — currently minimal, but may still confuse non-agent contributors
