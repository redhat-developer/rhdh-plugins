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

import { Entity } from '@backstage/catalog-model';
import { AiModelServerApiProcessor } from './AiModelServerApiProcessor';

function makeAiModelServerApi(overrides?: Partial<Entity['spec']>): Entity {
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

describe('AiModelServerApiProcessor', () => {
  let processor: AiModelServerApiProcessor;

  beforeEach(() => {
    processor = new AiModelServerApiProcessor();
  });

  it('should return processor name', () => {
    expect(processor.getProcessorName()).toBe('AiModelServerApiProcessor');
  });

  describe('validateEntityKind', () => {
    it('should return true for a valid AiModelServerAPI entity', async () => {
      const result = await processor.validateEntityKind(makeAiModelServerApi());
      expect(result).toBe(true);
    });

    it('should return false for a Component entity', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'my-component' },
        spec: { type: 'service', lifecycle: 'production', owner: 'team-a' },
      };
      const result = await processor.validateEntityKind(entity);
      expect(result).toBe(false);
    });

    it('should return false for an AiResource entity', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'AiResource',
        metadata: { name: 'my-agent' },
        spec: { type: 'agent', lifecycle: 'production', owner: 'team-a' },
      };
      const result = await processor.validateEntityKind(entity);
      expect(result).toBe(false);
    });

    it('should reject an AiModelServerAPI entity missing required fields', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'AiModelServerAPI',
        metadata: { name: 'bad-entity' },
        spec: {
          type: 'ai-model-server',
          lifecycle: 'production',
          owner: 'team',
        },
      } as Entity;
      await expect(processor.validateEntityKind(entity)).rejects.toThrow(
        /serverType/,
      );
    });
  });
});
