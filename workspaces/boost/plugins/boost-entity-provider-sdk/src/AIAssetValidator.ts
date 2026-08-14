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
import type { CatalogProcessor } from '@backstage/plugin-catalog-node';
import {
  AI_ASSET_CATEGORY_ANNOTATION,
  AI_ASSET_VERSION_ANNOTATION,
  AI_ASSET_SOURCE_ANNOTATION,
  AI_ASSET_CATEGORIES,
  AIAssetCategorySchema,
} from './annotations';

/**
 * Prefix shared by all AI asset annotations. Used to detect whether
 * an entity is an AI asset that should be validated.
 *
 * @internal
 */
const AI_ASSET_ANNOTATION_PREFIX = 'rhdh.io/ai-asset-';

/**
 * Returns `true` if the entity carries any `rhdh.io/ai-asset-*` annotation.
 *
 * @internal
 */
function hasAnyAIAssetAnnotation(entity: Entity): boolean {
  const annotations = entity.metadata?.annotations;
  if (!annotations) {
    return false;
  }
  return Object.keys(annotations).some(key =>
    key.startsWith(AI_ASSET_ANNOTATION_PREFIX),
  );
}

/**
 * A Backstage CatalogProcessor that validates AI asset entities.
 *
 * The validator only activates for entities that carry at least one
 * `rhdh.io/ai-asset-*` annotation. Entities without any AI asset
 * annotations pass through unmodified.
 *
 * When activated, the validator rejects entities with:
 * - Missing or invalid `rhdh.io/ai-asset-category`
 * - Missing `rhdh.io/ai-asset-version`
 * - Missing `rhdh.io/ai-asset-source`
 *
 * @public
 */
export class AIAssetValidator implements CatalogProcessor {
  /** @internal */
  getProcessorName(): string {
    return 'AIAssetValidator';
  }

  /** @internal */
  async validateEntityKind(entity: Entity): Promise<boolean> {
    // Only intercept entities carrying AI asset annotations.
    // Return false for non-AI-asset entities so the next processor
    // in the chain handles kind validation.
    if (!hasAnyAIAssetAnnotation(entity)) {
      return false;
    }

    const annotations = entity.metadata?.annotations ?? {};

    // Validate category — must be present and an allowed value
    const category = annotations[AI_ASSET_CATEGORY_ANNOTATION];
    if (!category) {
      throw new Error(
        `Invalid or missing ${AI_ASSET_CATEGORY_ANNOTATION} annotation. ` +
          `Allowed values: ${AI_ASSET_CATEGORIES.join(', ')}`,
      );
    }
    const parsed = AIAssetCategorySchema.safeParse(category);
    if (!parsed.success) {
      throw new Error(
        `Invalid ${AI_ASSET_CATEGORY_ANNOTATION} value '${category}'. ` +
          `Allowed: ${AI_ASSET_CATEGORIES.join(', ')}`,
      );
    }

    // Validate version — must be present
    const version = annotations[AI_ASSET_VERSION_ANNOTATION];
    if (!version) {
      throw new Error(
        `Invalid or missing ${AI_ASSET_VERSION_ANNOTATION} annotation`,
      );
    }

    // Validate source — must be present
    const source = annotations[AI_ASSET_SOURCE_ANNOTATION];
    if (!source) {
      throw new Error(
        `Invalid or missing ${AI_ASSET_SOURCE_ANNOTATION} annotation`,
      );
    }

    // All AI asset annotations are valid. Return false so the
    // standard kind validator still validates the entity kind —
    // we only validate annotation content, not the kind itself.
    return false;
  }
}
