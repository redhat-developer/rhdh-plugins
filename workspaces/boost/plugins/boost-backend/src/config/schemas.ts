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

import { z } from 'zod';

/**
 * Configuration scope for a field:
 * - `yaml-only`: only settable in `app-config.yaml`
 * - `db-overridable`: settable in YAML with admin panel override
 * - `db-only`: only settable via admin panel
 *
 * @public
 */
export type ConfigScope = 'yaml-only' | 'db-overridable' | 'db-only';

/**
 * Metadata for a single config field schema.
 *
 * @public
 */
export interface ConfigFieldMeta<T extends z.ZodTypeAny = z.ZodTypeAny> {
  /** Zod schema for validation. */
  schema: T;
  /** Where this field can be set. */
  configScope: ConfigScope;
  /** Human-readable description. */
  description: string;
  /** Whether this field contains sensitive credentials. */
  sensitive?: boolean;
}

// ---------------------------------------------------------------------------
// Current schema version — increment when fields change
// ---------------------------------------------------------------------------

/**
 * Current schema version. Stored alongside DB values to detect
 * schema evolution on startup.
 *
 * @public
 */
export const BOOST_CONFIG_SCHEMA_VERSION = 2;

// ---------------------------------------------------------------------------
// Individual field schemas with metadata
// ---------------------------------------------------------------------------

/**
 * Registry of all admin-configurable fields with their Zod schemas
 * and metadata. This is the single source of truth for config validation.
 *
 * @public
 */
export const boostConfigFields = {
  // -- Model connection --
  'boost.model.baseUrl': {
    schema: z.string().url().describe('Base URL for the AI model endpoint'),
    configScope: 'db-overridable' as ConfigScope,
    description:
      'Base URL for the AI model endpoint (e.g. https://llama.example.com/v1). ' +
      'Used by the active provider to connect to the inference server.',
  },
  'boost.model.name': {
    schema: z.string().min(1).describe('AI model identifier'),
    configScope: 'db-overridable' as ConfigScope,
    description:
      'Name or identifier of the AI model to use for inference ' +
      '(e.g. "meta-llama/Llama-3.1-8B-Instruct").',
  },

  // -- System prompt --
  'boost.systemPrompt': {
    schema: z
      .string()
      .optional()
      .describe('System prompt prepended to every conversation'),
    configScope: 'db-overridable' as ConfigScope,
    description:
      'System prompt prepended to every AI conversation. ' +
      'Overridable at runtime via the admin panel.',
  },

  // -- Security --
  'boost.security.mode': {
    schema: z
      .enum(['development-only-no-auth', 'plugin-only', 'full'])
      .describe('Security enforcement level'),
    configScope: 'yaml-only' as ConfigScope,
    description:
      'Security mode for the boost plugin. ' +
      '"full" enforces Backstage auth + permissions; ' +
      '"plugin-only" uses plugin-level auth without permission checks; ' +
      '"development-only-no-auth" disables all auth (never use in production).',
  },

  // -- Feature flags --
  'boost.features.agentCreation': {
    schema: z
      .boolean()
      .optional()
      .describe('Toggle agent creation UI and routes'),
    configScope: 'db-overridable' as ConfigScope,
    description:
      'Enable the agent creation feature, including the agent builder UI ' +
      'and creation API routes. Defaults to false when not set.',
  },
  'boost.features.skillsMarketplace': {
    schema: z
      .boolean()
      .optional()
      .describe('Toggle skills marketplace integration'),
    configScope: 'db-overridable' as ConfigScope,
    description:
      'Enable the skills marketplace feature, allowing users to browse ' +
      'and deploy skill-based agents from an external catalog.',
  },

  // -- Agent approval --
  'boost.agentApproval.mode': {
    schema: z
      .enum(['built-in', 'sonataflow'])
      .optional()
      .describe('Agent lifecycle approval mode'),
    configScope: 'db-overridable' as ConfigScope,
    description:
      'Agent approval mode: "built-in" uses the internal approval store; ' +
      '"sonataflow" delegates approval to a SonataFlow workflow endpoint.',
  },
  'boost.agentApproval.sonataflow.endpoint': {
    schema: z
      .string()
      .url()
      .optional()
      .describe('SonataFlow approval workflow URL'),
    configScope: 'yaml-only' as ConfigScope,
    description:
      'SonataFlow workflow endpoint for agent approval. ' +
      'Required when boost.agentApproval.mode is "sonataflow".',
  },

  // -- Skills marketplace --
  'boost.skillsMarketplace.endpoint': {
    schema: z
      .string()
      .url()
      .optional()
      .describe('External skills catalog backend URL'),
    configScope: 'yaml-only' as ConfigScope,
    description:
      'URL of the external skills catalog backend service. ' +
      'Boost proxies browse/filter requests to this endpoint.',
  },
  // -- Kagenti auth / OAuth2 Client Credentials --
  'boost.kagenti.auth.tokenEndpoint': {
    schema: z.string().url().optional().describe('Keycloak token endpoint URL'),
    configScope: 'yaml-only' as ConfigScope,
    description:
      'Keycloak token endpoint URL for obtaining service-account tokens ' +
      'via OAuth2 Client Credentials Grant.',
  },
  'boost.kagenti.auth.clientId': {
    schema: z
      .string()
      .optional()
      .describe('OAuth2 client ID for service-account'),
    configScope: 'yaml-only' as ConfigScope,
    description:
      'OAuth2 client ID for Keycloak service-account authentication ' +
      'to Kagenti.',
  },
  'boost.kagenti.auth.clientSecret': {
    schema: z
      .string()
      .optional()
      .describe('OAuth2 client secret for service-account'),
    configScope: 'yaml-only' as ConfigScope,
    sensitive: true,
    description:
      'OAuth2 client secret for Keycloak service-account authentication ' +
      'to Kagenti.',
  },
  'boost.kagenti.auth.tokenExpiryBufferSeconds': {
    schema: z
      .number()
      .int()
      .min(0)
      .optional()
      .default(60)
      .describe('Seconds before token expiry to trigger refresh'),
    configScope: 'yaml-only' as ConfigScope,
    description:
      'Number of seconds before token expiry to proactively refresh ' +
      'the cached Keycloak token (default: 60).',
  },

  // -- Encryption --
  'boost.encryptionSecret': {
    schema: z
      .string()
      .min(16)
      .optional()
      .describe('Secret for encrypting sensitive DB values'),
    configScope: 'yaml-only' as ConfigScope,
    description:
      'Secret used to encrypt sensitive config values stored in the ' +
      'admin config database (AES-256-GCM). Must be at least 16 characters. ' +
      'Required to read/write fields marked as sensitive.',
    sensitive: true,
  },

  // -- DevSpaces credentials (sensitive) --
  'boost.devSpaces.credentials': {
    schema: z
      .string()
      .optional()
      .describe('Encrypted DevSpaces integration credentials'),
    configScope: 'db-overridable' as ConfigScope,
    description:
      'DevSpaces integration credentials (e.g. API token). Encrypted ' +
      'at rest in the admin config database using AES-256-GCM.',
    sensitive: true,
  },
} as const satisfies Record<string, ConfigFieldMeta>;

/**
 * Union type of all known config field keys.
 *
 * @public
 */
export type BoostConfigKey = keyof typeof boostConfigFields;

/**
 * Validate a config value against its Zod schema.
 *
 * @param key - The config field key.
 * @param value - The value to validate.
 * @returns The parsed/validated value.
 * @throws ZodError if validation fails.
 *
 * @public
 */
export function validateConfigValue(
  key: BoostConfigKey,
  value: unknown,
): unknown {
  const field = boostConfigFields[key];
  return field.schema.parse(value);
}

/**
 * Returns whether a config field is writable via the admin panel (DB).
 *
 * @param key - The config field key.
 * @returns True if the field is `db-overridable` or `db-only`.
 *
 * @public
 */
export function isDbWritable(key: BoostConfigKey): boolean {
  const scope = boostConfigFields[key].configScope;
  return scope === 'db-overridable' || scope === 'db-only';
}

/**
 * Returns whether a config field contains sensitive credentials.
 *
 * @param key - The config field key.
 * @returns True if the field is marked as sensitive.
 *
 * @public
 */
export function isSensitiveField(key: BoostConfigKey): boolean {
  const field = boostConfigFields[key] as ConfigFieldMeta | undefined;
  return field?.sensitive === true;
}
