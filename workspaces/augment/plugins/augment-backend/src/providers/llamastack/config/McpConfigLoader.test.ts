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

import { ConfigReader, type JsonObject } from '@backstage/config';
import { loadMcpServerConfigs } from './McpConfigLoader';
import { createMockLogger } from '../../../test-utils';

function loadServers(yamlConfig: JsonObject) {
  const config = new ConfigReader(yamlConfig);
  const logger = createMockLogger();
  return { servers: loadMcpServerConfigs(config, logger), logger };
}

describe('loadMcpServerConfigs', () => {
  it('returns empty array when no MCP servers configured', () => {
    const { servers } = loadServers({});
    expect(servers).toEqual([]);
  });

  it('loads a streamable-http server with required fields', () => {
    const { servers } = loadServers({
      augment: {
        mcpServers: [
          {
            id: 'ocp-mcp',
            name: 'OCP MCP',
            type: 'streamable-http',
            url: 'https://mcp.example.com/mcp',
          },
        ],
      },
    });

    expect(servers).toHaveLength(1);
    expect(servers[0].id).toBe('ocp-mcp');
    expect(servers[0].type).toBe('streamable-http');
    expect(servers[0].url).toBe('https://mcp.example.com/mcp');
  });

  describe('requireApproval', () => {
    it('parses string requireApproval "always"', () => {
      const { servers } = loadServers({
        augment: {
          mcpServers: [
            {
              id: 'srv',
              name: 'Test',
              type: 'sse',
              url: 'https://mcp.test/sse',
              requireApproval: 'always',
            },
          ],
        },
      });

      expect(servers[0].requireApproval).toBe('always');
    });

    it('omits requireApproval when not set', () => {
      const { servers } = loadServers({
        augment: {
          mcpServers: [
            {
              id: 'srv',
              name: 'Test',
              type: 'sse',
              url: 'https://mcp.test/sse',
            },
          ],
        },
      });

      expect(servers[0].requireApproval).toBeUndefined();
    });
  });

  it('skips servers with unsupported type', () => {
    const { servers, logger } = loadServers({
      augment: {
        mcpServers: [
          {
            id: 'srv',
            name: 'Test',
            type: 'stdio',
            url: 'cmd://test',
          },
        ],
      },
    });

    expect(servers).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('unsupported type'),
    );
  });
});
