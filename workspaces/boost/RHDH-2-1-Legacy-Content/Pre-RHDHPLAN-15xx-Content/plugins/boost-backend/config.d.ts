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
 * Configuration schema for the boost backend plugin.
 *
 * Mirrors the field definitions in `src/config/schemas.ts`.
 * Keep both in sync when adding or changing config fields.
 */
export interface Config {
  boost?: {
    /** Model connection configuration. */
    model?: {
      /**
       * Base URL for the AI model endpoint.
       * @visibility frontend
       * @configScope db-overridable
       */
      baseUrl?: string;
      /**
       * Name of the AI model to use.
       * @visibility frontend
       * @configScope db-overridable
       */
      name?: string;
    };

    /**
     * System prompt for AI conversations.
     * @configScope db-overridable
     */
    systemPrompt?: string;

    /** Security configuration. */
    security?: {
      /**
       * Security mode for the boost plugin.
       * @configScope yaml-only
       */
      mode?: 'development-only-no-auth' | 'plugin-only' | 'full';
    };

    /** Feature flags. */
    features?: {
      /**
       * Enable agent creation feature.
       * @visibility frontend
       * @configScope db-overridable
       */
      agentCreation?: boolean;
      /**
       * Enable skills marketplace feature.
       * @visibility frontend
       * @configScope db-overridable
       */
      skillsMarketplace?: boolean;
    };

    /** Agent approval configuration. */
    agentApproval?: {
      /**
       * Agent approval mode: built-in or SonataFlow-managed.
       * @configScope db-overridable
       */
      mode?: 'built-in' | 'sonataflow';
      /** SonataFlow integration. */
      sonataflow?: {
        /**
         * SonataFlow workflow endpoint for agent approval.
         * @configScope yaml-only
         */
        endpoint?: string;
      };
    };

    /** Skills marketplace configuration. */
    skillsMarketplace?: {
      /**
       * Skills catalog backend URL.
       * @configScope yaml-only
       */
      endpoint?: string;
    };

    /** Kagenti provider configuration. */
    kagenti?: {
      /** Authentication configuration. */
      auth?: {
        /**
         * Keycloak token endpoint URL for OAuth2 Client Credentials Grant.
         * @configScope yaml-only
         */
        tokenEndpoint?: string;
        /**
         * OAuth2 client ID for service-account authentication.
         * @configScope yaml-only
         */
        clientId?: string;
        /**
         * OAuth2 client secret for service-account authentication.
         * @visibility secret
         * @configScope yaml-only
         */
        clientSecret?: string;
        /**
         * Seconds before token expiry to proactively refresh.
         * @configScope yaml-only
         */
        tokenExpiryBufferSeconds?: number;
      };
    };

    /** AI provider connection settings. */
    providers?: {
      /** Kagenti A2A provider connection. */
      kagenti?: {
        /**
         * Base URL for the Kagenti A2A endpoint.
         * @configScope yaml-only
         */
        baseUrl?: string;
        /**
         * Default agent ID for task routing.
         * @configScope yaml-only
         */
        defaultAgent?: string;
      };
    };

    /** DevSpaces integration. */
    devSpaces?: {
      /**
       * DevSpaces integration credentials.
       * @visibility secret
       * @configScope db-overridable
       */
      credentials?: string;
    };

    /**
     * Secret used for encrypting sensitive config values stored in the database.
     * Must be a high-entropy string (e.g., 32+ random characters).
     * @visibility secret
     */
    encryptionSecret?: string;

    /** Ingestion health and sync-attempt retention. */
    ingestion?: {
      healthRetention?: {
        /**
         * Maximum sync attempts retained per connector (default: 100).
         * @configScope yaml-only
         */
        maxAttemptsPerConnector?: number;
      };
    };

    /**
     * Runtime connector sync settings (db-overridable).
     * Distinct from `ai-catalog.providers.<id>.enabled` (startup registration).
     */
    connectors?: {
      /** Jira connector runtime configuration. */
      jira?: {
        /**
         * Whether Jira runtime syncing is enabled (default: true).
         * @configScope db-overridable
         */
        enabled?: boolean;
        /**
         * HTTPS endpoint URL for the Jira instance.
         * @configScope db-overridable
         */
        endpoint?: string;
        /** Jira sync schedule configuration. */
        schedule?: {
          /**
           * Sync interval in milliseconds (default: 300000).
           * @configScope db-overridable
           */
          intervalMs?: number;
          /**
           * Standard 5-field cron expression for sync schedule.
           * @configScope db-overridable
           */
          cron?: string;
        };
        /**
         * Number of items per sync batch (default: 100).
         * @configScope db-overridable
         */
        batchSize?: number;
        /** Jira timeout configuration. */
        timeout?: {
          /**
           * Connection timeout in milliseconds (default: 30000).
           * @configScope db-overridable
           */
          connectionMs?: number;
        };
        /**
         * Per-connector schema version (internal metadata).
         * @configScope db-only
         */
        __schemaVersion?: number;
      };
      /** GitHub connector runtime configuration. */
      github?: {
        /**
         * Whether GitHub runtime syncing is enabled (default: true).
         * @configScope db-overridable
         */
        enabled?: boolean;
        /**
         * HTTPS endpoint URL for the GitHub API.
         * @configScope db-overridable
         */
        endpoint?: string;
        /** GitHub sync schedule configuration. */
        schedule?: {
          /**
           * Sync interval in milliseconds (default: 300000).
           * @configScope db-overridable
           */
          intervalMs?: number;
        };
        /**
         * Number of items per sync batch (default: 100).
         * @configScope db-overridable
         */
        batchSize?: number;
        /**
         * Per-connector schema version (internal metadata).
         * @configScope db-only
         */
        __schemaVersion?: number;
      };
      /** GitLab connector runtime configuration. */
      gitlab?: {
        /**
         * Whether GitLab runtime syncing is enabled (default: true).
         * @configScope db-overridable
         */
        enabled?: boolean;
        /**
         * HTTPS endpoint URL for the GitLab API.
         * @configScope db-overridable
         */
        endpoint?: string;
        /** GitLab sync schedule configuration. */
        schedule?: {
          /**
           * Sync interval in milliseconds (default: 300000).
           * @configScope db-overridable
           */
          intervalMs?: number;
        };
        /**
         * Number of items per sync batch (default: 100).
         * @configScope db-overridable
         */
        batchSize?: number;
        /**
         * Per-connector schema version (internal metadata).
         * @configScope db-only
         */
        __schemaVersion?: number;
      };
      /**
       * Open index signature preserving backward compatibility.
       * Allows arbitrary connector IDs beyond the three typed entries.
       */
      [connectorId: string]:
        | {
            /**
             * Whether runtime syncing is enabled (default: true).
             * @configScope db-overridable
             */
            enabled?: boolean;
          }
        | undefined;
    };
  };
}
