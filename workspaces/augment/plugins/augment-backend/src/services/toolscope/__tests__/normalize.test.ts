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
  OpenAIToolNormalizer,
  McpToolNormalizer,
  AutoToolNormalizer,
} from '../normalize';

describe('OpenAIToolNormalizer', () => {
  const norm = new OpenAIToolNormalizer();

  it('normalizes an OpenAI function tool dict', () => {
    const tool = {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get weather for a city',
        parameters: {
          type: 'object',
          properties: { city: { type: 'string' } },
        },
      },
    };

    const [ct] = norm.normalize([tool]);
    expect(ct.name).toBe('get_weather');
    expect(ct.description).toBe('Get weather for a city');
    expect(ct.inputSchema).toEqual(tool.function.parameters);
    expect(ct.fingerprint.value).toMatch(/^[a-f0-9]{64}$/);
    expect(ct.payload).toBe(tool);
  });

  it('extracts tags from toolscope_tags', () => {
    const tool = {
      type: 'function',
      function: { name: 'test', description: '', parameters: {} },
      toolscope_tags: ['weather', 'api'],
    };
    const [ct] = norm.normalize([tool]);
    expect(ct.tags).toEqual(['weather', 'api']);
  });

  it('extracts tags from annotations.tags', () => {
    const tool = {
      type: 'function',
      function: { name: 'test', description: '', parameters: {} },
      annotations: { tags: ['internal'] },
    };
    const [ct] = norm.normalize([tool]);
    expect(ct.tags).toEqual(['internal']);
  });

  it('throws on non-OpenAI dict', () => {
    expect(() => norm.normalize([{ name: 'test' }])).toThrow(TypeError);
  });

  it('round-trips via denormalize', () => {
    const tool = {
      type: 'function',
      function: { name: 'test', description: '', parameters: {} },
    };
    const canonical = norm.normalize([tool]);
    const [out] = norm.denormalize(canonical);
    expect(out).toBe(tool);
  });

  it('denormalize throws when payload is missing', () => {
    expect(() =>
      norm.denormalize([
        {
          name: 'x',
          description: '',
          inputSchema: {},
          fingerprint: { value: 'a' },
          tags: [],
        },
      ]),
    ).toThrow('payload missing');
  });
});

describe('McpToolNormalizer', () => {
  const norm = new McpToolNormalizer();

  it('normalizes an MCP tool dict', () => {
    const tool = {
      name: 'list_pods',
      description: 'List pods',
      inputSchema: { type: 'object' },
    };
    const [ct] = norm.normalize([tool]);
    expect(ct.name).toBe('list_pods');
    expect(ct.description).toBe('List pods');
    expect(ct.payload).toBe(tool);
  });

  it('extracts tags from MCP dict', () => {
    const tool = {
      name: 'test',
      inputSchema: {},
      tags: ['kubernetes'],
    };
    const [ct] = norm.normalize([tool]);
    expect(ct.tags).toEqual(['kubernetes']);
  });

  it('handles MCP object-style tools', () => {
    const tool = { name: 'test', inputSchema: {}, description: 'desc' };
    const [ct] = norm.normalize([tool]);
    expect(ct.name).toBe('test');
    expect(ct.description).toBe('desc');
  });

  it('throws on unrecognized format', () => {
    expect(() => norm.normalize([42])).toThrow(TypeError);
  });
});

describe('AutoToolNormalizer', () => {
  const norm = new AutoToolNormalizer();

  it('auto-detects OpenAI format', () => {
    const tool = {
      type: 'function',
      function: { name: 'test', description: 'desc', parameters: {} },
    };
    const [ct] = norm.normalize([tool]);
    expect(ct.name).toBe('test');
  });

  it('auto-detects MCP format', () => {
    const tool = { name: 'test', description: 'desc', inputSchema: {} };
    const [ct] = norm.normalize([tool]);
    expect(ct.name).toBe('test');
  });

  it('normalizes mixed formats', () => {
    const openai = {
      type: 'function',
      function: { name: 'openai_tool', description: '', parameters: {} },
    };
    const mcp = { name: 'mcp_tool', description: '', inputSchema: {} };
    const results = norm.normalize([openai, mcp]);
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('openai_tool');
    expect(results[1].name).toBe('mcp_tool');
  });

  it('throws on unrecognized format', () => {
    expect(() => norm.normalize([{ random: 'data' }])).toThrow(TypeError);
  });

  it('round-trips mixed formats', () => {
    const openai = {
      type: 'function',
      function: { name: 'a', description: '', parameters: {} },
    };
    const mcp = { name: 'b', description: '', inputSchema: {} };
    const canonical = norm.normalize([openai, mcp]);
    const out = norm.denormalize(canonical);
    expect(out[0]).toBe(openai);
    expect(out[1]).toBe(mcp);
  });
});
