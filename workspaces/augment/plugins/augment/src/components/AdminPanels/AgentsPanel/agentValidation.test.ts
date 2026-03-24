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
  createDefaultAgent,
  agentFromConfig,
  detectCircularHandoffs,
  validateAgents,
  buildAgentContext,
  type AgentFormData,
} from './agentValidation';

describe('agentValidation', () => {
  describe('createDefaultAgent', () => {
    it('returns blank agent form data', () => {
      const agent = createDefaultAgent();
      expect(agent.name).toBe('');
      expect(agent.instructions).toBe('');
      expect(agent.handoffs).toEqual([]);
      expect(agent.asTools).toEqual([]);
      expect(agent.mcpServers).toEqual([]);
      expect(agent.enableRAG).toBe(false);
      expect(agent.enableWebSearch).toBe(false);
      expect(agent.enableCodeInterpreter).toBe(false);
    });
  });

  describe('agentFromConfig', () => {
    it('parses a full agent config', () => {
      const cfg = {
        name: 'Triage Agent',
        instructions: 'Route the user',
        handoffDescription: 'Routes incoming requests',
        model: 'llama-3.3',
        handoffs: ['billing', 'support'],
        asTools: ['lookup'],
        mcpServers: ['ocp-server'],
        enableRAG: true,
        enableWebSearch: false,
        enableCodeInterpreter: true,
      };

      const result = agentFromConfig(cfg);

      expect(result.name).toBe('Triage Agent');
      expect(result.instructions).toBe('Route the user');
      expect(result.handoffDescription).toBe('Routes incoming requests');
      expect(result.model).toBe('llama-3.3');
      expect(result.handoffs).toEqual(['billing', 'support']);
      expect(result.asTools).toEqual(['lookup']);
      expect(result.mcpServers).toEqual(['ocp-server']);
      expect(result.enableRAG).toBe(true);
      expect(result.enableWebSearch).toBe(false);
      expect(result.enableCodeInterpreter).toBe(true);
    });

    it('handles missing fields gracefully', () => {
      const result = agentFromConfig({});
      expect(result.name).toBe('');
      expect(result.instructions).toBe('');
      expect(result.handoffs).toEqual([]);
      expect(result.enableRAG).toBe(false);
    });

    it('handles non-array handoffs gracefully', () => {
      const result = agentFromConfig({ handoffs: 'not-an-array' });
      expect(result.handoffs).toEqual([]);
    });

    it('handles non-array asTools gracefully', () => {
      const result = agentFromConfig({ asTools: 42 });
      expect(result.asTools).toEqual([]);
    });

    it('handles non-array mcpServers gracefully', () => {
      const result = agentFromConfig({ mcpServers: null });
      expect(result.mcpServers).toEqual([]);
    });

    it('filters non-string elements from arrays', () => {
      const result = agentFromConfig({
        handoffs: ['valid', 123, null, 'also-valid'],
      });
      expect(result.handoffs).toEqual(['valid', 'also-valid']);
    });

    it('handles null/undefined string fields', () => {
      const result = agentFromConfig({ name: null, instructions: undefined });
      expect(result.name).toBe('');
      expect(result.instructions).toBe('');
    });
  });

  describe('detectCircularHandoffs', () => {
    function agent(overrides: Partial<AgentFormData> = {}): AgentFormData {
      return {
        ...createDefaultAgent(),
        name: 'Test',
        instructions: 'test',
        ...overrides,
      };
    }

    it('returns empty for agents with no handoffs', () => {
      const agents = {
        triage: agent(),
        billing: agent(),
      };
      expect(detectCircularHandoffs(agents)).toEqual([]);
    });

    it('returns empty for linear handoff chain', () => {
      const agents = {
        triage: agent({ handoffs: ['billing'] }),
        billing: agent({ handoffs: ['support'] }),
        support: agent(),
      };
      expect(detectCircularHandoffs(agents)).toEqual([]);
    });

    it('allows A → B → A routing pattern (standard handoff-back)', () => {
      const agents = {
        a: agent({ handoffs: ['b'] }),
        b: agent({ handoffs: ['a'] }),
      };
      expect(detectCircularHandoffs(agents)).toEqual([]);
    });

    it('allows A → B → C → A routing pattern (standard multi-hop)', () => {
      const agents = {
        a: agent({ handoffs: ['b'] }),
        b: agent({ handoffs: ['c'] }),
        c: agent({ handoffs: ['a'] }),
      };
      expect(detectCircularHandoffs(agents)).toEqual([]);
    });

    it('detects self-referencing handoff', () => {
      const agents = {
        a: agent({ handoffs: ['a'] }),
      };
      const warnings = detectCircularHandoffs(agents);
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('hands off to itself');
    });

    it('returns empty for empty agent map', () => {
      expect(detectCircularHandoffs({})).toEqual([]);
    });
  });

  describe('validateAgents', () => {
    function agent(overrides: Partial<AgentFormData> = {}): AgentFormData {
      return {
        ...createDefaultAgent(),
        name: 'Agent',
        instructions: 'Do something',
        ...overrides,
      };
    }

    it('returns no errors for a valid single agent', () => {
      const agents = { triage: agent({ name: 'Triage' }) };
      const result = validateAgents(agents, 'triage');
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('returns no errors for a valid multi-agent setup', () => {
      const agents = {
        triage: agent({ name: 'Triage', handoffs: ['billing'] }),
        billing: agent({ name: 'Billing' }),
      };
      const result = validateAgents(agents, 'triage');
      expect(result.errors).toEqual([]);
    });

    it('reports missing name', () => {
      const agents = { triage: agent({ name: '' }) };
      const result = validateAgents(agents, 'triage');
      expect(result.errors).toContain('Agent "triage" has no name');
    });

    it('reports missing instructions', () => {
      const agents = { triage: agent({ instructions: '' }) };
      const result = validateAgents(agents, 'triage');
      expect(result.errors).toContain('Agent "triage" has no instructions');
    });

    it('reports handoff to unknown agent', () => {
      const agents = {
        triage: agent({ name: 'Triage', handoffs: ['nonexistent'] }),
      };
      const result = validateAgents(agents, 'triage');
      expect(result.errors).toContain(
        'Agent "triage" hands off to unknown "nonexistent"',
      );
    });

    it('reports asTools referencing unknown agent', () => {
      const agents = {
        triage: agent({ name: 'Triage', asTools: ['ghost'] }),
      };
      const result = validateAgents(agents, 'triage');
      expect(result.errors).toContain(
        'Agent "triage" calls unknown agent "ghost" as tool',
      );
    });

    it('reports invalid default agent', () => {
      const agents = { triage: agent({ name: 'Triage' }) };
      const result = validateAgents(agents, 'billing');
      expect(result.errors).toContain('Default agent "billing" not found');
    });

    it('allows standard handoff-back pattern (A → B → A) without circular warnings', () => {
      const agents = {
        a: agent({ name: 'A', handoffs: ['b'], handoffDescription: 'Agent A' }),
        b: agent({ name: 'B', handoffs: ['a'], handoffDescription: 'Agent B' }),
      };
      const result = validateAgents(agents, 'a');
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('returns no errors for empty agent map with empty default', () => {
      const result = validateAgents({}, '');
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('accumulates multiple errors', () => {
      const agents = {
        triage: agent({ name: '', instructions: '', handoffs: ['unknown'] }),
      };
      const result = validateAgents(agents, 'bad-default');
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('reports whitespace-only name as missing', () => {
      const agents = { a: agent({ name: '   ' }) };
      const result = validateAgents(agents, 'a');
      expect(result.errors).toContain('Agent "a" has no name');
    });

    it('reports whitespace-only instructions as missing', () => {
      const agents = { a: agent({ instructions: '  \n  ' }) };
      const result = validateAgents(agents, 'a');
      expect(result.errors).toContain('Agent "a" has no instructions');
    });

    it('does not block save for standard handoff-back-to-entry pattern', () => {
      const agents = {
        router: agent({ name: 'Router', handoffs: ['ops', 'support'] }),
        ops: agent({ name: 'Ops', handoffs: ['router'] }),
        support: agent({ name: 'Support', handoffs: ['router'] }),
      };
      const result = validateAgents(agents, 'router');
      expect(result.errors).toEqual([]);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('warns when default agent has no handoffs or delegates in multi-agent setup', () => {
      const agents = {
        router: agent({
          name: 'Router',
          handoffs: [],
          handoffDescription: 'Routes',
        }),
        support: agent({ name: 'Support', handoffDescription: 'Supports' }),
      };
      const result = validateAgents(agents, 'router');
      expect(
        result.warnings.some(
          w =>
            w.includes('starting agent') &&
            w.includes('no handoffs or delegates'),
        ),
      ).toBe(true);
    });

    it('warns when handoff target has no handoff description', () => {
      const agents = {
        a: agent({ name: 'A', handoffs: ['b'], handoffDescription: 'Agent A' }),
        b: agent({ name: 'B', handoffDescription: '' }),
      };
      const result = validateAgents(agents, 'a');
      expect(
        result.warnings.some(
          w =>
            w.includes('handoff target') &&
            w.includes('no handoff description'),
        ),
      ).toBe(true);
    });

    it('warns when toolChoice=required with handoffs and tools', () => {
      const agents = {
        a: agent({
          name: 'A',
          handoffs: ['b'],
          toolChoice: 'required',
          enableRAG: true,
          handoffDescription: 'A desc',
        }),
        b: agent({ name: 'B', handoffDescription: 'B desc' }),
      };
      const result = validateAgents(agents, 'a');
      expect(
        result.warnings.some(
          w => w.includes('toolChoice=required') && w.includes('handoffs'),
        ),
      ).toBe(true);
    });

    it('reports multiple unknown handoffs', () => {
      const agents = {
        triage: agent({ name: 'Triage', handoffs: ['x', 'y', 'z'] }),
      };
      const result = validateAgents(agents, 'triage');
      expect(result.errors).toContain(
        'Agent "triage" hands off to unknown "x"',
      );
      expect(result.errors).toContain(
        'Agent "triage" hands off to unknown "y"',
      );
      expect(result.errors).toContain(
        'Agent "triage" hands off to unknown "z"',
      );
    });
  });

  describe('agentFromConfig — optional fields', () => {
    it('parses valid toolChoice values', () => {
      expect(agentFromConfig({ toolChoice: 'auto' }).toolChoice).toBe('auto');
      expect(agentFromConfig({ toolChoice: 'required' }).toolChoice).toBe(
        'required',
      );
      expect(agentFromConfig({ toolChoice: 'none' }).toolChoice).toBe('none');
    });

    it('omits toolChoice when invalid', () => {
      expect(
        agentFromConfig({ toolChoice: 'invalid' }).toolChoice,
      ).toBeUndefined();
      expect(agentFromConfig({ toolChoice: 42 }).toolChoice).toBeUndefined();
    });

    it('parses temperature, maxOutputTokens, maxToolCalls', () => {
      const r = agentFromConfig({
        temperature: 0.7,
        maxOutputTokens: 2048,
        maxToolCalls: 10,
      });
      expect(r.temperature).toBe(0.7);
      expect(r.maxOutputTokens).toBe(2048);
      expect(r.maxToolCalls).toBe(10);
    });

    it('omits NaN numeric fields', () => {
      expect(agentFromConfig({ temperature: NaN }).temperature).toBeUndefined();
      expect(
        agentFromConfig({ maxOutputTokens: NaN }).maxOutputTokens,
      ).toBeUndefined();
      expect(
        agentFromConfig({ maxToolCalls: NaN }).maxToolCalls,
      ).toBeUndefined();
    });

    it('parses guardrails array and filters non-strings', () => {
      const r = agentFromConfig({ guardrails: ['g1', 1, 'g2'] });
      expect(r.guardrails).toEqual(['g1', 'g2']);
    });

    it('parses valid reasoning effort', () => {
      expect(
        agentFromConfig({ reasoning: { effort: 'high' } }).reasoning,
      ).toEqual({ effort: 'high' });
      expect(
        agentFromConfig({ reasoning: { effort: 'low' } }).reasoning,
      ).toEqual({ effort: 'low' });
      expect(
        agentFromConfig({ reasoning: { effort: 'medium' } }).reasoning,
      ).toEqual({ effort: 'medium' });
    });

    it('omits reasoning when effort is invalid', () => {
      expect(
        agentFromConfig({ reasoning: { effort: 'invalid' } }).reasoning,
      ).toBeUndefined();
      expect(
        agentFromConfig({ reasoning: 'not-object' }).reasoning,
      ).toBeUndefined();
    });

    it('parses resetToolChoice and nestHandoffHistory', () => {
      const r = agentFromConfig({
        resetToolChoice: true,
        nestHandoffHistory: false,
      });
      expect(r.resetToolChoice).toBe(true);
      expect(r.nestHandoffHistory).toBe(false);
    });

    it('omits resetToolChoice and nestHandoffHistory when not boolean', () => {
      const r = agentFromConfig({
        resetToolChoice: 'yes',
        nestHandoffHistory: 1,
      });
      expect(r.resetToolChoice).toBeUndefined();
      expect(r.nestHandoffHistory).toBeUndefined();
    });
  });

  describe('buildAgentContext', () => {
    const emptyMcp: Array<{ id: string; name: string }> = [];

    it('includes model or global default when empty', () => {
      const a = createDefaultAgent();
      const ctx = buildAgentContext(a, {}, emptyMcp);
      expect(ctx).toContain('Model: global default');
    });

    it('includes model name when set', () => {
      const a = agentFromConfig({ model: 'gpt-4' });
      const ctx = buildAgentContext(a, {}, emptyMcp);
      expect(ctx).toContain('Model: gpt-4');
    });

    it('includes built-in tools when enabled', () => {
      const a = agentFromConfig({
        enableRAG: true,
        enableWebSearch: true,
        enableCodeInterpreter: true,
      });
      const ctx = buildAgentContext(a, {}, emptyMcp);
      expect(ctx).toContain('Knowledge Base (RAG)');
      expect(ctx).toContain('Web Search');
      expect(ctx).toContain('Code Interpreter');
    });

    it('shows "none" when no built-in tools enabled', () => {
      const a = createDefaultAgent();
      const ctx = buildAgentContext(a, {}, emptyMcp);
      expect(ctx).toContain('Built-in tools: none');
    });

    it('includes MCP server names', () => {
      const a = agentFromConfig({ mcpServers: ['mcp1'] });
      const mcps = [{ id: 'mcp1', name: 'My MCP Server' }];
      const ctx = buildAgentContext(a, {}, mcps);
      expect(ctx).toContain('My MCP Server');
    });

    it('falls back to MCP server ID when name not found', () => {
      const a = agentFromConfig({ mcpServers: ['unknown-id'] });
      const ctx = buildAgentContext(a, {}, emptyMcp);
      expect(ctx).toContain('unknown-id');
    });

    it('includes handoff targets with descriptions', () => {
      const allAgents: Record<string, AgentFormData> = {
        a: agentFromConfig({
          name: 'AgentA',
          handoffDescription: 'Handles billing',
        }),
        b: agentFromConfig({ name: 'AgentB' }),
      };
      const agent = agentFromConfig({ handoffs: ['a', 'b'] });
      const ctx = buildAgentContext(agent, allAgents, emptyMcp);
      expect(ctx).toContain('AgentA (Handles billing)');
      expect(ctx).toContain('AgentB');
    });

    it('includes delegates with descriptions', () => {
      const allAgents: Record<string, AgentFormData> = {
        worker: agentFromConfig({
          name: 'Worker',
          handoffDescription: 'Does work',
        }),
      };
      const agent = agentFromConfig({ asTools: ['worker'] });
      const ctx = buildAgentContext(agent, allAgents, emptyMcp);
      expect(ctx).toContain('Can delegate to:');
      expect(ctx).toContain('Worker (Does work)');
    });

    it('includes toolChoice and temperature when set', () => {
      const a = agentFromConfig({ toolChoice: 'required', temperature: 0.5 });
      const ctx = buildAgentContext(a, {}, emptyMcp);
      expect(ctx).toContain('Tool choice: required');
      expect(ctx).toContain('Temperature: 0.5');
    });
  });
});
