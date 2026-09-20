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

import type { McpServerDocument } from '@red-hat-developer-hub/backstage-plugin-catalog-mcp-registry-server-mapping';

/**
 * Create a minimal valid MCP server.json document for testing.
 */
export function createMockServerDoc(
  name: string,
  version: string,
  overrides?: Partial<McpServerDocument>,
): McpServerDocument {
  return {
    $schema:
      'https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json',
    name,
    description: `Test server ${name}`,
    version,
    remotes: [
      {
        type: 'streamable-http',
        url: `https://${name.replace('/', '.')}.example.com/mcp`,
      },
    ],
    ...overrides,
  };
}
