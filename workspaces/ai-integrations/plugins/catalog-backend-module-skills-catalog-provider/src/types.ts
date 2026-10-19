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

import type { Entity } from '@backstage/catalog-model';
import type { SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';
import type {
  IdentityTuple,
  SkillSourceType,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

// ─── Provider configuration ──────────────────────────────────────────

/**
 * Configuration for one connector source within a provider instance.
 *
 * @public
 */
export interface SourceConsumerConfig {
  /** Backstage plugin ID of the connector. */
  connectorPluginId: string;
  /** Source identifier passed to `GET /skills/:sourceId`. */
  sourceId: string;
  /** Expected source type (`oci` or `npx`). */
  sourceType: SkillSourceType;
}

/**
 * Full configuration for one provider instance.
 *
 * @public
 */
export interface SkillsCatalogProviderConfig {
  /** Provider instance identifier (the config key). */
  id: string;
  /** Configured connector sources. */
  sources: SourceConsumerConfig[];
  /** Catalog namespace for produced entities. */
  namespace: string;
  /** Default catalog owner. */
  defaultOwner: string;
  /** Default catalog lifecycle. */
  defaultLifecycle: string;
  /** Optional Backstage scheduler task schedule. */
  schedule?: SchedulerServiceTaskScheduleDefinition;
}

// ─── Mapper handoff (RHIDP-17329) ─────────────────────────────────────

/**
 * A mapped skill entity ready for catalog reconciliation.
 *
 * This is the output of the mapper: a source-scoped identity tuple,
 * a computed entity reference (catalog name), and the full entity
 * with `AiResource` annotations and the content digest.
 *
 * @public
 */
export interface MappedSkillEntity {
  /** Source identity tuple `[type, id, key]`. */
  tuple: IdentityTuple;
  /** Computed deterministic catalog entity name. */
  catalogName: string;
  /** Content digest from the skill record. */
  digest: string;
  /** The fully constructed catalog entity. */
  entity: Entity;
}

// ─── Planner handoff (RHIDP-17330) ──────────────────────────────────

/**
 * Source-scoped location key for catalog mutations.
 *
 * @public
 */
export type SourceLocationKey = string;

/**
 * An entity delta describing the exact additions, updates, and
 * removals for a single source within one reconciliation cycle.
 *
 * @public
 */
export interface SourceDelta {
  /** Entities to add or update (upsert). */
  upserts: MappedSkillEntity[];
  /** Catalog names to remove. */
  removals: string[];
}

/**
 * The planner's output: a source-scoped delta and the intended
 * next ownership state after the delta is applied.
 *
 * @public
 */
export interface ReconciliationPlan {
  /** The exact delta to apply to the catalog. */
  delta: SourceDelta;
  /** The intended next ownership state (all entity names). */
  nextOwnedNames: Set<string>;
}
