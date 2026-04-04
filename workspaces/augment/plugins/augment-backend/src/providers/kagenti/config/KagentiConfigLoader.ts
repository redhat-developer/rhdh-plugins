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
  readonly dashboards: KagentiDashboardOverrides;
  readonly sandbox: KagentiSandboxDefaults;
  readonly migration: KagentiMigrationDefaults;
  readonly pagination: KagentiPaginationDefaults;
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

  const namespacesRaw = kagenti.getOptionalStringArray('namespaces');

  const dashboardsCfg = kagenti.getOptionalConfig('dashboards');
  const sandboxCfg = kagenti.getOptionalConfig('sandbox');
  const sidecarCfg = sandboxCfg?.getOptionalConfig('sidecar');
  const migrationCfg = kagenti.getOptionalConfig('migration');
  const paginationCfg = kagenti.getOptionalConfig('pagination');

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
    requestTimeoutMs: kagenti.getOptionalNumber('requestTimeoutMs') ?? 30_000,
    streamTimeoutMs: kagenti.getOptionalNumber('streamTimeoutMs') ?? 300_000,
    maxRetries: kagenti.getOptionalNumber('maxRetries') ?? 3,
    retryBaseDelayMs: kagenti.getOptionalNumber('retryBaseDelayMs') ?? 1000,
    tokenExpiryBufferSeconds:
      kagenti.getOptionalNumber('tokenExpiryBufferSeconds') ?? 60,
    dashboards: {
      mcpInspector: dashboardsCfg?.getOptionalString('mcpInspector'),
      mcpProxy: dashboardsCfg?.getOptionalString('mcpProxy'),
      traces: dashboardsCfg?.getOptionalString('traces'),
      network: dashboardsCfg?.getOptionalString('network'),
      keycloakConsole: dashboardsCfg?.getOptionalString('keycloakConsole'),
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
      defaultLimit: paginationCfg?.getOptionalNumber('defaultLimit') ?? 50,
      maxLimit: paginationCfg?.getOptionalNumber('maxLimit') ?? 200,
    },
    auth: { tokenEndpoint, clientId, clientSecret },
  };
}
