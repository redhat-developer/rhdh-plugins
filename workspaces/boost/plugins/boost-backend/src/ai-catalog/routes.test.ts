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

import { stripTier2Fields } from './routes';
import type { AiCatalogAsset, AiCatalogAssetLoader } from './routes';

// ---------------------------------------------------------------------------
// stripTier2Fields unit tests (task 2.4)
// ---------------------------------------------------------------------------

describe('stripTier2Fields', () => {
  const fullAsset: AiCatalogAsset = {
    id: 'asset-1',
    name: 'Test Model',
    description: 'A test AI model',
    category: 'ai-model',
    lifecycleStage: 'published',
    versionCount: 3,
    tags: ['nlp', 'production'],
    usageDocs: '# Usage\nCall the API endpoint...',
    connectionEndpoints: {
      inference: 'https://api.example.com/v1/predict',
    },
    config: { maxTokens: 4096, temperature: 0.7 },
    deploymentParameters: { replicas: 3, gpu: true },
  };

  it('omits Tier 2 fields (usage-docs, connection endpoints, config, deployment parameters)', () => {
    const filtered = stripTier2Fields(fullAsset);
    expect(filtered.usageDocs).toBeUndefined();
    expect(filtered.connectionEndpoints).toBeUndefined();
    expect(filtered.config).toBeUndefined();
    expect(filtered.deploymentParameters).toBeUndefined();
  });

  it('preserves Tier 1 fields (name, description, category, lifecycle, versions, tags)', () => {
    const filtered = stripTier2Fields(fullAsset);
    expect(filtered.id).toBe('asset-1');
    expect(filtered.name).toBe('Test Model');
    expect(filtered.description).toBe('A test AI model');
    expect(filtered.category).toBe('ai-model');
    expect(filtered.lifecycleStage).toBe('published');
    expect(filtered.versionCount).toBe(3);
    expect(filtered.tags).toEqual(['nlp', 'production']);
  });

  it('does not mutate the original asset', () => {
    const original = { ...fullAsset };
    stripTier2Fields(fullAsset);
    expect(fullAsset).toEqual(original);
  });

  it('handles asset with no Tier 2 fields set', () => {
    const tier1Only: AiCatalogAsset = {
      id: 'asset-2',
      name: 'Minimal Asset',
    };
    const filtered = stripTier2Fields(tier1Only);
    expect(filtered.id).toBe('asset-2');
    expect(filtered.name).toBe('Minimal Asset');
    expect(filtered.usageDocs).toBeUndefined();
    expect(filtered.connectionEndpoints).toBeUndefined();
    expect(filtered.config).toBeUndefined();
    expect(filtered.deploymentParameters).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// AiCatalogAssetLoader interface contract tests
// ---------------------------------------------------------------------------

describe('AiCatalogAssetLoader', () => {
  it('supports findById returning an asset', async () => {
    const loader: AiCatalogAssetLoader = {
      findById: async (id: string) => ({
        id,
        name: 'Test',
        usageDocs: 'docs',
      }),
      list: async () => [],
    };
    const result = await loader.findById('asset-1');
    expect(result?.id).toBe('asset-1');
    expect(result?.usageDocs).toBe('docs');
  });

  it('supports findById returning undefined for missing asset', async () => {
    const loader: AiCatalogAssetLoader = {
      findById: async () => undefined,
      list: async () => [],
    };
    const result = await loader.findById('missing');
    expect(result).toBeUndefined();
  });

  it('supports list returning all assets', async () => {
    const assets: AiCatalogAsset[] = [
      { id: '1', name: 'Asset 1', category: 'agent' },
      { id: '2', name: 'Asset 2', category: 'ai-model' },
    ];
    const loader: AiCatalogAssetLoader = {
      findById: async () => undefined,
      list: async () => assets,
    };
    const result = await loader.list();
    expect(result).toHaveLength(2);
    expect(result[0].category).toBe('agent');
  });
});
