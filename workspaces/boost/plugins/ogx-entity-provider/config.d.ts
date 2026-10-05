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

/**
 * Configuration schema for the OGX entity provider module.
 *
 * Declares the config paths read by readOgxEntityProviderConfig so that
 * Backstage validates and enforces visibility on these keys even if
 * the module is loaded independently of the deferred Boost backend.
 */
export interface Config {
  'ai-catalog'?: {
    /** Entity-provider-specific config (standalone deployment). */
    entityProviders?: {
      /** OGX entity provider connection. */
      ogx?: {
        /**
         * Base URL of the OGX API endpoint.
         * @configScope yaml-only
         */
        baseUrl?: string;
        /**
         * API key for authenticated endpoints.
         * @visibility secret
         */
        apiKey?: string;
        /**
         * PEM-encoded CA certificate or certificate bundle used to verify the OGX endpoint.
         * @visibility backend
         */
        caData?: string;
        /**
         * Disable TLS certificate verification. Development use only.
         * @configScope yaml-only
         */
        skipTLSVerify?: boolean;
        /** Upstream refresh interval for model entities, in seconds.
         * @configScope yaml-only
         */
        modelRefreshIntervalSeconds?: number;
        /** Upstream refresh interval for agent entities, in seconds.
         * @configScope yaml-only
         */
        agentRefreshIntervalSeconds?: number;
        /** ID of the default/entry-point agent.
         * @configScope yaml-only
         */
        defaultAgent?: string;
        /** Maximum number of agent turns in a conversation.
         * @configScope yaml-only
         */
        maxAgentTurns?: number;
        /** Static agents to publish as catalog entities.
         * @configScope yaml-only
         */
        agents?: Array<{
          id: string;
          name: string;
          version?: string;
          description?: string;
          instructions?: string;
          model?: string;
          tools?: string[];
          handoffs?: string[];
          handoffDescription?: string;
          enableRAG?: boolean;
          createdBy?: string;
          lifecycleStage?: 'draft' | 'pending' | 'published' | 'archived';
        }>;
      };
    };
  };
}
