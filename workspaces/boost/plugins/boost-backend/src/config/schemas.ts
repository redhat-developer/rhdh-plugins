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

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Pattern matching a single cron field token. Accepts wildcards
 * (* and ?), integers and integer ranges (1, 1-5), step values
 * (star-slash-5, 1-5/2), three-letter English month names
 * (JAN-DEC) and weekday names (MON-SUN, case-insensitive), and
 * comma-separated lists of any of the above.
 *
 * Extended specifiers (L, W, #) are intentionally unsupported
 * because the backend scheduler uses a numeric-only cron parser.
 *
 * @internal
 */
const CRON_TOKEN_RE = /^(\*|\?|\d+(-\d+)?|[a-zA-Z]{3}(-[a-zA-Z]{3})?)(\/\d+)?$/;

/** Maximum value allowed per cron field position (0-indexed). @internal */
const CRON_FIELD_MAX: readonly number[] = [59, 23, 31, 12, 7];

/** Minimum value allowed per cron field position (0-indexed). @internal */
const CRON_FIELD_MIN: readonly number[] = [0, 0, 1, 1, 0];

/**
 * Validate that a string is a standard 5-field cron expression.
 *
 * Accepts numeric values, `*`, `?`, ranges, step values, and
 * three-letter English month/weekday names. Does **not** accept
 * `L`, `W`, or `#` specifiers.
 *
 * @param expr - The cron expression to validate.
 * @returns `true` if the expression has 5 valid fields with values
 *   within their allowed ranges.
 *
 * @internal
 */
export function isValidCronExpression(expr: string): boolean {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    return false;
  }
  return fields.every((field, idx) => {
    // Each field may be a comma-separated list of tokens
    const tokens = field.split(',');
    return tokens.every(token => {
      if (!CRON_TOKEN_RE.test(token)) {
        return false;
      }
      // Strip optional step suffix (e.g. */5 -> *, 1-5/2 -> 1-5)
      const base = token.split('/')[0];
      // Wildcards and named values pass without range check
      if (base === '*' || base === '?' || /[a-zA-Z]/.test(base)) {
        return true;
      }
      // Validate numeric range bounds
      const nums = base.split('-').map(Number);
      const min = CRON_FIELD_MIN[idx];
      const max = CRON_FIELD_MAX[idx];
      return nums.every(n => !isNaN(n) && n >= min && n <= max);
    });
  });
}

/**
 * Zod refinement for HTTPS URL validation. Accepts only `https://`
 * URLs to enforce secure transport for connector endpoints.
 *
 * @internal
 */
const httpsUrlSchema = z
  .string()
  .url()
  .refine(url => url.startsWith('https://'), {
    message: 'Endpoint must use HTTPS',
  });

/**
 * Zod schema for cron expression validation.
 *
 * @internal
 */
const cronExpressionSchema = z.string().refine(isValidCronExpression, {
  message: 'Invalid cron expression',
});

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
export const BOOST_CONFIG_SCHEMA_VERSION = 4;

// ---------------------------------------------------------------------------
// Connector field factories — shared patterns for per-connector leaves
// ---------------------------------------------------------------------------

/** @internal */
function connectorEnabled(label: string, id: string) {
  return {
    schema: z
      .boolean()
      .optional()
      .describe('Whether runtime syncing is enabled (default: true)'),
    configScope: 'db-overridable' as ConfigScope,
    description:
      `Whether ${label} connector runtime syncing is enabled. ` +
      `Defaults to true when not set. Distinct from ` +
      `ai-catalog.providers.${id}.enabled (startup registration).`,
  } as const;
}

/** @internal */
function connectorEndpoint(label: string, example: string) {
  return {
    schema: httpsUrlSchema.optional().describe(`${label} HTTPS endpoint URL`),
    configScope: 'db-overridable' as ConfigScope,
    description:
      `HTTPS endpoint URL for the ${label} ` + `${example}. Must use HTTPS.`,
  } as const;
}

/** @internal */
function connectorIntervalMs(label: string) {
  return {
    schema: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Sync interval in milliseconds (default: 300000)'),
    configScope: 'db-overridable' as ConfigScope,
    description:
      `Interval in milliseconds between ${label} sync runs. ` +
      `Defaults to 300000 (5 minutes) when not set.`,
  } as const;
}

/** @internal */
function connectorBatchSize(label: string) {
  return {
    schema: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Number of items per sync batch (default: 100)'),
    configScope: 'db-overridable' as ConfigScope,
    description:
      `Number of ${label} items to fetch per sync batch. ` +
      `Defaults to 100 when not set.`,
  } as const;
}

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
  // -- Kagenti auth / Keycloak service-account --
  'boost.kagenti.auth.tokenEndpoint': {
    schema: z.string().url().optional().describe('Keycloak token endpoint URL'),
    configScope: 'yaml-only' as ConfigScope,
    description:
      'Keycloak token endpoint URL for OAuth2 Client Credentials Grant ' +
      '(e.g. "https://keycloak.example.com/realms/boost/protocol/openid-connect/token").',
  },
  'boost.kagenti.auth.clientId': {
    schema: z
      .string()
      .optional()
      .describe('OAuth2 client ID for service-account'),
    configScope: 'yaml-only' as ConfigScope,
    description: 'OAuth2 client ID for Kagenti service-account authentication.',
  },
  'boost.kagenti.auth.clientSecret': {
    schema: z
      .string()
      .optional()
      .describe('OAuth2 client secret for service-account'),
    configScope: 'yaml-only' as ConfigScope,
    description:
      'OAuth2 client secret for Kagenti service-account authentication. ' +
      'Stored securely and never logged.',
    sensitive: true,
  },
  'boost.kagenti.auth.tokenExpiryBufferSeconds': {
    schema: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe('Seconds before expiry to refresh token'),
    configScope: 'yaml-only' as ConfigScope,
    description:
      'Number of seconds before token expiry to proactively refresh. ' +
      'Defaults to 60 when not set (applied by KeycloakAuthClient).',
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

  // -- Ingestion health retention --
  'boost.ingestion.healthRetention.maxAttemptsPerConnector': {
    schema: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Max sync attempts retained per connector'),
    configScope: 'yaml-only' as ConfigScope,
    description:
      'Maximum number of sync attempt records retained per connector ' +
      'for ingestion health status. Older records are cleaned up daily. ' +
      'Defaults to 100 when not set.',
  },

  // -- Connector config: Jira --
  'boost.connectors.jira.enabled': connectorEnabled('Jira', 'jira'),
  'boost.connectors.jira.endpoint': connectorEndpoint(
    'Jira',
    'instance (e.g. https://jira.example.com)',
  ),
  'boost.connectors.jira.schedule.intervalMs': connectorIntervalMs('Jira'),
  'boost.connectors.jira.schedule.cron': {
    schema: cronExpressionSchema
      .optional()
      .describe('Cron expression for sync schedule'),
    configScope: 'db-overridable' as ConfigScope,
    description:
      'Standard 5-field cron expression for Jira sync schedule. ' +
      'When set, takes precedence over schedule.intervalMs.',
  },
  'boost.connectors.jira.batchSize': connectorBatchSize('Jira'),
  'boost.connectors.jira.timeout.connectionMs': {
    schema: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Connection timeout in milliseconds (default: 30000)'),
    configScope: 'db-overridable' as ConfigScope,
    description:
      'Connection timeout in milliseconds for Jira API requests. ' +
      'Defaults to 30000 (30 seconds) when not set.',
  },

  // -- Connector config: GitHub --
  'boost.connectors.github.enabled': connectorEnabled('GitHub', 'github'),
  'boost.connectors.github.endpoint': connectorEndpoint(
    'GitHub',
    'API (e.g. https://api.github.com)',
  ),
  'boost.connectors.github.schedule.intervalMs': connectorIntervalMs('GitHub'),
  'boost.connectors.github.batchSize': connectorBatchSize('GitHub'),

  // -- Connector config: GitLab --
  'boost.connectors.gitlab.enabled': connectorEnabled('GitLab', 'gitlab'),
  'boost.connectors.gitlab.endpoint': connectorEndpoint(
    'GitLab',
    'API (e.g. https://gitlab.example.com)',
  ),
  'boost.connectors.gitlab.schedule.intervalMs': connectorIntervalMs('GitLab'),
  'boost.connectors.gitlab.batchSize': connectorBatchSize('GitLab'),
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
