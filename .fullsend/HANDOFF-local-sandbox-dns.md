# DNS inside OpenShell Sandboxes

Why `yarn install` (and any tool that resolves DNS directly) fails inside
fullsend agent sandboxes — locally and in CI.

## The two-layer architecture

OpenShell sandboxes are **not** plain containers. Each sandbox is a
**nested network namespace** inside a container. The agent process never
runs in the container's network — it runs one layer deeper.

```
┌─── Host (macOS / CI runner) ────────────────────────────────────┐
│                                                                 │
│  Podman network "openshell" (10.89.0.0/24)                      │
│    aardvark-dns on bridge interface (10.89.0.1:53) ✅            │
│                                                                 │
│  ┌─── Container (10.89.0.3 on "openshell" network) ──────────┐ │
│  │  /etc/resolv.conf → nameserver 10.89.0.1  (works here)    │ │
│  │  openshell-sandbox process (PID 1 = supervisor)            │ │
│  │                                                            │ │
│  │  veth-h-* (10.200.0.1)  ← host side of veth pair          │ │
│  │    └── :3128  L7 transparent proxy ✅ (only listener)       │ │
│  │    └── :53    ❌ nothing listening                          │ │
│  │         │                                                  │ │
│  │  ┌──── │ ──── Inner netns (sandbox-*) ──────────────────┐  │ │
│  │  │  veth-s-* (10.200.0.2)  ← sandbox side              │  │ │
│  │  │  default route → 10.200.0.1                          │  │ │
│  │  │  /etc/resolv.conf → nameserver 10.89.0.1 (INHERITED) │  │ │
│  │  │                     ^^^^^^^^^^^^^^^^^^^               │  │ │
│  │  │                     UNREACHABLE from 10.200.0.0/24    │  │ │
│  │  │                                                       │  │ │
│  │  │  Agent (Claude Code), yarn, node, git run here        │  │ │
│  │  └───────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### How traffic flows

1. **HTTP/HTTPS traffic works.** The supervisor sets up iptables/nftables
   rules in the container netns that intercept all outbound TCP from the
   inner netns and redirect it to the L7 proxy at `10.200.0.1:3128`. The
   proxy does its own DNS resolution (from the container netns, where
   `10.89.0.1` IS reachable), applies the policy (host + binary
   allowlists), and forwards allowed requests.

2. **DNS does NOT work.** The inner netns inherits `/etc/resolv.conf`
   from the container, which points to `10.89.0.1` (Podman's
   aardvark-dns). But the inner netns only has a route to
   `10.200.0.0/24` — it cannot reach `10.89.0.0/24`. All direct DNS
   queries fail with `getaddrinfo EAI_AGAIN`.

3. **This is by design.** OpenShell deliberately does not provide DNS
   inside the sandbox. The security model is that all network access goes
   through the L7 proxy, which resolves DNS on behalf of the client. DNS
   is a separate channel that would bypass policy enforcement (see
   [NVIDIA/OpenShell#1169](https://github.com/NVIDIA/OpenShell/issues/1169)
   — DNS exfiltration attack).

### What this means

**Any tool that resolves DNS before connecting will fail:**

- `yarn install` (Yarn Berry calls `getaddrinfo` before `fetch`)
- `pip install` (same)
- `go get` (same)
- `git clone` over HTTPS (git uses libcurl which resolves DNS first)
- `nslookup`, `dig`, `getent hosts` (obviously)
- Any Node.js code using `dns.resolve()` or `dns.lookup()`
- WebSocket clients (Discord.js, etc. — see OpenShell#364)

**Tools that work transparently:**

- `node -e "fetch('https://...')"` — Node's `fetch()` connects to the
  IP directly; the transparent proxy intercepts the TCP connection
- `curl https://...` — curl honors the transparent proxy
- `gh api ...` — uses HTTPS

### Why it seems to work in CI

Confirmed: CI (GitHub Actions) uses the **exact same stack** — Podman +
OpenShell 0.0.54 + same action.yml. The inner netns is identical
(`10.200.0.x` veth pair, transparent proxy at `:3128`).

**yarn install works in CI** because the code agent runs `yarn install`
inside the sandbox where the transparent proxy intercepts it. On the CI
runners (native Linux with rootless Podman), there may be differences in
how Podman sets up the network stack, or the OpenShell gateway bind
(`OPENSHELL_BIND_ADDRESS=0.0.0.0` in CI vs unset locally) affects
routing. However, **DNS resolution itself still fails in CI** — yarn
works because Node.js's `undici` (used by yarn's fetch) handles the
connection in a way that gets intercepted by the transparent proxy before
DNS is needed.

**Update 2026-06-09:** Live debugging of a running sandbox confirmed:

- Container netns: `nslookup registry.npmjs.org 10.89.0.1` → ✅ works
- Inner sandbox netns: `nslookup registry.npmjs.org 10.89.0.1` → ❌ `connection refused`
- Inner sandbox netns: `nslookup registry.npmjs.org 10.200.0.1` → ❌ `connection refused`
- Only `:3128` (L7 proxy) listens on `10.200.0.1` — no DNS forwarder

## Upstream status

| Issue                                                                                           | Status             | Relevance                                                                                                           |
| ----------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| [#364](https://github.com/NVIDIA/OpenShell/issues/364) — DNS resolution fails inside sandbox    | **Closed wontfix** | Exact same problem. Maintainer response: "DNS is incidental. Tools should use HTTPS_PROXY."                         |
| [#1169](https://github.com/NVIDIA/OpenShell/issues/1169) — DNS exfiltration bypass              | **Closed (fixed)** | Why DNS is intentionally blocked — it's a policy bypass vector                                                      |
| [#1107](https://github.com/NVIDIA/OpenShell/issues/1107) — `/etc/hosts` injection for TCP hosts | **Open, assigned** | Proposes resolving policy-allowed hostnames and writing to `/etc/hosts` at sandbox creation. Would fix our problem. |
| [#642](https://github.com/NVIDIA/OpenShell/issues/642) — Sandbox networking fails               | **Closed**         | Related networking failures                                                                                         |

The OpenShell team's position is clear: **the sandbox intentionally has no DNS.
All network access must go through the L7 proxy.** This is a security design
decision, not a bug. Tools that need network access should either:

1. Use HTTP/HTTPS (intercepted by the transparent proxy), or
2. Wait for #1107 (`/etc/hosts` injection for policy-allowed hosts)

## Impact on fullsend locally

`yarn install` fails locally with `getaddrinfo EAI_AGAIN` because:

1. Yarn Berry's fetch implementation resolves DNS via `getaddrinfo` before
   making the HTTP connection
2. The transparent proxy intercepts TCP connections, not DNS queries
3. The DNS query goes to `10.89.0.1` which is unreachable from `10.200.0.2`

This completely blocks running code/fix agents locally for any repo that
needs `yarn install`, `pip install`, or similar package installation.

## Workaround options

### Option 1: Explicit httpProxy in .yarnrc.yml ✅ WORKS (tested 2026-06-09)

Set `httpProxy`/`httpsProxy` in `.yarnrc.yml` pointing to `http://10.200.0.1:3128`.
Yarn sends HTTP CONNECT to the proxy, which resolves DNS and forwards the request.

**Tested:** Created fresh sandbox with custom code policy, ran `yarn add is-odd`
with proxy config → resolved, fetched, installed in 497ms. Full transcript:

```
$ yarn add is-odd   # with .yarnrc.yml httpProxy/httpsProxy set
➤ YN0000: · Yarn 4.6.0
➤ YN0000: ┌ Resolution step
➤ YN0085: │ + is-odd@npm:3.0.1, is-number@npm:6.0.0
➤ YN0000: └ Completed in 0s 226ms
➤ YN0000: ┌ Fetch step
➤ YN0013: │ 2 packages were added to the project (+ 16.65 KiB).
➤ YN0000: └ Completed in 0s 229ms
➤ YN0000: · Done in 0s 497ms
```

**Key findings:**

- The L7 proxy DOES accept explicit HTTP CONNECT (not just transparent interception)
- `curl` gets 403 because it's not in the policy binary allowlist — use `node`/`yarn`
- Previous `socketOnEnd` failure was likely curl-based testing, not node/yarn
- `sandbox-yarn-setup.sh` updated to inject proxy settings into `.yarnrc.yml`

**Not yet tested:** Full `yarn install` on the rhdh-plugins monorepo (hundreds
of packages). The smoke test used a single package.

### Option 2: `/etc/hosts` injection in setup script

Resolve the needed hostnames on the host side and inject them into
`/etc/hosts` before Landlock locks `/etc` as read-only. Needs to run
at sandbox creation time, not in the agent's setup script.

**Blocked by:** `/etc` is in the `read_only` list in the policy. The
filesystem policy is applied at sandbox creation, before any user
script runs. Would need OpenShell support or a custom image with
pre-resolved hosts baked in.

### Option 3: Custom image with hosts baked in

Build a custom sandbox image that writes static `/etc/hosts` entries
for `registry.npmjs.org`, `registry.yarnpkg.com`, `repo.yarnpkg.com`,
etc. at image build time.

**Downside:** IPs change. Would need periodic rebuilds.

### Option 4: DNS forwarder in setup script

Start a DNS forwarder (e.g. `socat`) on a writable port that relays
to the container's DNS.

**Blocked by:** The inner netns can't reach `10.89.0.1`. Would need to
run the forwarder in the container netns (not the sandbox netns), bind
it to `10.200.0.1:53`, and change `/etc/resolv.conf` (which is
read-only). Same Landlock problem.

### Option 5: Wait for OpenShell#1107

The `/etc/hosts` injection feature would solve this cleanly. All
hostnames declared in the policy would be pre-resolved and written to
`/etc/hosts` at sandbox creation time, before Landlock is applied.

**Timeline:** Unknown. Issue is open and assigned but no PR yet.

### Option 6: File a new OpenShell issue

Report specifically that the Podman driver on macOS creates sandboxes
where `/etc/resolv.conf` points to an unreachable nameserver. Even
though DNS is intentionally unavailable, the resolv.conf should either
point to something valid (if DNS is to be supported in the future) or
be empty/commented (so tools fail fast instead of timing out).

## Verified facts (2026-06-09)

Captured from a live running sandbox (`openshell-sandbox-agent-code-48566-1781000955`):

```
# Container netns (where openshell supervisor runs)
$ ip addr → eth0: 10.89.0.3/24 (openshell bridge)
            veth-h-0292b678: 10.200.0.1/24 (host side of inner veth)
$ ip route → default via 10.89.0.1
$ nslookup registry.npmjs.org 10.89.0.1 → ✅ 104.16.x.34
$ ss -tlnp → 10.200.0.1:3128 (openshell-sandb proxy)

# Inner sandbox netns (where agent runs)
$ ip addr → veth-s-0292b678: 10.200.0.2/24
$ ip route → default via 10.200.0.1
$ nslookup registry.npmjs.org 10.89.0.1 → ❌ connection refused
$ nslookup registry.npmjs.org 10.200.0.1 → ❌ connection refused
```

## Related files

| File                                                 | Purpose                             |
| ---------------------------------------------------- | ----------------------------------- |
| `.fullsend/customized/policies/code.yaml`            | Network policy with host allowlists |
| `.fullsend/customized/harness/code.yaml`             | Harness mounting setup script       |
| `.fullsend/customized/scripts/sandbox-yarn-setup.sh` | Corepack/yarn PATH setup            |
| `~/.config/openshell/gateway.env`                    | `OPENSHELL_DRIVERS=podman`          |
