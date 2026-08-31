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

import type { AIAssetCategory } from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';

/**
 * Minimal catalog entity shape returned by the Backstage catalog API.
 * Only the fields needed for migration readiness analysis.
 *
 * @public
 */
export interface CatalogEntity {
  /** Backstage entity kind (e.g. API, Component, Resource). */
  kind: string;
  /** Entity metadata. */
  metadata: {
    /** Entity name. */
    name: string;
    /** Entity namespace. */
    namespace?: string;
    /** Entity annotations. */
    annotations?: Record<string, string>;
  };
  /** Entity spec. */
  spec?: {
    /** Entity type within its kind. */
    type?: string;
    /** Additional spec fields. */
    [key: string]: unknown;
  };
}

/**
 * Options for fetching entities from the catalog API.
 *
 * @public
 */
export interface FetchEntitiesOptions {
  /** Base URL of the Backstage catalog API (e.g. http://localhost:7007). */
  catalogUrl: string;
  /** Bearer token for authentication (optional). */
  token?: string;
  /** Filter string to narrow entity results (optional). */
  filter?: string;
}

/**
 * Confidence level for an upstream mapping.
 *
 * @public
 */
export type ConfidenceLevel = 'high' | 'medium-high' | 'medium-low' | 'low';

/**
 * Mapping rule describing the current-to-target transformation for
 * an AI asset category.
 *
 * @public
 */
export interface MappingRule {
  /** Current Backstage entity kind. */
  currentKind: string;
  /** Current spec.type value. */
  currentSpecType: string;
  /** Target upstream entity kind (if known). */
  targetKind: string | undefined;
  /** Target upstream entity model name (e.g. McpServerApiEntity). */
  targetModel: string | undefined;
  /** Confidence level for this mapping. */
  confidence: ConfidenceLevel;
  /** List of transformations required for migration. */
  transformations: string[];
  /** Upstream RFC or PR identifiers for tracking. */
  rfcIds: string[];
}

/**
 * Per-entity assessment result in the migration readiness report.
 *
 * @public
 */
export interface EntityAssessment {
  /** Entity reference (e.g. "component:default/my-agent"). */
  entityRef: string;
  /** Display name of the entity. */
  name: string;
  /** AI asset category from annotation (may be an unrecognized string). */
  category: AIAssetCategory | string;
  /** Current Backstage entity kind. */
  currentKind: string;
  /** Current spec.type value. */
  currentSpecType: string;
  /** Target upstream entity kind (if known). */
  targetKind: string | undefined;
  /** Target upstream entity model name. */
  targetModel: string | undefined;
  /** Confidence level for this mapping. */
  confidence: ConfidenceLevel;
  /** List of transformations required. */
  transformations: string[];
  /** Upstream RFC/PR identifiers. */
  rfcIds: string[];
  /** Whether the entity is already aligned with the upstream target. */
  alreadyAligned: boolean;
  /** Warning messages (e.g. partial annotations). */
  warnings: string[];
}

/**
 * Full migration readiness report.
 *
 * @public
 */
export interface MigrationReport {
  /** Assessed entities. */
  entities: EntityAssessment[];
}
