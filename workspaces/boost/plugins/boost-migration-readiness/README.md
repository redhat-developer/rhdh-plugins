# @red-hat-developer-hub/backstage-plugin-boost-migration-readiness

Read-only CLI that assesses AI asset catalog entity migration readiness against upstream Backstage entity kinds.

## Overview

This tool enumerates AI asset entities from a Backstage catalog and reports migration readiness for each entity, including:

- Current entity kind and `spec.type`
- Target upstream entity kind (from the [annotation specification](../../specifications/annotation-specification.md))
- Confidence level (high / medium–high / medium–low / low)
- Required transformations for migration
- Warnings for partial annotations or kind/type mismatches

**This is a migration-readiness assessment only.** No catalog writes, deletions, or configuration modifications are performed. Actual migration is future work pending upstream RFC finalization.

## Usage

```bash
npx @red-hat-developer-hub/backstage-plugin-boost-migration-readiness \
  --catalog-url http://localhost:7007
```

### Options

| Option            | Description                                 | Default |
| ----------------- | ------------------------------------------- | ------- |
| `--catalog-url`   | Backstage catalog API base URL (required)   | —       |
| `--output-format` | Output format: `json` or `text`             | `text`  |
| `--token`         | Bearer token for catalog API authentication | —       |
| `--filter`        | Filter string to narrow entity results      | —       |

### Examples

Human-readable report (default):

```bash
boost-migration-readiness --catalog-url http://localhost:7007
```

JSON output for machine consumption:

```bash
boost-migration-readiness --catalog-url http://localhost:7007 --output-format json
```

With authentication:

```bash
boost-migration-readiness --catalog-url http://localhost:7007 --token $BACKSTAGE_TOKEN
```

## Output Interpretation

### Confidence Levels

| Level           | Meaning                                                |
| --------------- | ------------------------------------------------------ |
| **High**        | Upstream kind shipped and stable, kind already aligned |
| **Medium–High** | Upstream kind shipped, field/name alignment needed     |
| **Medium/Low**  | Upstream target proposed in open PR, hedge             |
| **Low**         | No solid upstream kind, mapping speculative            |

### Entity Categories

The tool assesses all seven AI asset categories:

- `agent` — AI agents (Component kind)
- `skill` — Reusable AI skills (AIResource kind)
- `rule` — AI decision rules (AIResource kind)
- `skill-bundle` — Curated skill collections (AIResource kind)
- `mcp-server` — Model Context Protocol servers (API kind)
- `ai-model` — AI/ML models (Resource kind)
- `model-server` — Inference endpoints (Resource kind)

## Programmatic API

The package also exports functions for use as a library:

```typescript
import {
  fetchEntities,
  analyzeEntities,
  formatJson,
  formatText,
  MAPPING_RULES,
} from '@red-hat-developer-hub/backstage-plugin-boost-migration-readiness';
```

## Upstream Tracking

- MCP Server: [backstage#34016](https://github.com/backstage/backstage/pull/34016) / RFC [#32062](https://github.com/backstage/backstage/issues/32062)
- AiResource (skills/rules): [#33575](https://github.com/backstage/backstage/issues/33575)
- Model Server: [backstage#34476](https://github.com/backstage/backstage/pull/34476) / RFC [#33060](https://github.com/backstage/backstage/issues/33060)

## Future Work

- Actual catalog entity migration (depends on upstream RFC finalization)
- Migration processor for automated transformations
- Expanded `rhdh.io/ai-asset-source` connector vocabulary

## Related

- [Annotation Specification](../../specifications/annotation-specification.md)
- [AI Catalog Entity Model Design](../../openspec/changes/ai-catalog-entity-model/design.md) (Decision 1)
- [#4042](https://github.com/redhat-developer/rhdh-plugins/issues/4042) — Migration design + RHDH sign-off (RHIDP-15302)
