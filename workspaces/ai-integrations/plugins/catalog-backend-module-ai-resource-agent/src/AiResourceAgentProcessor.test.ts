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
import { AiResourceAgentProcessor } from './AiResourceAgentProcessor';

function makeAiResource(
  spec: Entity['spec'] = {},
  annotations?: Record<string, string>,
): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: {
      name: 'test-resource',
      ...(annotations ? { annotations } : {}),
    },
    spec,
  };
}

describe('AiResourceAgentProcessor', () => {
  let processor: AiResourceAgentProcessor;
  const location = { type: 'url', target: 'https://example.com' };
  const emit = jest.fn();

  beforeEach(() => {
    processor = new AiResourceAgentProcessor();
    emit.mockClear();
  });

  it('should return processor name', () => {
    expect(processor.getProcessorName()).toBe('AiResourceAgentProcessor');
  });

  describe('agent validation (spec.type: agent)', () => {
    it('should accept a valid agent entity with required fields', async () => {
      const entity = makeAiResource({
        type: 'agent',
        lifecycle: 'production',
        owner: 'ai-platform-team',
        instructions: 'You are a test agent.',
      });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should accept a valid agent with all optional fields', async () => {
      const entity = makeAiResource({
        type: 'agent',
        lifecycle: 'production',
        owner: 'ai-platform-team',
        instructions: 'You are a fully configured agent.',
        handoffDescription: 'Handles everything.',
        model: 'gpt-4o',
        handoffs: ['agent-a', 'agent-b'],
        tools: ['tool-x', 'tool-y'],
        toolUseBehavior: 'run_llm_again',
        resetToolChoice: true,
        modelSettings: { temperature: 0.5 },
        outputSchema: { type: 'object' },
      });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should accept opaque handoffs and tools strings', async () => {
      const entity = makeAiResource({
        type: 'agent',
        instructions: 'Agent with opaque refs.',
        handoffs: ['some-arbitrary-string', 'another-ref'],
        tools: ['my-custom-tool'],
      });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should accept agent with missing instructions', async () => {
      const entity = makeAiResource({
        type: 'agent',
        lifecycle: 'production',
        owner: 'team',
      });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should accept agent with empty instructions', async () => {
      const entity = makeAiResource({
        type: 'agent',
        instructions: '',
      });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should reject agent with wrong-type instructions', async () => {
      const entity = makeAiResource({
        type: 'agent',
        instructions: 42,
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('spec.instructions');
    });

    it('should reject agent with handoffs as non-array', async () => {
      const entity = makeAiResource({
        type: 'agent',
        instructions: 'Valid instructions.',
        handoffs: 'not-an-array',
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('spec.handoffs');
    });

    it('should reject agent with resetToolChoice as non-boolean', async () => {
      const entity = makeAiResource({
        type: 'agent',
        instructions: 'Valid instructions.',
        resetToolChoice: 'yes',
      });

      await expect(
        processor.preProcessEntity(entity, location, emit),
      ).rejects.toThrow('spec.resetToolChoice');
    });

    it('should not apply agent instructions rule to skill entities', async () => {
      const entity = makeAiResource({
        type: 'skill',
        lifecycle: 'production',
        owner: 'team',
      });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should not apply agent instructions rule to entities without spec.type', async () => {
      const entity = makeAiResource({
        lifecycle: 'production',
        owner: 'team',
      });

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should report multiple agent errors together', async () => {
      const entity = makeAiResource({
        type: 'agent',
        instructions: 42,
        handoffs: 'not-an-array',
      });

      const error = await processor
        .preProcessEntity(entity, location, emit)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      const message = (error as Error).message;
      expect(message).toContain('spec.instructions');
      expect(message).toContain('spec.handoffs');
    });

    it('should not expose internal class names in agent errors', async () => {
      const entity = makeAiResource({
        type: 'agent',
        instructions: 42,
      });

      const error = await processor
        .preProcessEntity(entity, location, emit)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toMatch(/AiResourceAgentProcessor/);
      expect((error as Error).message).not.toMatch(/at\s+\w+\.\w+\s+\(/);
    });
  });

  describe('validateEntityKind', () => {
    it('should return true for a valid AiResource agent entity', async () => {
      const entity = makeAiResource({
        type: 'agent',
        lifecycle: 'production',
        owner: 'ai-platform-team',
        instructions: 'You are a test agent.',
      });
      const result = await processor.validateEntityKind(entity);
      expect(result).toBe(true);
    });

    it('should return false for a non-AiResource kind', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'my-component' },
        spec: { type: 'service', lifecycle: 'production', owner: 'team-a' },
      };
      const result = await processor.validateEntityKind(entity);
      expect(result).toBe(false);
    });

    it('should return false for AiResource with non-agent spec.type', async () => {
      const entity = makeAiResource({
        type: 'skill',
        lifecycle: 'production',
        owner: 'team',
      });
      const result = await processor.validateEntityKind(entity);
      expect(result).toBe(false);
    });

    it('should return false for AiResource with no spec.type', async () => {
      const entity = makeAiResource({
        lifecycle: 'production',
        owner: 'team',
      });
      const result = await processor.validateEntityKind(entity);
      expect(result).toBe(false);
    });
  });

  describe('non-AiResource entities', () => {
    it('should pass through Component entities unchanged', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'my-component' },
        spec: { type: 'service', lifecycle: 'production', owner: 'team-a' },
      };

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });

    it('should not validate agent fields on non-AiResource kinds', async () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Resource',
        metadata: { name: 'my-resource' },
        spec: { type: 'agent', owner: 'team-a' },
      };

      const result = await processor.preProcessEntity(entity, location, emit);

      expect(result).toEqual(entity);
    });
  });
});
