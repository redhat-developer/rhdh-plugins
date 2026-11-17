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
  agentRhdhNextAiResourceEntityV1alpha1Validator,
  isAgentRhdhNextAiResourceEntity,
} from './AgentRhdhNextAiResourceEntityV1alpha1';
import type { AgentRhdhNextAiResourceEntityV1alpha1 } from './types';

/** Minimal valid agent-rhdh-next entity for reuse across tests. */
function makeMinimalAgent(
  overrides?: Partial<AgentRhdhNextAiResourceEntityV1alpha1['spec']>,
): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: { name: 'test-agent-rhdh-next' },
    spec: {
      type: 'agent-rhdh-next',
      owner: 'ai-platform-team',
      ...overrides,
    },
  } as Entity;
}

/** Full agent-rhdh-next entity with all optional fields populated. */
function makeFullAgent(): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: {
      name: 'full-agent-rhdh-next',
      title: 'Full Agent RHDH Next',
      description: 'Agent with all optional fields.',
    },
    spec: {
      type: 'agent-rhdh-next',
      owner: 'ai-platform-team',
      instructions: 'You are a fully configured agent.',
      inferenceProvider: {
        name: 'openai',
        model: 'gpt-4o',
        modelConfig: {
          temperature: 0.7,
          maxTokens: 4096,
        },
      },
      tools: ['tool-x', 'tool-y'],
      outputSchema: {
        type: 'object',
        properties: { result: { type: 'string' } },
      },
      executionMode: 'sandbox',
    },
  } as Entity;
}

describe('agentRhdhNextAiResourceEntityV1alpha1Validator', () => {
  describe('accept paths', () => {
    it('accepts a minimal valid agent-rhdh-next entity (type + owner only)', async () => {
      const result = await agentRhdhNextAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent(),
      );
      expect(result).toBe(true);
    });

    it('accepts a fully populated agent-rhdh-next entity', async () => {
      const result = await agentRhdhNextAiResourceEntityV1alpha1Validator.check(
        makeFullAgent(),
      );
      expect(result).toBe(true);
    });

    it('accepts agent without instructions', async () => {
      const entity = makeMinimalAgent();
      delete (entity as any).spec.instructions;
      const result = await agentRhdhNextAiResourceEntityV1alpha1Validator.check(
        entity,
      );
      expect(result).toBe(true);
    });

    it('accepts empty string spec.instructions', async () => {
      const result = await agentRhdhNextAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent({ instructions: '' }),
      );
      expect(result).toBe(true);
    });

    it('accepts inferenceProvider without modelConfig', async () => {
      const result = await agentRhdhNextAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent({
          inferenceProvider: { name: 'openai', model: 'gpt-4o' },
        }),
      );
      expect(result).toBe(true);
    });

    it('accepts inferenceProvider with empty modelConfig', async () => {
      const result = await agentRhdhNextAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent({
          inferenceProvider: {
            name: 'openai',
            model: 'gpt-4o',
            modelConfig: {},
          },
        }),
      );
      expect(result).toBe(true);
    });

    it('accepts inferenceProvider with temperature only in modelConfig', async () => {
      const result = await agentRhdhNextAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent({
          inferenceProvider: {
            name: 'openai',
            model: 'gpt-4o',
            modelConfig: { temperature: 0.5 },
          },
        }),
      );
      expect(result).toBe(true);
    });

    it('accepts inferenceProvider with maxTokens only in modelConfig', async () => {
      const result = await agentRhdhNextAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent({
          inferenceProvider: {
            name: 'openai',
            model: 'gpt-4o',
            modelConfig: { maxTokens: 2048 },
          },
        }),
      );
      expect(result).toBe(true);
    });

    it('accepts inferenceProvider with both temperature and maxTokens', async () => {
      const result = await agentRhdhNextAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent({
          inferenceProvider: {
            name: 'openai',
            model: 'gpt-4o',
            modelConfig: { temperature: 0.7, maxTokens: 4096 },
          },
        }),
      );
      expect(result).toBe(true);
    });

    it('accepts outputSchema as object', async () => {
      const result = await agentRhdhNextAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent({
          outputSchema: { type: 'object', properties: {} },
        }),
      );
      expect(result).toBe(true);
    });

    it('accepts outputSchema as non-empty string', async () => {
      const result = await agentRhdhNextAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent({ outputSchema: 'text' }),
      );
      expect(result).toBe(true);
    });

    it('accepts tools as string array', async () => {
      const result = await agentRhdhNextAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent({ tools: ['my-custom-tool'] }),
      );
      expect(result).toBe(true);
    });

    it.each(['in-process', 'subprocess', 'sandbox'] as const)(
      'accepts executionMode: %s',
      async executionMode => {
        const result =
          await agentRhdhNextAiResourceEntityV1alpha1Validator.check(
            makeMinimalAgent({ executionMode }),
          );
        expect(result).toBe(true);
      },
    );

    it('accepts agent without executionMode (field absent)', async () => {
      const entity = makeMinimalAgent();
      delete (entity as any).spec.executionMode;
      const result = await agentRhdhNextAiResourceEntityV1alpha1Validator.check(
        entity,
      );
      expect(result).toBe(true);
    });
  });

  describe('reject paths — required fields', () => {
    it('rejects missing spec.owner', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'AiResource',
        metadata: { name: 'test' },
        spec: { type: 'agent-rhdh-next' },
      };
      await expect(
        agentRhdhNextAiResourceEntityV1alpha1Validator.check(entity),
      ).rejects.toThrow();
    });

    it('rejects empty spec.owner', async () => {
      await expect(
        agentRhdhNextAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({ owner: '' as any }),
        ),
      ).rejects.toThrow();
    });
  });

  describe('reject paths — inferenceProvider', () => {
    it.each([
      ['a string', 'openai'],
      ['a number', 42],
      ['a boolean', true],
      ['null', null],
      ['an array', []],
      ['an empty object', {}],
      ['missing name', { model: 'gpt-4o' }],
      ['missing model', { name: 'openai' }],
      ['empty name', { name: '', model: 'gpt-4o' }],
      ['empty model', { name: 'openai', model: '' }],
      ['non-string name', { name: 42, model: 'gpt-4o' }],
      ['non-string model', { name: 'openai', model: 42 }],
    ])(
      'rejects spec.inferenceProvider with %s',
      async (_description, inferenceProvider) => {
        await expect(
          agentRhdhNextAiResourceEntityV1alpha1Validator.check(
            makeMinimalAgent({ inferenceProvider: inferenceProvider as any }),
          ),
        ).rejects.toThrow(/inferenceProvider/);
      },
    );
  });

  describe('reject paths — modelConfig', () => {
    it('rejects modelConfig.temperature as string', async () => {
      await expect(
        agentRhdhNextAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({
            inferenceProvider: {
              name: 'openai',
              model: 'gpt-4o',
              modelConfig: { temperature: 'high' as any },
            },
          }),
        ),
      ).rejects.toThrow();
    });

    it('rejects modelConfig.maxTokens as string', async () => {
      await expect(
        agentRhdhNextAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({
            inferenceProvider: {
              name: 'openai',
              model: 'gpt-4o',
              modelConfig: { maxTokens: 'lots' as any },
            },
          }),
        ),
      ).rejects.toThrow();
    });

    it('rejects modelConfig with unknown property', async () => {
      await expect(
        agentRhdhNextAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({
            inferenceProvider: {
              name: 'openai',
              model: 'gpt-4o',
              modelConfig: { temperature: 0.5, unknownProp: true } as any,
            },
          }),
        ),
      ).rejects.toThrow();
    });
  });

  describe('reject paths — outputSchema', () => {
    it('rejects outputSchema as empty string', async () => {
      await expect(
        agentRhdhNextAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({ outputSchema: '' as any }),
        ),
      ).rejects.toThrow();
    });
  });

  describe('reject paths — executionMode', () => {
    it('rejects executionMode as boolean', async () => {
      await expect(
        agentRhdhNextAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({ executionMode: true as any }),
        ),
      ).rejects.toThrow();
    });

    it('rejects executionMode as number', async () => {
      await expect(
        agentRhdhNextAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({ executionMode: 42 as any }),
        ),
      ).rejects.toThrow();
    });

    it('rejects executionMode with invalid string value', async () => {
      await expect(
        agentRhdhNextAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({ executionMode: 'other' as any }),
        ),
      ).rejects.toThrow();
    });
  });

  describe('reject paths — wrong type/kind', () => {
    it('rejects spec.type "agent" (wrong discriminator)', async () => {
      await expect(
        agentRhdhNextAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({ type: 'agent' as any }),
        ),
      ).rejects.toThrow();
    });

    it('rejects spec.type "skill"', async () => {
      await expect(
        agentRhdhNextAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({ type: 'skill' as any }),
        ),
      ).rejects.toThrow();
    });

    it('rejects wrong kind', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'test' },
        spec: {
          type: 'agent-rhdh-next',
          owner: 'team',
        },
      };
      const result = await agentRhdhNextAiResourceEntityV1alpha1Validator.check(
        entity,
      );
      expect(result).toBe(false);
    });

    it('rejects wrong type for spec.instructions (number)', async () => {
      await expect(
        agentRhdhNextAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({ instructions: 42 as any }),
        ),
      ).rejects.toThrow();
    });

    it('rejects wrong type for spec.instructions (array)', async () => {
      await expect(
        agentRhdhNextAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({ instructions: ['step 1', 'step 2'] as any }),
        ),
      ).rejects.toThrow();
    });

    it('rejects tools as non-array', async () => {
      await expect(
        agentRhdhNextAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({ tools: 'not-an-array' as any }),
        ),
      ).rejects.toThrow();
    });
  });

  describe('no OpenAI Agents SDK dependency', () => {
    it('does not import openai agents SDK packages', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const srcDir = path.resolve(__dirname);
      const sourceFiles = fs
        .readdirSync(srcDir)
        .filter(f => f.endsWith('.ts') && !f.includes('.test.'));
      expect(sourceFiles.length).toBeGreaterThan(0);
      const importPattern = /from\s+['"]@openai\/agents/;
      for (const file of sourceFiles) {
        const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
        expect(content).not.toMatch(importPattern);
      }
    });
  });
});

describe('isAgentRhdhNextAiResourceEntity', () => {
  it('returns true for a valid agent-rhdh-next entity', () => {
    const entity = makeMinimalAgent();
    expect(isAgentRhdhNextAiResourceEntity(entity)).toBe(true);
  });

  it('returns false for an agent entity (different spec.type)', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'AiResource',
      metadata: { name: 'test-agent' },
      spec: {
        type: 'agent',
        lifecycle: 'production',
        owner: 'team',
        instructions: 'You are a test agent.',
      },
    };
    expect(isAgentRhdhNextAiResourceEntity(entity)).toBe(false);
  });

  it('returns false for a skill entity', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'AiResource',
      metadata: { name: 'test-skill' },
      spec: {
        type: 'skill',
        lifecycle: 'production',
        owner: 'team',
      },
    };
    expect(isAgentRhdhNextAiResourceEntity(entity)).toBe(false);
  });

  it('returns false for a rule entity', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'AiResource',
      metadata: { name: 'test-rule' },
      spec: {
        type: 'rule',
        lifecycle: 'production',
        owner: 'team',
        category: 'security',
        rationale: 'Because safety.',
      },
    };
    expect(isAgentRhdhNextAiResourceEntity(entity)).toBe(false);
  });

  it('returns false for a Component entity', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'my-component' },
      spec: { type: 'service', lifecycle: 'production', owner: 'team' },
    };
    expect(isAgentRhdhNextAiResourceEntity(entity)).toBe(false);
  });

  it('returns false for wrong apiVersion', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'AiResource',
      metadata: { name: 'test-agent-rhdh-next' },
      spec: {
        type: 'agent-rhdh-next',
        owner: 'team',
      },
    };
    expect(isAgentRhdhNextAiResourceEntity(entity)).toBe(false);
  });
});
