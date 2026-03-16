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
       * The name of the mcp server.
       * @visibility backend
       */
      name: string;
      /**
       * The access token for authenticating MCP server.
       * @visibility secret
       */
      token: string;
    }>;
    /**
     * Configuration for AI Notebooks (Developer Preview)
     */
    aiNotebooks?: {
      /**
       * Enable/disable AI Notebooks feature
       * When enabled, exposes AI Notebooks REST API endpoints for document-based conversations with RAG.
       * Requires Llama Stack service to be running (default: http://0.0.0.0:8321).
       * @default false
       * @visibility frontend
       */
      enabled?: boolean;
      /**
       * Llama Stack configuration
       * @visibility backend
       */
      llamaStack?: {
        /**
         * Llama Stack API URL
         * @visibility backend
         */
        url?: string;
        /**
         * Embedding model for vector database
         * @visibility backend
         */
        embeddingModel?: string;
        /**
         * Embedding dimension
         * @visibility backend
         */
        embeddingDimension?: number;
        /**
         * Vector IO configuration
         * @visibility backend
         */
        vectorIo?: {
          /**
           * Vector store provider ID
           * @visibility backend
           */
          providerId?: string;
        };
      };
      /**
       * File processing timeout in milliseconds
       * @visibility backend
       */
      fileProcessingTimeoutMs?: number;
      /**
       * Chunking strategy configuration
       * @visibility backend
       */
      chunkingStrategy?: {
        /**
         * Type of chunking strategy ('auto' or 'static')
         * @visibility backend
         */
        type?: string;
        /**
         * Maximum chunk size in tokens (for static strategy)
         * @visibility backend
         */
        maxChunkSizeTokens?: number;
        /**
         * Chunk overlap in tokens (for static strategy)
         * @visibility backend
         */
        chunkOverlapTokens?: number;
      };
    };
  };
}
