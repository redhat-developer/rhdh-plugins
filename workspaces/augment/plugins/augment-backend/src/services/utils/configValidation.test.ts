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
import { InputError } from '@backstage/errors';
import { validateAdminConfigValue } from './configValidation';

describe('validateAdminConfigValue', () => {
  describe('baseUrl', () => {
    it('accepts valid HTTP URLs', () => {
      expect(() =>
        validateAdminConfigValue('baseUrl', 'http://llama.example.com:8321'),
      ).not.toThrow();
      expect(() =>
        validateAdminConfigValue('baseUrl', 'https://llama.example.com'),
      ).not.toThrow();
      expect(() =>
        validateAdminConfigValue('baseUrl', 'https://server:443/v1'),
      ).not.toThrow();
    });

    it.each([
      ['empty string', ''],
      ['non-string (number)', 123],
      ['non-string (null)', null],
      ['non-HTTP protocols', 'sftp://server.com'],
      ['malformed URLs', 'not-a-url'],
    ])('rejects %s', (_, value) => {
      expect(() => validateAdminConfigValue('baseUrl', value)).toThrow(
        InputError,
      );
    });

    it('rejects private/internal addresses (SSRF)', () => {
      expect(() =>
        validateAdminConfigValue('baseUrl', 'https://localhost:8321'),
      ).toThrow(/private\/internal/);
      expect(() =>
        validateAdminConfigValue('baseUrl', 'https://10.0.0.1:8321'),
      ).toThrow(/private\/internal/);
    });
  });

  describe('model', () => {
    it('accepts valid model names', () => {
      expect(() =>
        validateAdminConfigValue('model', 'meta-llama/Llama-3-8B'),
      ).not.toThrow();
      expect(() => validateAdminConfigValue('model', 'gpt-4o')).not.toThrow();
    });

    it.each([
      ['empty string', ''],
      ['strings over 200 chars', 'x'.repeat(201)],
      ['non-string values', 42],
    ])('rejects %s', (_, value) => {
      expect(() => validateAdminConfigValue('model', value)).toThrow(
        InputError,
      );
    });
  });

  describe('systemPrompt', () => {
    it('accepts valid prompts', () => {
      expect(() =>
        validateAdminConfigValue('systemPrompt', 'You are a helpful AI.'),
      ).not.toThrow();
      expect(() => validateAdminConfigValue('systemPrompt', '')).not.toThrow();
    });

    it('rejects non-string values', () => {
      expect(() => validateAdminConfigValue('systemPrompt', 123)).toThrow(
        InputError,
      );
    });

    it('rejects prompts over 50000 chars', () => {
      expect(() =>
        validateAdminConfigValue('systemPrompt', 'x'.repeat(50001)),
      ).toThrow(InputError);
    });
  });

  describe('toolChoice', () => {
    it('accepts valid string values', () => {
      expect(() =>
        validateAdminConfigValue('toolChoice', 'auto'),
      ).not.toThrow();
      expect(() =>
        validateAdminConfigValue('toolChoice', 'required'),
      ).not.toThrow();
      expect(() =>
        validateAdminConfigValue('toolChoice', 'none'),
      ).not.toThrow();
    });

    it('accepts valid function object', () => {
      expect(() =>
        validateAdminConfigValue('toolChoice', {
          type: 'function',
          name: 'get_weather',
        }),
      ).not.toThrow();
    });

    it('accepts valid allowed_tools object', () => {
      expect(() =>
        validateAdminConfigValue('toolChoice', {
          type: 'allowed_tools',
          tools: [{ type: 'web_search' }],
        }),
      ).not.toThrow();
    });

    it('rejects invalid string values', () => {
      expect(() => validateAdminConfigValue('toolChoice', 'invalid')).toThrow(
        InputError,
      );
    });

    it('rejects non-string non-object values', () => {
      expect(() => validateAdminConfigValue('toolChoice', 123)).toThrow(
        InputError,
      );
    });
  });

  describe('enableWebSearch', () => {
    it('accepts boolean values', () => {
      expect(() =>
        validateAdminConfigValue('enableWebSearch', true),
      ).not.toThrow();
      expect(() =>
        validateAdminConfigValue('enableWebSearch', false),
      ).not.toThrow();
    });

    it('rejects non-boolean values', () => {
      expect(() => validateAdminConfigValue('enableWebSearch', 'true')).toThrow(
        InputError,
      );
      expect(() => validateAdminConfigValue('enableWebSearch', 1)).toThrow(
        InputError,
      );
    });
  });

  describe('enableCodeInterpreter', () => {
    it('accepts boolean values', () => {
      expect(() =>
        validateAdminConfigValue('enableCodeInterpreter', true),
      ).not.toThrow();
    });

    it('rejects non-boolean values', () => {
      expect(() =>
        validateAdminConfigValue('enableCodeInterpreter', 'yes'),
      ).toThrow(InputError);
    });
  });

  describe('branding', () => {
    it('accepts valid objects', () => {
      expect(() =>
        validateAdminConfigValue('branding', { appName: 'Test' }),
      ).not.toThrow();
    });

    it('accepts a fully-populated valid branding object', () => {
      expect(() =>
        validateAdminConfigValue('branding', {
          appName: 'My App',
          tagline: 'Hello',
          primaryColor: '#1e40af',
          secondaryColor: '#475569',
          successColor: '#10b981',
          warningColor: '#f59e0b',
          errorColor: '#ef4444',
          infoColor: '#0ea5e9',
          logoUrl: 'https://example.com/logo.png',
          faviconUrl: 'https://example.com/favicon.ico',
          themePreset: 'default',
        }),
      ).not.toThrow();
    });

    it.each([
      ['null', null],
      ['arrays', []],
      ['non-object values', 'string'],
    ])('rejects %s', (_, value) => {
      expect(() => validateAdminConfigValue('branding', value)).toThrow(
        InputError,
      );
    });

    it('rejects invalid hex color', () => {
      expect(() =>
        validateAdminConfigValue('branding', { primaryColor: 'red' }),
      ).toThrow(/valid hex color/);
    });

    it('rejects 3-digit hex color', () => {
      expect(() =>
        validateAdminConfigValue('branding', { primaryColor: '#abc' }),
      ).toThrow(/valid hex color/);
    });

    it('rejects non-string color', () => {
      expect(() =>
        validateAdminConfigValue('branding', { primaryColor: 123 }),
      ).toThrow(/valid hex color/);
    });

    it('rejects unknown keys', () => {
      expect(() =>
        validateAdminConfigValue('branding', { bogusField: true }),
      ).toThrow(/unknown key.*bogusField/);
    });

    describe('logoUrl / faviconUrl validation', () => {
      it('accepts valid https URLs', () => {
        expect(() =>
          validateAdminConfigValue('branding', {
            logoUrl: 'https://example.com/logo.png',
          }),
        ).not.toThrow();
      });

      it('accepts valid http URLs', () => {
        expect(() =>
          validateAdminConfigValue('branding', {
            faviconUrl: 'http://localhost:3000/favicon.ico',
          }),
        ).not.toThrow();
      });

      it('rejects javascript: URLs', () => {
        expect(() =>
          validateAdminConfigValue('branding', {
            // eslint-disable-next-line no-script-url
            logoUrl: 'javascript:alert(1)',
          }),
        ).toThrow(/protocol/);
      });

      it('rejects data: URLs', () => {
        expect(() =>
          validateAdminConfigValue('branding', {
            faviconUrl: 'data:text/html,<h1>xss</h1>',
          }),
        ).toThrow(/protocol/);
      });

      it('rejects invalid URLs', () => {
        expect(() =>
          validateAdminConfigValue('branding', { logoUrl: 'not-a-url' }),
        ).toThrow(/valid URL/);
      });

      it('accepts empty string (clears the value)', () => {
        expect(() =>
          validateAdminConfigValue('branding', { logoUrl: '' }),
        ).not.toThrow();
      });
    });
  });

  describe('safetyPatterns', () => {
    it('accepts valid string arrays', () => {
      expect(() =>
        validateAdminConfigValue('safetyPatterns', ['delete', 'drop']),
      ).not.toThrow();
      expect(() =>
        validateAdminConfigValue('safetyPatterns', []),
      ).not.toThrow();
    });

    it('rejects non-array values', () => {
      expect(() =>
        validateAdminConfigValue('safetyPatterns', 'delete'),
      ).toThrow(InputError);
    });

    it('rejects arrays with non-string elements', () => {
      expect(() =>
        validateAdminConfigValue('safetyPatterns', ['valid', 123]),
      ).toThrow(InputError);
    });
  });

  describe('vectorStoreConfig', () => {
    it('accepts a valid config object', () => {
      expect(() =>
        validateAdminConfigValue('vectorStoreConfig', {
          embeddingModel: 'all-MiniLM-L6-v2',
          embeddingDimension: 384,
          searchMode: 'hybrid',
          bm25Weight: 0.3,
          chunkingStrategy: 'auto',
        }),
      ).not.toThrow();
    });

    it('accepts an empty object', () => {
      expect(() =>
        validateAdminConfigValue('vectorStoreConfig', {}),
      ).not.toThrow();
    });

    it.each([
      ['null', null],
      ['arrays', []],
      ['invalid searchMode', { searchMode: 'invalid' }],
      ['invalid chunkingStrategy', { chunkingStrategy: 'invalid' }],
      ['non-number embeddingDimension', { embeddingDimension: '384' }],
    ])('rejects %s', (_, value) => {
      expect(() =>
        validateAdminConfigValue('vectorStoreConfig', value),
      ).toThrow(InputError);
    });
  });

  describe('activeVectorStoreIds', () => {
    it('accepts a valid string array', () => {
      expect(() =>
        validateAdminConfigValue('activeVectorStoreIds', ['vs-1', 'vs-2']),
      ).not.toThrow();
    });

    it('accepts an empty array', () => {
      expect(() =>
        validateAdminConfigValue('activeVectorStoreIds', []),
      ).not.toThrow();
    });

    it('rejects non-array', () => {
      expect(() =>
        validateAdminConfigValue('activeVectorStoreIds', 'vs-1'),
      ).toThrow(InputError);
    });

    it('rejects empty strings in array', () => {
      expect(() =>
        validateAdminConfigValue('activeVectorStoreIds', ['vs-1', '']),
      ).toThrow(InputError);
    });

    it('rejects non-string elements', () => {
      expect(() =>
        validateAdminConfigValue('activeVectorStoreIds', ['vs-1', 42]),
      ).toThrow(InputError);
    });
  });

  describe('mcpServers', () => {
    it('accepts a valid MCP server array', () => {
      expect(() =>
        validateAdminConfigValue('mcpServers', [
          {
            id: 'mcp-1',
            name: 'Test MCP',
            url: 'https://mcp.example.com/sse',
            type: 'sse',
          },
        ]),
      ).not.toThrow();
    });

    it('accepts MCP server with requireApproval "always"', () => {
      expect(() =>
        validateAdminConfigValue('mcpServers', [
          {
            id: 'mcp-1',
            name: 'Test MCP',
            url: 'https://mcp.example.com/sse',
            requireApproval: 'always',
          },
        ]),
      ).not.toThrow();
    });

    it('accepts MCP server with requireApproval "never"', () => {
      expect(() =>
        validateAdminConfigValue('mcpServers', [
          {
            id: 'mcp-1',
            name: 'Test MCP',
            url: 'https://mcp.example.com/sse',
            requireApproval: 'never',
          },
        ]),
      ).not.toThrow();
    });

    it('accepts MCP server without requireApproval (defaults to never)', () => {
      expect(() =>
        validateAdminConfigValue('mcpServers', [
          {
            id: 'mcp-1',
            name: 'Test MCP',
            url: 'https://mcp.example.com/sse',
          },
        ]),
      ).not.toThrow();
    });

    it('accepts an empty array', () => {
      expect(() => validateAdminConfigValue('mcpServers', [])).not.toThrow();
    });

    it.each([
      ['non-array values', 'not-array'],
      ['servers missing id', [{ name: 'Test', url: 'https://mcp.test' }]],
      ['servers missing name', [{ id: 'mcp-1', url: 'https://mcp.test' }]],
      [
        'servers with invalid URL',
        [{ id: 'mcp-1', name: 'Test', url: 'not-a-url' }],
      ],
      [
        'servers with non-http URL',
        [{ id: 'mcp-1', name: 'Test', url: 'ftp://mcp.test' }],
      ],
      [
        'duplicate server IDs',
        [
          { id: 'mcp-1', name: 'A', url: 'https://a.test' },
          { id: 'mcp-1', name: 'B', url: 'https://b.test' },
        ],
      ],
      [
        'servers with invalid requireApproval',
        [
          {
            id: 'mcp-1',
            name: 'Test',
            url: 'https://mcp.test',
            requireApproval: 'sometimes',
          },
        ],
      ],
    ])('rejects %s', (_, value) => {
      expect(() => validateAdminConfigValue('mcpServers', value)).toThrow(
        InputError,
      );
    });

    it('accepts servers with overlapping allowedTools (proxy handles namespacing)', () => {
      expect(() =>
        validateAdminConfigValue('mcpServers', [
          {
            id: 'aap-mcp',
            name: 'AAP',
            url: 'https://aap.test',
            allowedTools: ['projects_list', 'job_templates_list'],
          },
          {
            id: 'ocp-mcp',
            name: 'OCP',
            url: 'https://ocp.test',
            allowedTools: ['projects_list', 'pods_list'],
          },
        ]),
      ).not.toThrow();
    });
  });

  describe('safetyEnabled', () => {
    it('accepts a boolean', () => {
      expect(() =>
        validateAdminConfigValue('safetyEnabled', true),
      ).not.toThrow();
      expect(() =>
        validateAdminConfigValue('safetyEnabled', false),
      ).not.toThrow();
    });

    it('rejects non-boolean', () => {
      expect(() => validateAdminConfigValue('safetyEnabled', 'yes')).toThrow(
        InputError,
      );
    });
  });

  describe('inputShields', () => {
    it('accepts an array of non-empty strings', () => {
      expect(() =>
        validateAdminConfigValue('inputShields', ['content_safety']),
      ).not.toThrow();
    });

    it('rejects non-array', () => {
      expect(() => validateAdminConfigValue('inputShields', 'shield')).toThrow(
        InputError,
      );
    });

    it('rejects empty strings in array', () => {
      expect(() => validateAdminConfigValue('inputShields', [''])).toThrow(
        InputError,
      );
    });
  });

  describe('outputShields', () => {
    it('accepts an array of non-empty strings', () => {
      expect(() =>
        validateAdminConfigValue('outputShields', ['content_safety']),
      ).not.toThrow();
    });

    it('rejects non-array', () => {
      expect(() => validateAdminConfigValue('outputShields', 42)).toThrow(
        InputError,
      );
    });
  });

  describe('evaluationEnabled', () => {
    it('accepts a boolean', () => {
      expect(() =>
        validateAdminConfigValue('evaluationEnabled', true),
      ).not.toThrow();
    });

    it('rejects non-boolean', () => {
      expect(() => validateAdminConfigValue('evaluationEnabled', 1)).toThrow(
        InputError,
      );
    });
  });

  describe('scoringFunctions', () => {
    it('accepts an array of non-empty strings', () => {
      expect(() =>
        validateAdminConfigValue('scoringFunctions', [
          'basic::subset_of',
          'braintrust::faithfulness',
        ]),
      ).not.toThrow();
    });

    it('rejects non-array', () => {
      expect(() => validateAdminConfigValue('scoringFunctions', 'fn')).toThrow(
        InputError,
      );
    });
  });

  describe('minScoreThreshold', () => {
    it('accepts a number between 0 and 1', () => {
      expect(() =>
        validateAdminConfigValue('minScoreThreshold', 0.7),
      ).not.toThrow();
      expect(() =>
        validateAdminConfigValue('minScoreThreshold', 0),
      ).not.toThrow();
      expect(() =>
        validateAdminConfigValue('minScoreThreshold', 1),
      ).not.toThrow();
    });

    it('rejects non-number', () => {
      expect(() =>
        validateAdminConfigValue('minScoreThreshold', '0.7'),
      ).toThrow(InputError);
    });

    it('rejects out-of-range values', () => {
      expect(() => validateAdminConfigValue('minScoreThreshold', -0.1)).toThrow(
        InputError,
      );
      expect(() => validateAdminConfigValue('minScoreThreshold', 1.1)).toThrow(
        InputError,
      );
    });
  });

  describe('promptGroups', () => {
    it('accepts a valid prompt groups array', () => {
      expect(() =>
        validateAdminConfigValue('promptGroups', [
          {
            id: 'lane-1',
            title: 'Getting Started',
            cards: [{ title: 'Card 1', prompt: 'Hello' }],
          },
        ]),
      ).not.toThrow();
    });

    it('accepts an empty array', () => {
      expect(() => validateAdminConfigValue('promptGroups', [])).not.toThrow();
    });

    it.each([
      ['non-array', 'not array'],
      ['groups without id', [{ title: 'Lane', cards: [] }]],
      ['groups without title', [{ id: 'l1', cards: [] }]],
      ['groups without cards array', [{ id: 'l1', title: 'Lane' }]],
      [
        'cards without title',
        [{ id: 'l1', title: 'Lane', cards: [{ prompt: 'Go' }] }],
      ],
      [
        'cards without prompt',
        [{ id: 'l1', title: 'Lane', cards: [{ title: 'Card' }] }],
      ],
    ])('rejects %s', (_, value) => {
      expect(() => validateAdminConfigValue('promptGroups', value)).toThrow(
        InputError,
      );
    });
  });

  describe('agents', () => {
    it('accepts a valid agents object', () => {
      expect(() =>
        validateAdminConfigValue('agents', {
          triage: {
            name: 'Triage',
            instructions: 'Route users.',
            handoffs: ['billing'],
          },
          billing: {
            name: 'Billing',
            instructions: 'Handle billing.',
            mcpServers: ['ocp-mcp'],
            enableRAG: true,
          },
        }),
      ).not.toThrow();
    });

    it('accepts an empty agents object', () => {
      expect(() => validateAdminConfigValue('agents', {})).not.toThrow();
    });

    it('rejects non-object value', () => {
      expect(() => validateAdminConfigValue('agents', 'not-object')).toThrow(
        InputError,
      );
    });

    it('rejects array value', () => {
      expect(() => validateAdminConfigValue('agents', [])).toThrow(InputError);
    });

    it('rejects agent without name', () => {
      expect(() =>
        validateAdminConfigValue('agents', {
          a: { instructions: 'Do things.' },
        }),
      ).toThrow(InputError);
    });

    it('rejects agent with empty name', () => {
      expect(() =>
        validateAdminConfigValue('agents', {
          a: { name: '  ', instructions: 'Do things.' },
        }),
      ).toThrow(InputError);
    });

    it('rejects agent without instructions', () => {
      expect(() =>
        validateAdminConfigValue('agents', {
          a: { name: 'Agent A' },
        }),
      ).toThrow(InputError);
    });

    it('rejects non-array handoffs', () => {
      expect(() =>
        validateAdminConfigValue('agents', {
          a: { name: 'A', instructions: 'Do.', handoffs: 'not-array' },
        }),
      ).toThrow(InputError);
    });

    it('rejects non-string elements in handoffs', () => {
      expect(() =>
        validateAdminConfigValue('agents', {
          a: { name: 'A', instructions: 'Do.', handoffs: [123] },
        }),
      ).toThrow(InputError);
    });

    it('rejects non-boolean enableRAG', () => {
      expect(() =>
        validateAdminConfigValue('agents', {
          a: { name: 'A', instructions: 'Do.', enableRAG: 'yes' },
        }),
      ).toThrow(InputError);
    });

    it('rejects handoff to nonexistent agent', () => {
      expect(() =>
        validateAdminConfigValue('agents', {
          router: {
            name: 'Router',
            instructions: 'Route.',
            handoffs: ['missing-agent'],
          },
        }),
      ).toThrow(/handoff to "missing-agent" which does not exist/);
    });

    it('rejects asTools reference to nonexistent agent', () => {
      expect(() =>
        validateAdminConfigValue('agents', {
          manager: {
            name: 'Manager',
            instructions: 'Manage.',
            asTools: ['nonexistent'],
          },
        }),
      ).toThrow(/asTools reference to "nonexistent" which does not exist/);
    });

    it('accepts valid handoff and asTools references', () => {
      expect(() =>
        validateAdminConfigValue('agents', {
          router: {
            name: 'Router',
            instructions: 'Route.',
            handoffs: ['specialist'],
          },
          specialist: {
            name: 'Specialist',
            instructions: 'Help.',
          },
          manager: {
            name: 'Manager',
            instructions: 'Orchestrate.',
            asTools: ['specialist'],
          },
        }),
      ).not.toThrow();
    });
  });
});
