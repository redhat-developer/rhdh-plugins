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
 * Annotation key for the AI asset category.
 *
 * @public
 */
export const AI_ASSET_CATEGORY_ANNOTATION = 'rhdh.io/ai-asset-category';

/**
 * Annotation key for the AI asset version.
 *
 * @public
 */
export const AI_ASSET_VERSION_ANNOTATION = 'rhdh.io/ai-asset-version';

/**
 * Annotation key for the AI asset source (connector/registry provenance).
 *
 * @public
 */
export const AI_ASSET_SOURCE_ANNOTATION = 'rhdh.io/ai-asset-source';

/**
 * Zod schema for the allowed AI asset category values.
 *
 * @public
 */
export const AIAssetCategorySchema = z.enum([
  'agent',
  'skill',
  'rule',
  'skill-bundle',
  'mcp-server',
  'ai-model',
  'model-server',
]);

/**
 * Allowed AI asset category values.
 *
 * @public
 */
export type AIAssetCategory = z.infer<typeof AIAssetCategorySchema>;

/**
 * Array of all allowed AI asset category values, for display in
 * error messages and documentation.
 *
 * @public
 */
export const AI_ASSET_CATEGORIES: readonly AIAssetCategory[] =
  AIAssetCategorySchema.options;
