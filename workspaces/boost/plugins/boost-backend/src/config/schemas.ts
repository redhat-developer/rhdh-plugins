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
export const BOOST_CONFIG_SCHEMA_VERSION = 1;

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
    schema: z.string().url(),
    configScope: 'db-overridable' as ConfigScope,
    description: 'Base URL for the AI model endpoint',
  },
  'boost.model.name': {
    schema: z.string().min(1),
    configScope: 'db-overridable' as ConfigScope,
    description: 'Name of the AI model to use',
  },

  // -- System prompt --
  'boost.systemPrompt': {
    schema: z.string().optional(),
    configScope: 'db-overridable' as ConfigScope,
    description: 'System prompt for AI conversations',
  },

  // -- Security --
  'boost.security.mode': {
    schema: z.enum(['development-only-no-auth', 'plugin-only', 'full']),
    configScope: 'yaml-only' as ConfigScope,
    description: 'Security mode for the boost plugin',
  },

  // -- Feature flags --
  'boost.features.agentCreation': {
    schema: z.boolean().optional(),
    configScope: 'db-overridable' as ConfigScope,
    description: 'Enable agent creation feature',
  },
  'boost.features.skillsMarketplace': {
    schema: z.boolean().optional(),
    configScope: 'db-overridable' as ConfigScope,
    description: 'Enable skills marketplace feature',
  },

  // -- Agent approval --
  'boost.agentApproval.mode': {
    schema: z.enum(['built-in', 'sonataflow']).optional(),
    configScope: 'db-overridable' as ConfigScope,
    description: 'Agent approval mode: built-in or SonataFlow-managed',
  },
  'boost.agentApproval.sonataflow.endpoint': {
    schema: z.string().url().optional(),
    configScope: 'yaml-only' as ConfigScope,
    description: 'SonataFlow workflow endpoint for agent approval',
  },

  // -- Skills marketplace --
  'boost.skillsMarketplace.endpoint': {
    schema: z.string().url().optional(),
    configScope: 'yaml-only' as ConfigScope,
    description: 'Skills catalog backend URL',
  },
  'boost.skillsMarketplace.enabled': {
    schema: z.boolean().optional(),
    configScope: 'db-overridable' as ConfigScope,
    description: 'Enable or disable skills marketplace',
  },

  // -- Kagenti auth / token exchange --
  'boost.kagenti.auth.tokenExchange.enabled': {
    schema: z.boolean().optional(),
    configScope: 'yaml-only' as ConfigScope,
    description: 'Enable RFC 8693 token exchange for Kagenti',
  },
  'boost.kagenti.auth.tokenExchange.audience': {
    schema: z.string().optional(),
    configScope: 'yaml-only' as ConfigScope,
    description: 'Target audience for exchanged token',
  },
  'boost.kagenti.auth.tokenExchange.userTokenHeader': {
    schema: z.string().optional(),
    configScope: 'yaml-only' as ConfigScope,
    description: 'Header containing user OIDC token',
  },

  // -- DevSpaces credentials (sensitive) --
  'boost.devSpaces.credentials': {
    schema: z.string().optional(),
    configScope: 'db-overridable' as ConfigScope,
    description: 'DevSpaces integration credentials',
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
  return (boostConfigFields[key] as ConfigFieldMeta).sensitive === true;
}
