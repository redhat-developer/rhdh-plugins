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

export interface Config {
  /**
   * Configuration required for using lightspeed
   * @visibility frontend
   */
  lightspeed?: {
    /**
     * configure the port number for the lightspeed service.
     * @visibility backend
     */
    servicePort?: number;
    /**
     * customize system prompt for the lightspeed service.
     * @visibility backend
     */
    systemPrompt?: string;
    /**
     * configure the MCP server for the lightspeed service.
     * @visibility backend
     */
    mcpServers?: Array<{
      /**
       * The name of the MCP server. Must match the name registered in LCS config.
       * The URL is fetched from LCS (GET /v1/mcp-servers) at startup.
       * @visibility backend
       */
      name: string;
      /**
       * The default access token for authenticating with this MCP server.
       * Optional — if omitted, users must provide their own token via the UI.
       * Users can also override this with a personal token via PATCH /mcp-servers/:name.
       * @visibility secret
       */
      token?: string;
    }>;
  };
}
