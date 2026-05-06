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
    /**
     * Configuration for AI Notebooks (Developer Preview)
     */
    notebooks?: {
      /**
       * Enable/disable AI Notebooks feature
       * When enabled, exposes AI Notebooks REST API endpoints for document-based conversations with RAG.
       * Requires Lightspeed service to be running (host and port default to 0.0.0.0 and 8080).
       * @default false
       * @visibility frontend
       */
      enabled: boolean;
      /**
       * Lightspeed configuration
       * @visibility backend
       */
      queryDefaults: {
        /**
         * Model to use for answering queries. Must map to a model available through the provider set in provider_id.
         * @visibility backend
         */
        model: string;
        /**
         * AI provider for the query model. Must map to a provider enabled in your Lightspeed config.
         * @visibility backend
         */
        provider_id: string;
      };
      /**
       * Chunking strategy for document processing
       * @visibility backend
       */
      chunkingStrategy?: {
        /**
         * Document chunking strategy - 'auto' (automatic, default) or 'static' (fixed size)
         * @visibility backend
         */
        type?: 'auto' | 'static';
        /**
         * Maximum chunk size in tokens for static chunking (default: 512)
         * @visibility backend
         */
        maxChunkSizeTokens?: number;
        /**
         * Token overlap between chunks for static chunking (default: 50)
         * @visibility backend
         */
        chunkOverlapTokens?: number;
      };
    };
  };
}
