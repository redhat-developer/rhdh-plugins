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

import { ConfigReader } from '@backstage/config';
import { loadKagentiConfig } from './KagentiConfigLoader';

function makeConfig(overrides: Record<string, unknown> = {}) {
  return new ConfigReader({
    augment: {
      kagenti: {
        baseUrl: 'https://kagenti.example.com',
        auth: {
          tokenEndpoint:
            'https://keycloak.example.com/realms/kagenti/protocol/openid-connect/token',
          clientId: 'kagenti-client',
          clientSecret: 'secret-123',
        },
        ...overrides,
      },
    },
  });
}

describe('loadKagentiConfig', () => {
  it('loads a valid full config with defaults', () => {
    const result = loadKagentiConfig(makeConfig());
    expect(result).toEqual({
      baseUrl: 'https://kagenti.example.com',
      namespace: 'default',
      namespaces: undefined,
      showAllNamespaces: true,
      agentName: undefined,
      agents: undefined,
      skipTlsVerify: false,
      verboseStreamLogging: false,
      validateResponses: false,
      requestTimeoutMs: 30_000,
      streamTimeoutMs: 300_000,
      maxRetries: 3,
      retryBaseDelayMs: 1000,
      tokenExpiryBufferSeconds: 60,
      dashboards: {
        mcpInspector: undefined,
        mcpProxy: undefined,
        traces: undefined,
        network: undefined,
        keycloakConsole: undefined,
      },
      sandbox: {
        sessionTtlMinutes: undefined,
        defaultSkill: undefined,
        sidecar: { autoApprove: false },
      },
      migration: { deleteOld: false, dryRun: false },
      pagination: { defaultLimit: 50, maxLimit: 200 },
      auth: {
        tokenEndpoint:
          'https://keycloak.example.com/realms/kagenti/protocol/openid-connect/token',
        clientId: 'kagenti-client',
        clientSecret: 'secret-123',
      },
    });
  });

  it('strips trailing slashes from baseUrl', () => {
    const result = loadKagentiConfig(
      makeConfig({ baseUrl: 'https://kagenti.example.com///' }),
    );
    expect(result.baseUrl).toBe('https://kagenti.example.com');
  });

  it('accepts optional overrides', () => {
    const result = loadKagentiConfig(
      makeConfig({
        namespace: 'team1',
        agentName: 'weather-bot',
        skipTlsVerify: true,
      }),
    );
    expect(result.namespace).toBe('team1');
    expect(result.agentName).toBe('weather-bot');
    expect(result.skipTlsVerify).toBe(true);
  });

  it('loads new gap fields from config', () => {
    const result = loadKagentiConfig(
      makeConfig({
        namespaces: ['ns1', 'ns2'],
        showAllNamespaces: false,
        agents: ['ns1/bot1', 'ns2/bot2'],
        verboseStreamLogging: true,
        dashboards: {
          mcpInspector: 'https://mcp.example.com',
          traces: 'https://traces.example.com',
        },
        sandbox: {
          sessionTtlMinutes: 120,
          defaultSkill: 'coding',
          sidecar: { autoApprove: true },
        },
        migration: { deleteOld: true, dryRun: true },
        pagination: { defaultLimit: 25, maxLimit: 100 },
      }),
    );
    expect(result.namespaces).toEqual(['ns1', 'ns2']);
    expect(result.showAllNamespaces).toBe(false);
    expect(result.agents).toEqual(['ns1/bot1', 'ns2/bot2']);
    expect(result.verboseStreamLogging).toBe(true);
    expect(result.dashboards.mcpInspector).toBe('https://mcp.example.com');
    expect(result.dashboards.traces).toBe('https://traces.example.com');
    expect(result.dashboards.mcpProxy).toBeUndefined();
    expect(result.sandbox.sessionTtlMinutes).toBe(120);
    expect(result.sandbox.defaultSkill).toBe('coding');
    expect(result.sandbox.sidecar.autoApprove).toBe(true);
    expect(result.migration.deleteOld).toBe(true);
    expect(result.migration.dryRun).toBe(true);
    expect(result.pagination.defaultLimit).toBe(25);
    expect(result.pagination.maxLimit).toBe(100);
  });

  it('throws when augment.kagenti is missing', () => {
    const config = new ConfigReader({ augment: {} });
    expect(() => loadKagentiConfig(config)).toThrow(/Missing required config/);
  });

  it('throws when baseUrl is missing', () => {
    const config = new ConfigReader({
      augment: {
        kagenti: {
          auth: {
            tokenEndpoint: 'https://kc.example.com/token',
            clientId: 'c',
            clientSecret: 's',
          },
        },
      },
    });
    expect(() => loadKagentiConfig(config)).toThrow(/baseUrl/);
  });

  it('throws when auth block is missing', () => {
    const config = new ConfigReader({
      augment: { kagenti: { baseUrl: 'https://k.example.com' } },
    });
    expect(() => loadKagentiConfig(config)).toThrow(/auth/);
  });

  it('throws when auth.clientSecret is missing', () => {
    const config = new ConfigReader({
      augment: {
        kagenti: {
          baseUrl: 'https://k.example.com',
          auth: {
            tokenEndpoint: 'https://kc.example.com/token',
            clientId: 'c',
          },
        },
      },
    });
    expect(() => loadKagentiConfig(config)).toThrow(/clientSecret/);
  });
});
