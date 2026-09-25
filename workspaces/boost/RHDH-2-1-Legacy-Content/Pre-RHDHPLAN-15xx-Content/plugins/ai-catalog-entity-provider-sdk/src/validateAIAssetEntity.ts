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
import {
  AI_ASSET_CATEGORY_ANNOTATION,
  AI_ASSET_VERSION_ANNOTATION,
  AI_ASSET_SOURCE_ANNOTATION,
  AI_ASSET_CATEGORIES,
  AIAssetCategorySchema,
} from './annotations';

/**
 * Validate that an entity has all required AI asset annotations with
 * valid values. Throws if any annotation is missing or invalid.
 *
 * @param entity - A Backstage catalog entity to validate.
 * @throws Error if `rhdh.io/ai-asset-category` is missing or invalid.
 * @throws Error if `rhdh.io/ai-asset-version` is missing or empty.
 * @throws Error if `rhdh.io/ai-asset-source` is missing or empty.
 *
 * @public
 */
export function validateAIAssetEntity(entity: Entity): void {
  const annotations = entity.metadata?.annotations ?? {};

  // Validate category
  const category = annotations[AI_ASSET_CATEGORY_ANNOTATION];
  if (!category) {
    throw new Error(
      `Invalid or missing ${AI_ASSET_CATEGORY_ANNOTATION} annotation`,
    );
  }
  const parsed = AIAssetCategorySchema.safeParse(category);
  if (!parsed.success) {
    throw new Error(
      `Invalid ${AI_ASSET_CATEGORY_ANNOTATION} value '${category}'. Allowed: ${AI_ASSET_CATEGORIES.join(', ')}`,
    );
  }

  // Validate version
  const version = annotations[AI_ASSET_VERSION_ANNOTATION];
  if (!version) {
    throw new Error(
      `Invalid or missing ${AI_ASSET_VERSION_ANNOTATION} annotation`,
    );
  }

  // Validate source
  const source = annotations[AI_ASSET_SOURCE_ANNOTATION];
  if (!source) {
    throw new Error(
      `Invalid or missing ${AI_ASSET_SOURCE_ANNOTATION} annotation`,
    );
  }
}
