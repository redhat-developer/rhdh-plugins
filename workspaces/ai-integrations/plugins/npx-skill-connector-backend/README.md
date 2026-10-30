# npx skill connector backend

This demo connector prepares public Agent Skills indexes as sources for the AI
skills catalog. Index parsing, artifact normalization, and snapshot refresh are
separate follow-up work. Until then, configured sources return a `loading`
snapshot.

The `schedule` setting is validated now; refresh tasks will use it when index
retrieval is implemented.

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

The connector does not check DNS-resolved addresses. If a deployment needs to
prevent requests to internal addresses, enforce that through network egress
policy for the configured source origins.
