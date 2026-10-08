/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { z } from 'zod';

/**
 * Zod schema for the `skillcard.yaml` metadata structure.
 *
 * Use `.parse(data)` to validate parsed YAML against this schema.
 * TypeScript type is inferred via {@link SkillBundleMetadata}.
 *
 * @example
 * ```yaml
 * # skillcard.yaml
 * name: security-toolkit
 * version: 1.0.0
 * description: Curated security analysis skills
 * author: platform-team
 * tags:
 *   - security
 *   - analysis
 * runtime:
 *   language: python
 *   dependencies:
 *     bandit: ">=1.7"
 *     semgrep: ">=1.0"
 * mcp:
 *   servers:
 *     - security-scanner
 *     - vulnerability-db
 * ```
 *
 * @public
 */
export const SkillBundleMetadataSchema = z.object({
  /** Unique name of the skill bundle. */
  name: z.string(),
  /** Version of the skill bundle. */
  version: z.string(),
  /** Human-readable description of the bundle. */
  description: z.string().optional(),
  /** Author or team that maintains the bundle. */
  author: z.string().optional(),
  /** Tags for discovery and categorization. */
  tags: z.array(z.string()).optional(),
  /** Runtime configuration for the skill bundle. */
  runtime: z
    .object({
      /** Programming language (e.g. `"python"`, `"typescript"`). */
      language: z.string(),
      /** Optional dependency name-to-version-constraint map. */
      dependencies: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  /** MCP (Model Context Protocol) server references. */
  mcp: z
    .object({
      /** List of MCP server names used by skills in this bundle. */
      servers: z.array(z.string()),
    })
    .optional(),
});

/**
 * Metadata structure for a `skillcard.yaml` file.
 *
 * Inferred from {@link SkillBundleMetadataSchema} — use the schema
 * for runtime validation and this type for compile-time checks.
 *
 * @public
 */
export type SkillBundleMetadata = z.infer<typeof SkillBundleMetadataSchema>;
