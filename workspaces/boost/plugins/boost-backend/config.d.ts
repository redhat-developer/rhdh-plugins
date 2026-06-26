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
        /** RFC 8693 token exchange. */
        tokenExchange?: {
          /**
           * Enable RFC 8693 token exchange for Kagenti.
           * @configScope yaml-only
           */
          enabled?: boolean;
          /**
           * Target audience for exchanged token.
           * @configScope yaml-only
           */
          audience?: string;
          /**
           * Header containing user OIDC token.
           * @configScope yaml-only
           */
          userTokenHeader?: string;
        };
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
  };
}
