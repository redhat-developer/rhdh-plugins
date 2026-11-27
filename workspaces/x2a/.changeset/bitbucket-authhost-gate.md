---
'@red-hat-developer-hub/backstage-plugin-x2a': minor
---

Add `x2a.scm.authHosts.bitbucket` (no default) so Bitbucket Cloud is offered only when the deployment declares it.

When the repository picker requests credentials, `bitbucket.org` is no longer offered unless `x2a.scm.authHosts.bitbucket` is set (to `bitbucket.org`); it is hidden silently, without the notice GitHub and GitLab get. Without `requestUserCredentials`, `bitbucket.org` is still offered like the other integration hosts.

**BREAKING:** Bitbucket Cloud tokens are refused until the key is set, on every token path: the repository picker, running phases, bulk runs and the CSV bulk import. Before upgrading, set `x2a.scm.authHosts.bitbucket: bitbucket.org` if you use Bitbucket Cloud. This is required even though `bitbucket.org` is the only valid value, because the frontend cannot see whether `integrations.bitbucketCloud` is configured and Backstage always injects a default `bitbucket.org` integration.
