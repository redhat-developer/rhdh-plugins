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

import type { LoggerService } from '@backstage/backend-plugin-api';
import { ConfigReader } from '@backstage/config';
import { ConnectorConfigReader } from './ConnectorConfigReader';
import type { RuntimeConfigResolver } from '../config/RuntimeConfigResolver';
import type { BoostConfigKey } from '../config/schemas';

function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

/**
 * Create a mock RuntimeConfigResolver that resolves from a flat map.
 * Keys not present in the map resolve to `undefined`.
 */
function createMockResolver(
  overrides: Map<string, unknown> = new Map(),
): RuntimeConfigResolver {
  return {
    resolve: jest.fn(async (key: BoostConfigKey) => overrides.get(key)),
    resolveAll: jest.fn(async () => overrides),
    invalidate: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  } as unknown as RuntimeConfigResolver;
}

describe('ConnectorConfigReader', () => {
  it('discovers startup-enabled known providers', async () => {
    const config = new ConfigReader({
      'ai-catalog': {
        providers: {
          github: { enabled: true },
          gitlab: {},
          jira: { enabled: true },
        },
      },
    });

    const reader = new ConnectorConfigReader({
      config,
      resolver: createMockResolver(),
      logger: createMockLogger(),
    });
    const candidates = await reader.listCandidates();

    expect(candidates).toHaveLength(3);
    expect(candidates.map(c => c.connectorId).sort()).toEqual([
      'github',
      'gitlab',
      'jira',
    ]);
    expect(candidates.every(c => c.startupEnabled)).toBe(true);
    expect(candidates.every(c => c.runtimeEnabled)).toBe(true);
  });

  it('excludes startup-disabled providers', async () => {
    const config = new ConfigReader({
      'ai-catalog': {
        providers: {
          github: { enabled: false },
          jira: { enabled: true },
        },
      },
    });

    const reader = new ConnectorConfigReader({
      config,
      resolver: createMockResolver(),
      logger: createMockLogger(),
    });
    const candidates = await reader.listCandidates();

    expect(candidates).toHaveLength(1);
    expect(candidates[0].connectorId).toBe('jira');
  });

  it('honors resolver-returned values for runtimeEnabled', async () => {
    // The mock map simulates RuntimeConfigResolver's merged result
    // (YAML baseline + DB overrides), not a direct ConfigApi read.
    const config = new ConfigReader({
      'ai-catalog': {
        providers: {
          github: { enabled: true },
          jira: { enabled: true },
        },
      },
    });

    const resolver = createMockResolver(
      new Map<string, unknown>([
        ['boost.connectors.github.enabled', false],
        ['boost.connectors.jira.enabled', true],
      ]),
    );

    const reader = new ConnectorConfigReader({
      config,
      resolver,
      logger: createMockLogger(),
    });
    const candidates = await reader.listCandidates();

    const github = candidates.find(c => c.connectorId === 'github');
    const jira = candidates.find(c => c.connectorId === 'jira');
    expect(github?.runtimeEnabled).toBe(false);
    expect(jira?.runtimeEnabled).toBe(true);
  });

  it('excludes boost-only IDs without a provider block', async () => {
    const config = new ConfigReader({
      'ai-catalog': {
        providers: {
          github: { enabled: true },
        },
      },
      boost: {
        connectors: {
          github: { enabled: true },
          orphanConnector: { enabled: true },
        },
      },
    });

    const reader = new ConnectorConfigReader({
      config,
      resolver: createMockResolver(),
      logger: createMockLogger(),
    });
    const candidates = await reader.listCandidates();

    expect(candidates).toHaveLength(1);
    expect(candidates[0].connectorId).toBe('github');
    expect(
      candidates.find(c => c.connectorId === 'orphanConnector'),
    ).toBeUndefined();
  });

  it('YAML-only: runtimeEnabled defaults true when resolver returns undefined', async () => {
    const config = new ConfigReader({
      'ai-catalog': {
        providers: {
          github: { enabled: true },
        },
      },
    });

    // Resolver returns undefined for the key — no YAML or DB value
    const resolver = createMockResolver();

    const reader = new ConnectorConfigReader({
      config,
      resolver,
      logger: createMockLogger(),
    });
    const candidates = await reader.listCandidates();

    expect(candidates).toHaveLength(1);
    expect(candidates[0].connectorId).toBe('github');
    expect(candidates[0].runtimeEnabled).toBe(true);
  });

  it('DB override: enabled false via resolver overrides YAML true', async () => {
    const config = new ConfigReader({
      'ai-catalog': {
        providers: {
          jira: { enabled: true },
        },
      },
      boost: {
        connectors: {
          jira: { enabled: true },
        },
      },
    });

    // Simulate DB override: jira disabled at runtime
    const resolver = createMockResolver(
      new Map<string, unknown>([['boost.connectors.jira.enabled', false]]),
    );

    const reader = new ConnectorConfigReader({
      config,
      resolver,
      logger: createMockLogger(),
    });
    const candidates = await reader.listCandidates();

    const jira = candidates.find(c => c.connectorId === 'jira');
    expect(jira).toBeDefined();
    expect(jira!.runtimeEnabled).toBe(false);
  });

  it('startup-disabled providers excluded even with includeDisabled', async () => {
    // Startup-disabled providers are filtered out before the
    // runtimeEnabled flag is even checked, so they never appear
    // in the candidate list regardless of includeDisabled.
    const config = new ConfigReader({
      'ai-catalog': {
        providers: {
          github: { enabled: true },
          jira: { enabled: false },
        },
      },
    });

    const reader = new ConnectorConfigReader({
      config,
      resolver: createMockResolver(),
      logger: createMockLogger(),
    });
    const candidates = await reader.listCandidates();

    expect(candidates).toHaveLength(1);
    expect(candidates[0].connectorId).toBe('github');
    // Jira never appears — startup-disabled is a hard gate
    expect(candidates.find(c => c.connectorId === 'jira')).toBeUndefined();
  });

  it('resolver.resolve is called with the correct key', async () => {
    const config = new ConfigReader({
      'ai-catalog': {
        providers: {
          github: { enabled: true },
        },
      },
    });

    const resolver = createMockResolver();
    const reader = new ConnectorConfigReader({
      config,
      resolver,
      logger: createMockLogger(),
    });
    await reader.listCandidates();

    expect(resolver.resolve).toHaveBeenCalledWith(
      'boost.connectors.github.enabled',
    );
  });

  it('non-boolean resolver value warns and falls back to YAML', async () => {
    const config = new ConfigReader({
      'ai-catalog': {
        providers: {
          github: { enabled: true },
        },
      },
      boost: {
        connectors: {
          github: { enabled: false },
        },
      },
    });

    const resolver = createMockResolver(
      new Map<string, unknown>([['boost.connectors.github.enabled', 'false']]),
    );
    const logger = createMockLogger();
    const reader = new ConnectorConfigReader({
      config,
      resolver,
      logger,
    });
    const candidates = await reader.listCandidates();

    expect(candidates).toHaveLength(1);
    // YAML says false — do not fail-open to true on unexpected type
    expect(candidates[0].runtimeEnabled).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Unexpected type for boost.connectors.github.enabled',
      ),
    );
  });

  it('falls back to YAML ConfigApi when resolver.resolve rejects', async () => {
    const config = new ConfigReader({
      'ai-catalog': {
        providers: {
          github: { enabled: true },
        },
      },
      boost: {
        connectors: {
          github: { enabled: false },
        },
      },
    });

    const resolver = createMockResolver();
    (resolver.resolve as jest.Mock).mockRejectedValue(
      new Error('cache unavailable'),
    );
    const logger = createMockLogger();
    const reader = new ConnectorConfigReader({
      config,
      resolver,
      logger,
    });
    const candidates = await reader.listCandidates();

    expect(candidates).toHaveLength(1);
    expect(candidates[0].runtimeEnabled).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Failed to resolve runtime config for boost.connectors.github.enabled',
      ),
    );
  });
});
