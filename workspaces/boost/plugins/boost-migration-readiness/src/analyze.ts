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

import {
  AI_ASSET_CATEGORY_ANNOTATION,
  AI_ASSET_VERSION_ANNOTATION,
  AI_ASSET_SOURCE_ANNOTATION,
  AIAssetCategorySchema,
} from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';
import type { AIAssetCategory } from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';
import { MAPPING_RULES } from './mappings';
import type { CatalogEntity, EntityAssessment, MigrationReport } from './types';

/**
 * Build an entity reference string from entity fields.
 *
 * @internal
 */
function buildEntityRef(entity: CatalogEntity): string {
  const ns = entity.metadata.namespace ?? 'default';
  return `${entity.kind.toLowerCase()}:${ns}/${entity.metadata.name}`;
}

/**
 * Analyze a list of catalog entities and produce a migration readiness
 * report. Entities without `rhdh.io/ai-asset-category` are excluded.
 * Entities with partial annotations are included with warnings.
 *
 * This function is strictly read-only — it only inspects entity data
 * and produces a report.
 *
 * @public
 */
export function analyzeEntities(entities: CatalogEntity[]): MigrationReport {
  const assessments: EntityAssessment[] = [];

  for (const entity of entities) {
    const annotations = entity.metadata.annotations ?? {};
    const categoryValue = annotations[AI_ASSET_CATEGORY_ANNOTATION];

    // Exclude entities without the category annotation
    if (!categoryValue) {
      continue;
    }

    const parsed = AIAssetCategorySchema.safeParse(categoryValue);
    const warnings: string[] = [];

    if (!parsed.success) {
      // Unrecognized category — include with warning
      warnings.push(
        `Unrecognized ${AI_ASSET_CATEGORY_ANNOTATION} value: '${categoryValue}'`,
      );
      assessments.push({
        entityRef: buildEntityRef(entity),
        name: entity.metadata.name,
        // Scoped to AIAssetCategory (not `any`) so any downstream lookup
        // keyed on `category` (e.g. MAPPING_RULES[assessment.category])
        // is still checked against the real category union, even though
        // this particular value is known to be unrecognized at runtime.
        category: categoryValue as AIAssetCategory,
        currentKind: entity.kind,
        currentSpecType: entity.spec?.type ?? '',
        targetKind: undefined,
        targetModel: undefined,
        confidence: 'low',
        transformations: ['Unrecognized category — manual review required.'],
        rfcIds: [],
        alreadyAligned: false,
        warnings,
      });
      continue;
    }

    const category = parsed.data;
    const mapping = MAPPING_RULES[category];

    // Check for partial annotations
    if (!annotations[AI_ASSET_VERSION_ANNOTATION]) {
      warnings.push(
        'Partial annotations — missing rhdh.io/ai-asset-version. Migration may require manual review.',
      );
    }
    if (!annotations[AI_ASSET_SOURCE_ANNOTATION]) {
      warnings.push(
        'Partial annotations — missing rhdh.io/ai-asset-source. Migration may require manual review.',
      );
    }

    // Determine if already aligned — use exact match for kind since
    // casing alignment (e.g. AIResource → AiResource) is a real
    // migration step, not a trivial equivalence.
    const currentKind = entity.kind;
    const currentSpecType = entity.spec?.type ?? '';
    const alreadyAligned =
      mapping.targetKind !== undefined &&
      currentKind === mapping.targetKind &&
      currentSpecType.toLowerCase() === mapping.currentSpecType.toLowerCase();

    // Check for kind/type mismatch against expected mapping. Skip when the
    // entity is already aligned with the upstream target — comparing an
    // already-migrated entity against the pre-migration "current" mapping
    // would otherwise raise a contradictory warning alongside alreadyAligned.
    if (
      !alreadyAligned &&
      (currentKind.toLowerCase() !== mapping.currentKind.toLowerCase() ||
        (currentSpecType &&
          currentSpecType.toLowerCase() !==
            mapping.currentSpecType.toLowerCase()))
    ) {
      warnings.push(
        `Kind/type mismatch: entity has kind=${currentKind}, spec.type=${currentSpecType} ` +
          `but expected kind=${mapping.currentKind}, spec.type=${mapping.currentSpecType} ` +
          `for category '${category}'.`,
      );
    }

    assessments.push({
      entityRef: buildEntityRef(entity),
      name: entity.metadata.name,
      category,
      currentKind,
      currentSpecType,
      targetKind: mapping.targetKind,
      targetModel: mapping.targetModel,
      confidence: mapping.confidence,
      transformations: mapping.transformations,
      rfcIds: mapping.rfcIds,
      alreadyAligned,
      warnings,
    });
  }

  return { entities: assessments };
}
