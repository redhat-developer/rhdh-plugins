# npx skill connector backend

This demo connector discovers, retrieves, verifies, and normalizes public Agent
Skills v0.2 index sources for the AI skills catalog. On each scheduled refresh,
discovered `skill-md` entries are fetched through the configured safe transport,
verified against their index SHA-256 digest before decoding, and normalized using
the shared metadata normalizer. Snapshots reflect actual discovered skills, or
partial/failed status on errors.

The snapshot endpoint uses Backstage's default backend authentication. Both
authenticated users and services can read it; the catalog provider uses a
service token.

## Configuration

### Source configuration

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

### Integrating with the skills catalog provider

The npx connector serves normalized snapshots that the common skills catalog
provider consumes to produce `AiResource` catalog entities. Wire both together
in `app-config.yaml`:

```yaml
# 1. Configure the npx connector source.
npxSkillConnector:
  sources:
    - id: public-agent-skills
      indexUrl: https://evilmartians.com/.well-known/agent-skills/index.json
      schedule:
        frequency: { minutes: 10 }
        timeout: { minutes: 10 }
        initialDelay: { seconds: 0 }

# 2. Configure the catalog provider to consume the npx snapshot.
catalog:
  providers:
    skillsCatalogProvider:
      production:
        sources:
          - connectorPluginId: npx-skill-connector
            sourceId: public-agent-skills # Must match npxSkillConnector.sources[].id.
            sourceType: npx
        defaultOwner: team-skills
        defaultLifecycle: production
        schedule:
          frequency: { minutes: 10 }
          timeout: { minutes: 10 }
```

The `connectorPluginId` must be `npx-skill-connector` (the plugin ID registered
by this backend plugin). The `sourceId` must match the `id` field of one of
the configured npx sources. The provider resolves the connector's base URL
through Backstage service discovery and obtains a service token targeted to
`npx-skill-connector` for each snapshot request.

npx skill entities do not receive a `backstage.io/techdocs-ref` annotation.

### Combining OCI and npx sources

Both source types use the same common provider. Configure them together for a
unified catalog view:

```yaml
catalog:
  providers:
    skillsCatalogProvider:
      production:
        sources:
          - connectorPluginId: skill-image-connector
            sourceId: quay-public
            sourceType: oci
          - connectorPluginId: npx-skill-connector
            sourceId: public-agent-skills
            sourceType: npx
        defaultOwner: team-skills
        defaultLifecycle: production
        schedule:
          frequency: { minutes: 10 }
          timeout: { minutes: 10 }
```

An HTTP or authentication failure for one source does not stop the other.
Each source has independent acquisition, reconciliation, and catalog ownership.

## Public Agent Skills demo

To run the demo with Evil Martians' public Agent Skills v0.2 index:

1. Add the npx connector and the skills catalog provider to your backend
   packages:

   ```ts
   // packages/backend/src/index.ts
   backend.add(
     import(
       '@red-hat-developer-hub/backstage-plugin-npx-skill-connector-backend'
     ),
   );
   backend.add(
     import(
       '@red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider'
     ),
   );
   ```

2. Add the configuration to `app-config.yaml`:

   ```yaml
   npxSkillConnector:
     sources:
       - id: public-agent-skills
         indexUrl: https://evilmartians.com/.well-known/agent-skills/index.json
         schedule:
           frequency: { minutes: 10 }
           timeout: { minutes: 10 }
           initialDelay: { seconds: 0 }

   catalog:
     providers:
       skillsCatalogProvider:
         demo:
           sources:
             - connectorPluginId: npx-skill-connector
               sourceId: public-agent-skills
               sourceType: npx
           defaultOwner: user:default/guest
           defaultLifecycle: experimental
           schedule:
             frequency: { minutes: 1 }
             timeout: { minutes: 10 }
             initialDelay: { seconds: 0 }
   ```

3. Start the backend with `yarn dev`. The connector snapshot will appear at
   `/api/npx-skill-connector/skills/public-agent-skills` and the catalog
   provider will create `AiResource` skill entities with `npx`
   source/reference annotations after the connector refresh and a subsequent
   provider cycle.

4. Verify the snapshot endpoint with a valid Backstage service token:

   ```bash
   curl -H "Authorization: Bearer <service-token>" \
     http://localhost:7007/api/npx-skill-connector/skills/public-agent-skills
   ```

   Before the first completed refresh, the endpoint returns `loading` with
   empty arrays and `observedAt: null`. After a successful refresh, it returns
   `ready` with normalized skill records and a completion timestamp.
