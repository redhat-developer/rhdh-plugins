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

import { mockServices } from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import type { Entity } from '@backstage/catalog-model';
import {
  CatalogAssetLoader,
  createGetAiCatalogAssetResources,
  entityToAiCatalogAsset,
  entityToAiCatalogAssetResource,
} from './CatalogAssetLoader';

const auth = mockServices.auth();

const codeReviewSkill: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'code-review-skill',
    namespace: 'team-alpha',
    title: 'Code Review Skill',
    description: 'Reviews pull requests for style and correctness',
    tags: ['review', 'quality'],
    annotations: {
      'rhdh.io/ai-asset-category': 'skill',
      'rhdh.io/ai-asset-source': 'internal-registry',
    },
  },
  spec: {
    type: 'skill',
    lifecycle: 'production',
    usageDocs: 'Run `npx skills add code-review-skill`',
    versions: ['1.0.0', '1.1.0'],
  },
};

const graniteModel: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiModelServerAPI',
  metadata: {
    name: 'granite-model',
    description: 'IBM Granite foundation model',
    annotations: {
      'rhdh.io/ai-asset-category': 'ai-model-server',
      'rhdh.io/ai-asset-source': 'watsonx',
    },
  },
  spec: {
    type: 'ai-model-server',
    remotes: [{ type: 'streamable-http', url: 'https://granite.example.com' }],
    config: { temperature: 0.7 },
    deploymentParameters: { replicas: 2 },
  },
};

const nonAiComponent: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: { name: 'unrelated-service' },
  spec: { type: 'service' },
};

describe('entityToAiCatalogAsset', () => {
  it('maps Tier 1 fields from entity metadata and annotations', () => {
    const asset = entityToAiCatalogAsset(codeReviewSkill);
    expect(asset.id).toBe('airesource:team-alpha/code-review-skill');
    expect(asset.name).toBe('Code Review Skill');
    expect(asset.description).toBe(
      'Reviews pull requests for style and correctness',
    );
    expect(asset.category).toBe('skill');
    expect(asset.tags).toEqual(['review', 'quality']);
    expect(asset.lifecycleStage).toBe('production');
    expect(asset.versionCount).toBe(2);
  });

  it('maps Tier 2 fields (usage docs, config, connection endpoints, deployment parameters)', () => {
    const skillAsset = entityToAiCatalogAsset(codeReviewSkill);
    expect(skillAsset.usageDocs).toBe('Run `npx skills add code-review-skill`');

    const modelAsset = entityToAiCatalogAsset(graniteModel);
    expect(modelAsset.connectionEndpoints).toEqual({
      'streamable-http': 'https://granite.example.com',
    });
    expect(modelAsset.config).toEqual({ temperature: 0.7 });
    expect(modelAsset.deploymentParameters).toEqual({ replicas: 2 });
  });

  it('falls back to metadata.name when no title is set', () => {
    const asset = entityToAiCatalogAsset(graniteModel);
    expect(asset.name).toBe('granite-model');
  });

  it('leaves optional Tier 1/Tier 2 fields undefined when absent from the entity', () => {
    const asset = entityToAiCatalogAsset(nonAiComponent);
    expect(asset.category).toBeUndefined();
    expect(asset.lifecycleStage).toBeUndefined();
    expect(asset.versionCount).toBeUndefined();
    expect(asset.usageDocs).toBeUndefined();
    expect(asset.connectionEndpoints).toBeUndefined();
    expect(asset.config).toBeUndefined();
    expect(asset.deploymentParameters).toBeUndefined();
  });
});

// `isAiAsset` itself (taxonomy matching, casing, missing spec.type) is now
// owned and tested by `boost-common`'s `aiAssetTaxonomy.test.ts`; this file
// only tests how `CatalogAssetLoader.findById()` uses it (see the "returns
// undefined when the entity ref resolves to a non-AI entity" test below).

describe('entityToAiCatalogAssetResource', () => {
  it('maps only annotations and namespace for rule evaluation', () => {
    const resource = entityToAiCatalogAssetResource(codeReviewSkill);
    expect(resource).toEqual({
      metadata: {
        annotations: {
          'rhdh.io/ai-asset-category': 'skill',
          'rhdh.io/ai-asset-source': 'internal-registry',
        },
        namespace: 'team-alpha',
      },
    });
  });
});

describe('CatalogAssetLoader', () => {
  function makeLoader(entities: Entity[]) {
    const catalog = catalogServiceMock({ entities });
    return { loader: new CatalogAssetLoader(catalog, auth), catalog };
  }

  describe('list()', () => {
    it('returns only AI catalog assets, mapped to AiCatalogAsset', async () => {
      const { loader } = makeLoader([
        codeReviewSkill,
        graniteModel,
        nonAiComponent,
      ]);

      const assets = await loader.list();

      expect(assets).toHaveLength(2);
      expect(assets.map(a => a.name).sort()).toEqual([
        'Code Review Skill',
        'granite-model',
      ]);
    });

    it('returns an empty array when no AI catalog assets exist', async () => {
      const { loader } = makeLoader([nonAiComponent]);
      const assets = await loader.list();
      expect(assets).toEqual([]);
    });

    it('applies the isAuthorized predicate before mapping to AiCatalogAsset', async () => {
      const { loader } = makeLoader([codeReviewSkill, graniteModel]);

      const assets = await loader.list({
        isAuthorized: resource => resource.metadata.namespace === 'team-alpha',
      });

      expect(assets).toHaveLength(1);
      expect(assets[0].name).toBe('Code Review Skill');
    });

    it('returns no assets when isAuthorized denies everything', async () => {
      const { loader } = makeLoader([codeReviewSkill, graniteModel]);

      const assets = await loader.list({ isAuthorized: () => false });

      expect(assets).toEqual([]);
    });
  });

  describe('findById()', () => {
    it('returns the mapped asset when the entity ref exists', async () => {
      const { loader } = makeLoader([codeReviewSkill]);
      const asset = await loader.findById(
        'airesource:team-alpha/code-review-skill',
      );
      expect(asset?.name).toBe('Code Review Skill');
    });

    it('returns undefined when the entity ref does not exist', async () => {
      const { loader } = makeLoader([codeReviewSkill]);
      const asset = await loader.findById('airesource:default/missing');
      expect(asset).toBeUndefined();
    });

    it('returns undefined when the entity ref resolves to a non-AI entity', async () => {
      const { loader } = makeLoader([nonAiComponent]);
      const asset = await loader.findById(
        'component:default/unrelated-service',
      );
      expect(asset).toBeUndefined();
    });
  });
});

describe('createGetAiCatalogAssetResources', () => {
  it('resolves entity refs to AiCatalogAssetResource in request order', async () => {
    const catalog = catalogServiceMock({
      entities: [codeReviewSkill, graniteModel],
    });
    const getResources = createGetAiCatalogAssetResources(catalog, auth);

    const resources = await getResources([
      'airesource:team-alpha/code-review-skill',
      'aimodelserverapi:default/granite-model',
    ]);

    expect(resources).toHaveLength(2);
    expect(resources[0]?.metadata.namespace).toBe('team-alpha');
    expect(
      resources[1]?.metadata.annotations?.['rhdh.io/ai-asset-source'],
    ).toBe('watsonx');
  });

  it('returns undefined in the position of refs that do not resolve', async () => {
    const catalog = catalogServiceMock({ entities: [codeReviewSkill] });
    const getResources = createGetAiCatalogAssetResources(catalog, auth);

    const resources = await getResources([
      'airesource:team-alpha/code-review-skill',
      'aimodelserverapi:default/missing',
    ]);

    expect(resources).toHaveLength(2);
    expect(resources[0]).toBeDefined();
    expect(resources[1]).toBeUndefined();
  });
});
