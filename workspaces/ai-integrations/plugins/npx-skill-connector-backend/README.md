# npx skill connector backend

This demo connector discovers, retrieves, verifies, and normalizes public Agent
Skills v0.2 index sources for the AI skills catalog. On each scheduled refresh,
discovered `skill-md` entries are fetched through the configured safe transport,
verified against their index SHA-256 digest before decoding, and normalized using
the shared D3 metadata normalizer. Snapshots reflect actual discovered skills, or
partial/failed status on errors.

Configure sources in backend `app-config.yaml`:

```yaml
npxSkillConnector:
  sources:
    - id: rhess
      indexUrl: https://skills.example.com/v0.2/index.json
      # Add only when an index or artifact is hosted on another origin.
      allowedOrigins:
        - https://cdn.example.com
      schedule:
        frequency: { minutes: 10 }
        timeout: { minutes: 10 }
```

`id` and `indexUrl` are required. The index origin is allowed automatically.
Only HTTPS origins may be added to `allowedOrigins`; paths, credentials, queries,
and fragments are rejected. The fetcher enforces a 30-second request limit,
five redirects, a 5 MiB index limit, and a 1 MiB skill file limit.

The connector does not inspect destination addresses. Deployments that need to
restrict destinations should use a network egress policy.
