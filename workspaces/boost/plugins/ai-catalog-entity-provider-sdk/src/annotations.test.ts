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
  AI_ASSET_SOURCE_ANNOTATION,
  AI_ASSET_VERSION_ANNOTATION,
  AI_ASSET_CATEGORIES,
  AIAssetCategorySchema,
} from './annotations';

describe('annotation constants', () => {
  it('AI_ASSET_CATEGORY_ANNOTATION has the correct value', () => {
    expect(AI_ASSET_CATEGORY_ANNOTATION).toBe('rhdh.io/ai-asset-category');
  });

  it('AI_ASSET_SOURCE_ANNOTATION has the correct value', () => {
    expect(AI_ASSET_SOURCE_ANNOTATION).toBe('rhdh.io/ai-asset-source');
  });

  it('AI_ASSET_VERSION_ANNOTATION has the correct value', () => {
    expect(AI_ASSET_VERSION_ANNOTATION).toBe('rhdh.io/ai-asset-version');
  });
});

describe('AI_ASSET_CATEGORIES', () => {
  it('exports exactly the five minimum categories plus rule', () => {
    expect(AI_ASSET_CATEGORIES).toEqual(
      expect.arrayContaining([
        'agent',
        'skill',
        'mcp-server',
        'ai-model',
        'model-server',
        'rule',
      ]),
    );
    expect(AI_ASSET_CATEGORIES).toHaveLength(6);
    expect(AI_ASSET_CATEGORIES).not.toContain('skill-bundle');
  });
});

describe('AIAssetCategorySchema', () => {
  it('rejects skill-bundle as invalid category', () => {
    const result = AIAssetCategorySchema.safeParse('skill-bundle');
    expect(result.success).toBe(false);
  });
});
