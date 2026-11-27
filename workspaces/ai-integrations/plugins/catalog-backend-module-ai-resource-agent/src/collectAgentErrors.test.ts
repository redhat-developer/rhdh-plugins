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
import { collectAgentErrors } from './collectAgentErrors';

function makeAgent(spec: Entity['spec'] = {}): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: { name: 'test-agent' },
    spec: {
      type: 'agent',
      lifecycle: 'production',
      owner: 'ai-platform-team',
      instructions: 'You are a test agent.',
      ...spec,
    },
  };
}

describe('collectAgentErrors', () => {
  describe('non-agent entities are skipped', () => {
    it('returns no errors for spec.type: skill', () => {
      const entity = makeAgent({ type: 'skill' });
      delete (entity as any).spec.instructions;

      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('returns no errors for spec.type: rule', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'AiResource',
        metadata: { name: 'test-rule' },
        spec: { type: 'rule', lifecycle: 'production', owner: 'team' },
      };

      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('returns no errors for spec.type: model', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'AiResource',
        metadata: { name: 'test-model' },
        spec: { type: 'model', lifecycle: 'production', owner: 'team' },
      };

      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('returns no errors when spec is undefined', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'AiResource',
        metadata: { name: 'test' },
      };

      expect(collectAgentErrors(entity)).toEqual([]);
    });
  });

  describe('spec.instructions (optional)', () => {
    it('accepts valid non-empty instructions', () => {
      const entity = makeAgent({ instructions: 'You are a helpful agent.' });

      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('accepts missing instructions', () => {
      const entity = makeAgent();
      delete (entity as any).spec.instructions;

      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('accepts empty string instructions', () => {
      const entity = makeAgent({ instructions: '' });

      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('rejects null instructions', () => {
      const entity = makeAgent({ instructions: null });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.instructions');
      expect(errors[0]).toContain('string');
    });

    it('rejects numeric instructions', () => {
      const entity = makeAgent({ instructions: 42 });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.instructions');
      expect(errors[0]).toContain('string');
    });

    it('rejects array instructions', () => {
      const entity = makeAgent({ instructions: ['step 1', 'step 2'] });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.instructions');
    });
  });

  describe('spec.handoffs (optional, must be array)', () => {
    it('accepts undefined handoffs', () => {
      const entity = makeAgent();
      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('accepts handoffs as string array', () => {
      const entity = makeAgent({
        handoffs: ['agent-a', 'agent-b'],
      });

      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('accepts opaque handoff strings (no entity-ref format)', () => {
      const entity = makeAgent({
        handoffs: ['some-arbitrary-string', 'another-ref'],
      });

      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('rejects handoffs as a string', () => {
      const entity = makeAgent({ handoffs: 'not-an-array' });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.handoffs');
      expect(errors[0]).toContain('array');
    });

    it('rejects handoffs as a number', () => {
      const entity = makeAgent({ handoffs: 123 });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.handoffs');
    });

    it('rejects handoffs as an object', () => {
      const entity = makeAgent({ handoffs: { a: 'b' } });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.handoffs');
    });
  });

  describe('spec.tools (optional, must be array)', () => {
    it('accepts tools as string array', () => {
      const entity = makeAgent({
        tools: ['tool-x', 'tool-y'],
      });

      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('accepts opaque tool strings (no entity-ref format)', () => {
      const entity = makeAgent({
        tools: ['my-custom-tool'],
      });

      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('rejects tools as a string', () => {
      const entity = makeAgent({ tools: 'not-an-array' });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.tools');
      expect(errors[0]).toContain('array');
    });
  });

  describe('spec.resetToolChoice (optional, must be boolean)', () => {
    it('accepts resetToolChoice as true', () => {
      const entity = makeAgent({ resetToolChoice: true });
      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('accepts resetToolChoice as false', () => {
      const entity = makeAgent({ resetToolChoice: false });
      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('rejects resetToolChoice as a string', () => {
      const entity = makeAgent({ resetToolChoice: 'yes' });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.resetToolChoice');
      expect(errors[0]).toContain('boolean');
    });

    it('rejects resetToolChoice as a number', () => {
      const entity = makeAgent({ resetToolChoice: 1 });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.resetToolChoice');
    });
  });

  describe('spec.modelSettings (optional, must be object)', () => {
    it('accepts modelSettings as a plain object', () => {
      const entity = makeAgent({
        modelSettings: { temperature: 0.5, maxTokens: 2048 },
      });

      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('rejects modelSettings as an array', () => {
      const entity = makeAgent({ modelSettings: [1, 2, 3] });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.modelSettings');
      expect(errors[0]).toContain('object');
    });

    it('rejects modelSettings as a string', () => {
      const entity = makeAgent({ modelSettings: 'high' });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.modelSettings');
    });

    it('rejects modelSettings as null', () => {
      const entity = makeAgent({ modelSettings: null });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.modelSettings');
    });
  });

  describe('spec.toolUseBehavior (optional, string or string[])', () => {
    it('accepts toolUseBehavior as a string', () => {
      const entity = makeAgent({ toolUseBehavior: 'run_llm_again' });
      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('accepts toolUseBehavior as a string array', () => {
      const entity = makeAgent({
        toolUseBehavior: ['tool-a', 'tool-b'],
      });
      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('rejects toolUseBehavior as a number', () => {
      const entity = makeAgent({ toolUseBehavior: 42 });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.toolUseBehavior');
    });

    it('rejects toolUseBehavior as a boolean', () => {
      const entity = makeAgent({ toolUseBehavior: true });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.toolUseBehavior');
    });
  });

  describe('spec.outputSchema (optional, string or object)', () => {
    it('accepts outputSchema as a string', () => {
      const entity = makeAgent({ outputSchema: 'text' });
      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('accepts outputSchema as an object', () => {
      const entity = makeAgent({
        outputSchema: { type: 'object', properties: {} },
      });
      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('rejects outputSchema as a number', () => {
      const entity = makeAgent({ outputSchema: 123 });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.outputSchema');
    });

    it('rejects outputSchema as an array', () => {
      const entity = makeAgent({ outputSchema: ['a', 'b'] });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.outputSchema');
    });
  });

  describe('spec.handoffDescription (optional, must be string)', () => {
    it('accepts handoffDescription as a string', () => {
      const entity = makeAgent({
        handoffDescription: 'Handles routing.',
      });
      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('rejects handoffDescription as a number', () => {
      const entity = makeAgent({ handoffDescription: 42 });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.handoffDescription');
      expect(errors[0]).toContain('string');
    });
  });

  describe('spec.model (optional, must be string)', () => {
    it('accepts model as a string', () => {
      const entity = makeAgent({ model: 'gpt-4o' });
      expect(collectAgentErrors(entity)).toEqual([]);
    });

    it('rejects model as a number', () => {
      const entity = makeAgent({ model: 42 });

      const errors = collectAgentErrors(entity);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('spec.model');
      expect(errors[0]).toContain('string');
    });
  });

  describe('multiple errors reported together', () => {
    it('collects all agent field errors in a single array', () => {
      const entity = makeAgent({
        instructions: 42,
        handoffs: 'not-an-array',
        resetToolChoice: 'yes',
      });

      const errors = collectAgentErrors(entity);
      expect(errors.length).toBeGreaterThanOrEqual(3);
      expect(errors.some(e => e.includes('spec.instructions'))).toBe(true);
      expect(errors.some(e => e.includes('spec.handoffs'))).toBe(true);
      expect(errors.some(e => e.includes('spec.resetToolChoice'))).toBe(true);
    });
  });

  describe('error quality', () => {
    it('does not expose internal class names', () => {
      const entity = makeAgent({ instructions: 42 });

      const errors = collectAgentErrors(entity);
      expect(errors.length).toBeGreaterThan(0);
      for (const err of errors) {
        expect(err).not.toMatch(/Processor/);
        expect(err).not.toMatch(/at\s+\w+\.\w+\s+\(/);
      }
    });

    it('names the field path in the error', () => {
      const entity = makeAgent({ instructions: 42 });

      const errors = collectAgentErrors(entity);
      expect(errors[0]).toContain('spec.instructions');
    });
  });

  describe('valid agent with all optional fields', () => {
    it('returns no errors for a fully populated agent', () => {
      const entity = makeAgent({
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
      });

      expect(collectAgentErrors(entity)).toEqual([]);
    });
  });
});
