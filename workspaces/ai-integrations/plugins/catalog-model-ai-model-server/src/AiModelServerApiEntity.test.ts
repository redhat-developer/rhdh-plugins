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
  aiModelServerApiEntityValidator,
  isAiModelServerApiEntity,
} from './AiModelServerApiEntity';
import type { AiModelServerApiEntity } from './types';

/** Minimal valid ai-model-server entity for reuse across tests. */
function makeMinimalEntity(
  overrides?: Partial<AiModelServerApiEntity['spec']>,
): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiModelServerAPI',
    metadata: { name: 'test-ai-model-server' },
    spec: {
      type: 'ai-model-server',
      lifecycle: 'experimental',
      owner: 'backstage',
      serverType: 'openai-v1',
      serverUrl: 'https://api.openai.com/v1',
      ...overrides,
    },
  } as Entity;
}

/** Full entity with all optional fields populated. */
function makeFullEntity(): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiModelServerAPI',
    metadata: {
      name: 'full-ai-model-server',
      title: 'Full AI Model Server',
      description: 'AI model server with all optional fields.',
    },
    spec: {
      type: 'ai-model-server',
      lifecycle: 'production',
      owner: 'ai-platform-team',
      system: 'ai-tooling',
      serverType: 'openai-v1',
      serverUrl: 'https://api.openai.com/v1',
      requiresApiKey: true,
      apiEntityRef: 'api:default/openai-spec',
      models: {
        discoverable: true,
        available: ['gpt-4o', 'gpt-4o-mini'],
        default: 'gpt-4o',
      },
    },
  } as Entity;
}

describe('aiModelServerApiEntityValidator', () => {
  describe('accept paths', () => {
    it('accepts a valid ai-model-server entity with required fields only', async () => {
      const result = await aiModelServerApiEntityValidator.check(
        makeMinimalEntity(),
      );
      expect(result).toBe(true);
    });

    it('accepts v1beta1', async () => {
      const entity = makeMinimalEntity();
      (entity as any).apiVersion = 'backstage.io/v1beta1';
      const result = await aiModelServerApiEntityValidator.check(entity);
      expect(result).toBe(true);
    });

    it('accepts a fully populated entity with all optional fields', async () => {
      const result = await aiModelServerApiEntityValidator.check(
        makeFullEntity(),
      );
      expect(result).toBe(true);
    });

    it('accepts entity with models containing only discoverable', async () => {
      const result = await aiModelServerApiEntityValidator.check(
        makeMinimalEntity({ models: { discoverable: true } }),
      );
      expect(result).toBe(true);
    });

    it('accepts entity with requiresApiKey set to false', async () => {
      const result = await aiModelServerApiEntityValidator.check(
        makeMinimalEntity({ requiresApiKey: false }),
      );
      expect(result).toBe(true);
    });
  });

  describe('reject paths', () => {
    it('rejects wrong spec.type value', async () => {
      await expect(
        aiModelServerApiEntityValidator.check(
          makeMinimalEntity({ type: 'openapi' as any }),
        ),
      ).rejects.toThrow(/type/);
    });

    it('rejects missing serverType', async () => {
      const entity = makeMinimalEntity();
      delete (entity as any).spec.serverType;
      await expect(
        aiModelServerApiEntityValidator.check(entity),
      ).rejects.toThrow(/serverType/);
    });

    it('rejects missing serverUrl', async () => {
      const entity = makeMinimalEntity();
      delete (entity as any).spec.serverUrl;
      await expect(
        aiModelServerApiEntityValidator.check(entity),
      ).rejects.toThrow(/serverUrl/);
    });

    it('rejects empty serverType', async () => {
      await expect(
        aiModelServerApiEntityValidator.check(
          makeMinimalEntity({ serverType: '' }),
        ),
      ).rejects.toThrow(/serverType/);
    });

    it('rejects empty serverUrl', async () => {
      await expect(
        aiModelServerApiEntityValidator.check(
          makeMinimalEntity({ serverUrl: '' }),
        ),
      ).rejects.toThrow(/serverUrl/);
    });

    it('rejects wrong kind', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'test' },
        spec: {
          type: 'ai-model-server',
          lifecycle: 'production',
          owner: 'team',
          serverType: 'openai-v1',
          serverUrl: 'https://api.openai.com/v1',
        },
      };
      const result = await aiModelServerApiEntityValidator.check(entity);
      expect(result).toBe(false);
    });

    it('rejects serverUrl with wrong type (number)', async () => {
      await expect(
        aiModelServerApiEntityValidator.check(
          makeMinimalEntity({ serverUrl: 42 as any }),
        ),
      ).rejects.toThrow();
    });
  });
});

describe('isAiModelServerApiEntity', () => {
  it('returns true for an ai-model-server entity', () => {
    const entity = makeMinimalEntity();
    expect(isAiModelServerApiEntity(entity)).toBe(true);
  });

  it('returns false for an openapi API entity', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      metadata: { name: 'a' },
      spec: {
        type: 'openapi',
        lifecycle: 'production',
        owner: 'me',
        definition: 'x',
      },
    };
    expect(isAiModelServerApiEntity(entity)).toBe(false);
  });

  it('returns false for an mcp-server API entity', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      metadata: { name: 'a' },
      spec: {
        type: 'mcp-server',
        lifecycle: 'production',
        owner: 'me',
        remotes: [],
      },
    };
    expect(isAiModelServerApiEntity(entity)).toBe(false);
  });

  it('returns false for a Component entity', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'my-component' },
      spec: { type: 'service', lifecycle: 'production', owner: 'team' },
    };
    expect(isAiModelServerApiEntity(entity)).toBe(false);
  });
});
