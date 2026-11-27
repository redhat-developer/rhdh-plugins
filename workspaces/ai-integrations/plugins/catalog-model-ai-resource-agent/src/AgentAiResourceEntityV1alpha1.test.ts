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
  agentAiResourceEntityV1alpha1Validator,
  isAgentAiResourceEntity,
} from './AgentAiResourceEntityV1alpha1';
import type { AgentAiResourceEntityV1alpha1 } from './types';

/** Minimal valid agent entity for reuse across tests. */
function makeMinimalAgent(
  overrides?: Partial<AgentAiResourceEntityV1alpha1['spec']>,
): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: { name: 'test-agent' },
    spec: {
      type: 'agent',
      lifecycle: 'production',
      owner: 'ai-platform-team',
      instructions: 'You are a test agent.',
      ...overrides,
    },
  } as Entity;
}

/** Full agent entity with all optional fields populated. */
function makeFullAgent(): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: {
      name: 'full-agent',
      title: 'Full Agent',
      description: 'Agent with all optional fields.',
    },
    spec: {
      type: 'agent',
      lifecycle: 'production',
      owner: 'ai-platform-team',
      system: 'ai-tooling',
      instructions: 'You are a fully configured agent.',
      handoffDescription: 'Handles everything.',
      model: 'gpt-4o',
      handoffs: ['agent-a', 'agent-b'],
      tools: ['tool-x', 'tool-y'],
      toolUseBehavior: 'run_llm_again',
      resetToolChoice: true,
      modelSettings: {
        temperature: 0.5,
        maxTokens: 2048,
        toolChoice: 'auto',
      },
      outputSchema: {
        type: 'object',
        properties: { result: { type: 'string' } },
      },
    },
  } as Entity;
}

describe('agentAiResourceEntityV1alpha1Validator', () => {
  describe('accept paths', () => {
    it('accepts a minimal valid agent entity', async () => {
      const result = await agentAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent(),
      );
      expect(result).toBe(true);
    });

    it('accepts a valid agent with all optional fields populated', async () => {
      const result = await agentAiResourceEntityV1alpha1Validator.check(
        makeFullAgent(),
      );
      expect(result).toBe(true);
    });

    it('accepts agent with toolUseBehavior as string array', async () => {
      const result = await agentAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent({ toolUseBehavior: ['tool-a', 'tool-b'] }),
      );
      expect(result).toBe(true);
    });

    it('accepts agent with outputSchema as string type name', async () => {
      const result = await agentAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent({ outputSchema: 'text' }),
      );
      expect(result).toBe(true);
    });

    it('accepts agent with outputSchema as object', async () => {
      const result = await agentAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent({
          outputSchema: { type: 'object', properties: {} },
        }),
      );
      expect(result).toBe(true);
    });

    it('accepts agent with modelSettings.toolChoice as object', async () => {
      const result = await agentAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent({
          modelSettings: {
            toolChoice: { type: 'function', function: { name: 'lookup' } },
          },
        }),
      );
      expect(result).toBe(true);
    });

    it('accepts agent with only required fields and no optionals', async () => {
      const result = await agentAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent(),
      );
      expect(result).toBe(true);
    });

    it('accepts opaque handoffs and tools strings', async () => {
      const result = await agentAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent({
          handoffs: ['some-arbitrary-string', 'another-ref'],
          tools: ['my-custom-tool'],
        }),
      );
      expect(result).toBe(true);
    });
  });

  describe('reject paths', () => {
    it('accepts missing spec.instructions', async () => {
      const entity = makeMinimalAgent();
      delete (entity as any).spec.instructions;
      const result = await agentAiResourceEntityV1alpha1Validator.check(entity);
      expect(result).toBe(true);
    });

    it('accepts empty string spec.instructions', async () => {
      const result = await agentAiResourceEntityV1alpha1Validator.check(
        makeMinimalAgent({ instructions: '' }),
      );
      expect(result).toBe(true);
    });

    it('rejects wrong type for spec.instructions (number)', async () => {
      await expect(
        agentAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({ instructions: 42 as any }),
        ),
      ).rejects.toThrow();
    });

    it('rejects wrong type for spec.instructions (array)', async () => {
      await expect(
        agentAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({ instructions: ['step 1', 'step 2'] as any }),
        ),
      ).rejects.toThrow();
    });

    it('rejects plural spec.type "agents"', async () => {
      await expect(
        agentAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({ type: 'agents' as any }),
        ),
      ).rejects.toThrow();
    });

    it('rejects spec.type "skill" (wrong discriminator)', async () => {
      await expect(
        agentAiResourceEntityV1alpha1Validator.check(
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
          type: 'agent',
          lifecycle: 'production',
          owner: 'team',
          instructions: 'Do stuff.',
        },
      };
      const result = await agentAiResourceEntityV1alpha1Validator.check(entity);
      expect(result).toBe(false);
    });

    it('rejects handoffs as non-array', async () => {
      await expect(
        agentAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({ handoffs: 'not-an-array' as any }),
        ),
      ).rejects.toThrow();
    });

    it('rejects resetToolChoice as non-boolean', async () => {
      await expect(
        agentAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({ resetToolChoice: 'yes' as any }),
        ),
      ).rejects.toThrow();
    });

    it('rejects modelSettings with unknown property', async () => {
      await expect(
        agentAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({
            modelSettings: { temperature: 0.5, unknownProp: true } as any,
          }),
        ),
      ).rejects.toThrow();
    });

    it('rejects modelSettings.temperature as string', async () => {
      await expect(
        agentAiResourceEntityV1alpha1Validator.check(
          makeMinimalAgent({
            modelSettings: { temperature: 'high' as any },
          }),
        ),
      ).rejects.toThrow();
    });

    it('rejects tools as non-array', async () => {
      await expect(
        agentAiResourceEntityV1alpha1Validator.check(
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

describe('isAgentAiResourceEntity', () => {
  it('returns true for a valid agent entity', () => {
    const entity = makeMinimalAgent();
    expect(isAgentAiResourceEntity(entity)).toBe(true);
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
    expect(isAgentAiResourceEntity(entity)).toBe(false);
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
    expect(isAgentAiResourceEntity(entity)).toBe(false);
  });

  it('returns false for a Component entity', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'my-component' },
      spec: { type: 'service', lifecycle: 'production', owner: 'team' },
    };
    expect(isAgentAiResourceEntity(entity)).toBe(false);
  });

  it('returns false for wrong apiVersion', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'AiResource',
      metadata: { name: 'test-agent' },
      spec: {
        type: 'agent',
        lifecycle: 'production',
        owner: 'team',
        instructions: 'Do stuff.',
      },
    };
    expect(isAgentAiResourceEntity(entity)).toBe(false);
  });
});
