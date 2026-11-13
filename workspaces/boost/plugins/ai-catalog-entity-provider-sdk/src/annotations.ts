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
 * Kept `@internal` to avoid exposing a Zod v3 type in the public API
 * surface — a future Zod major version upgrade would otherwise be a
 * breaking change for downstream consumers who compose with this schema.
 * Use the {@link AIAssetCategory} string union type for public contracts.
 *
 * @internal
 */
export const AIAssetCategorySchema = z.enum([
  'agent',
  'skill',
  'rule',
  'mcp-server',
  'ai-model',
  'model-server',
]);

/**
 * Allowed AI asset category values.
 *
 * Defined as a plain string union so that downstream consumers are not
 * coupled to the Zod version used internally by the SDK.
 *
 * @public
 */
export type AIAssetCategory =
  | 'agent'
  | 'skill'
  | 'rule'
  | 'mcp-server'
  | 'ai-model'
  | 'model-server';

/**
 * Array of all allowed AI asset category values, for display in
 * error messages and documentation.
 *
 * @public
 */
export const AI_ASSET_CATEGORIES: readonly AIAssetCategory[] =
  AIAssetCategorySchema.options;
