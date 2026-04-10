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

import type { RootConfigService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';

export interface KagentiDashboardOverrides {
  readonly mcpInspector?: string;
  readonly mcpProxy?: string;
  readonly traces?: string;
  readonly network?: string;
  readonly keycloakConsole?: string;
  readonly domainName?: string;
}

export interface KagentiSandboxDefaults {
  readonly sessionTtlMinutes?: number;
  readonly defaultSkill?: string;
  readonly sidecar: {
    readonly autoApprove: boolean;
  };
}

export interface KagentiMigrationDefaults {
  readonly deleteOld: boolean;
  readonly dryRun: boolean;
}

export interface KagentiPaginationDefaults {
  readonly defaultLimit: number;
  readonly maxLimit: number;
}

export interface KagentiFeatureOverrides {
  readonly sandbox?: boolean;
  readonly integrations?: boolean;
  readonly triggers?: boolean;
}

export interface KagentiConfig {
  readonly baseUrl: string;
  readonly namespace: string;
  readonly namespaces?: readonly string[];
  readonly showAllNamespaces: boolean;
  readonly agentName?: string;
  readonly agents?: readonly string[];
  readonly skipTlsVerify: boolean;
  readonly verboseStreamLogging: boolean;
  readonly validateResponses: boolean;
  readonly requestTimeoutMs: number;
  readonly streamTimeoutMs: number;
  readonly maxRetries: number;
  readonly retryBaseDelayMs: number;
  readonly tokenExpiryBufferSeconds: number;
  readonly extensionBaseUrl: string;
  readonly dashboards: KagentiDashboardOverrides;
  readonly sandbox: KagentiSandboxDefaults;
  readonly migration: KagentiMigrationDefaults;
  readonly pagination: KagentiPaginationDefaults;
  readonly featureOverrides: KagentiFeatureOverrides;
  readonly auth: {
    readonly tokenEndpoint: string;
    readonly clientId: string;
    readonly clientSecret: string;
  };
}

export function loadKagentiConfig(config: RootConfigService): KagentiConfig {
  const kagenti = config.getOptionalConfig('augment.kagenti');
  if (!kagenti) {
    throw new InputError(
      'Missing required config: augment.kagenti. ' +
        'Configure baseUrl and auth settings in app-config.yaml.',
    );
  }

  const baseUrl = kagenti.getOptionalString('baseUrl');
  if (!baseUrl) {
    throw new InputError('Missing required config: augment.kagenti.baseUrl');
  }
  try {
    // eslint-disable-next-line no-new
    new URL(baseUrl);
  } catch {
    throw new InputError(
      `Invalid augment.kagenti.baseUrl: "${baseUrl}" is not a valid URL. ` +
        'Expected format: https://kagenti-api.example.com',
    );
  }

  const authConfig = kagenti.getOptionalConfig('auth');
  if (!authConfig) {
    throw new InputError(
      'Missing required config: augment.kagenti.auth. ' +
        'Configure tokenEndpoint, clientId, and clientSecret.',
    );
  }

  const tokenEndpoint = authConfig.getOptionalString('tokenEndpoint');
  if (!tokenEndpoint) {
    throw new InputError(
      'Missing required config: augment.kagenti.auth.tokenEndpoint',
    );
  }
  try {
    // eslint-disable-next-line no-new
    new URL(tokenEndpoint);
  } catch {
    throw new InputError(
      `Invalid augment.kagenti.auth.tokenEndpoint: "${tokenEndpoint}" is not a valid URL. ` +
        'Expected format: https://keycloak.example.com/realms/kagenti/protocol/openid-connect/token',
    );
  }

  const clientId = authConfig.getOptionalString('clientId');
  if (!clientId) {
    throw new InputError(
      'Missing required config: augment.kagenti.auth.clientId',
    );
  }

  const clientSecret = authConfig.getOptionalString('clientSecret');
  if (!clientSecret) {
    throw new InputError(
      'Missing required config: augment.kagenti.auth.clientSecret',
    );
  }

  const requestTimeoutMs =
    kagenti.getOptionalNumber('requestTimeoutMs') ?? 30_000;
  const streamTimeoutMs =
    kagenti.getOptionalNumber('streamTimeoutMs') ?? 300_000;
  const maxRetries = kagenti.getOptionalNumber('maxRetries') ?? 3;
  const retryBaseDelayMs =
    kagenti.getOptionalNumber('retryBaseDelayMs') ?? 1000;
  const tokenExpiryBufferSeconds =
    kagenti.getOptionalNumber('tokenExpiryBufferSeconds') ?? 60;
  const extensionBaseUrl = (
    kagenti.getOptionalString('extensionBaseUrl') ??
    'https://a2a-extensions.adk.kagenti.dev'
  ).replace(/\/+$/, '');

  if (requestTimeoutMs <= 0) {
    throw new InputError('augment.kagenti.requestTimeoutMs must be positive');
  }
  if (streamTimeoutMs <= 0) {
    throw new InputError('augment.kagenti.streamTimeoutMs must be positive');
  }
  if (maxRetries < 0) {
    throw new InputError('augment.kagenti.maxRetries must be non-negative');
  }
  if (retryBaseDelayMs <= 0) {
    throw new InputError('augment.kagenti.retryBaseDelayMs must be positive');
  }
  if (tokenExpiryBufferSeconds <= 0) {
    throw new InputError(
      'augment.kagenti.tokenExpiryBufferSeconds must be positive',
    );
  }

  const namespacesRaw = kagenti.getOptionalStringArray('namespaces');

  const dashboardsCfg = kagenti.getOptionalConfig('dashboards');
  const sandboxCfg = kagenti.getOptionalConfig('sandbox');
  const sidecarCfg = sandboxCfg?.getOptionalConfig('sidecar');
  const migrationCfg = kagenti.getOptionalConfig('migration');
  const paginationCfg = kagenti.getOptionalConfig('pagination');
  const featureOverridesCfg = kagenti.getOptionalConfig('featureOverrides');

  const paginationDefaultLimit =
    paginationCfg?.getOptionalNumber('defaultLimit') ?? 50;
  const paginationMaxLimit =
    paginationCfg?.getOptionalNumber('maxLimit') ?? 200;
  if (paginationDefaultLimit <= 0) {
    throw new InputError(
      'augment.kagenti.pagination.defaultLimit must be positive',
    );
  }
  if (paginationMaxLimit < paginationDefaultLimit) {
    throw new InputError(
      'augment.kagenti.pagination.maxLimit must be >= defaultLimit',
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ''),
    namespace: kagenti.getOptionalString('namespace') ?? 'default',
    namespaces: namespacesRaw ?? undefined,
    showAllNamespaces: kagenti.getOptionalBoolean('showAllNamespaces') ?? true,
    agentName: kagenti.getOptionalString('agentName'),
    agents: kagenti.getOptionalStringArray('agents') ?? undefined,
    skipTlsVerify: kagenti.getOptionalBoolean('skipTlsVerify') ?? false,
    verboseStreamLogging:
      kagenti.getOptionalBoolean('verboseStreamLogging') ?? false,
    validateResponses: kagenti.getOptionalBoolean('validateResponses') ?? false,
    requestTimeoutMs,
    streamTimeoutMs,
    maxRetries,
    retryBaseDelayMs,
    tokenExpiryBufferSeconds,
    extensionBaseUrl,
    dashboards: {
      mcpInspector: dashboardsCfg?.getOptionalString('mcpInspector'),
      mcpProxy: dashboardsCfg?.getOptionalString('mcpProxy'),
      traces: dashboardsCfg?.getOptionalString('traces'),
      network: dashboardsCfg?.getOptionalString('network'),
      keycloakConsole: dashboardsCfg?.getOptionalString('keycloakConsole'),
      domainName: dashboardsCfg?.getOptionalString('domainName'),
    },
    sandbox: {
      sessionTtlMinutes: sandboxCfg?.getOptionalNumber('sessionTtlMinutes'),
      defaultSkill: sandboxCfg?.getOptionalString('defaultSkill'),
      sidecar: {
        autoApprove: sidecarCfg?.getOptionalBoolean('autoApprove') ?? false,
      },
    },
    migration: {
      deleteOld: migrationCfg?.getOptionalBoolean('deleteOld') ?? false,
      dryRun: migrationCfg?.getOptionalBoolean('dryRun') ?? false,
    },
    pagination: {
      defaultLimit: paginationDefaultLimit,
      maxLimit: paginationMaxLimit,
    },
    featureOverrides: {
      sandbox: featureOverridesCfg?.getOptionalBoolean('sandbox'),
      integrations: featureOverridesCfg?.getOptionalBoolean('integrations'),
      triggers: featureOverridesCfg?.getOptionalBoolean('triggers'),
    },
    auth: { tokenEndpoint, clientId, clientSecret },
  };
}
