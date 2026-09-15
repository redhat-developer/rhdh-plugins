# npx Skills catalog backend module

Imports `skill-md` entries from a public npx-compatible Agent Skills discovery
index as `AiResource` catalog entities. RHESS is one compatible source.

## Configuration

```yaml
catalog:
  providers:
    npxSkills:
      rhess:
        discoveryUrl: https://rhess.example/.well-known/agent-skills/index.json
        defaultOwner: group:default/platform
        defaultLifecycle: experimental
        catalogNamespace: default
```

The configuration key is the provider identity unless `id` is set explicitly.
The provider runs every ten minutes, accepts public HTTPS indexes and same-origin
`skill-md` artifact URLs, and verifies every artifact against its published
SHA-256 digest before emitting an entity.
