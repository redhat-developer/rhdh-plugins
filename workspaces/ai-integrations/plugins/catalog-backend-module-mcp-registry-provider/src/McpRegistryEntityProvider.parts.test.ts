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

import type { Entity } from '@backstage/catalog-model';
import type { DeferredEntity } from '@backstage/plugin-catalog-node';
import type { McpServerMappingDefaults } from '@red-hat-developer-hub/backstage-plugin-mcp-registry-server-mapping-common';
import type { McpRegistryProviderConfig } from './config';
import type { McpRegistryListResponse, McpRegistryServerEntry } from './client';
import {
  buildLastGoodKey,
  formatMappingFailureMessage,
  McpRegistryEntityProvider,
  readServerIdentity,
} from './McpRegistryEntityProvider';
import { createMockServerDoc } from './testUtils';

const SYNC_STATUS_ANNOTATION = 'redhat.com/rhdh-mcp-registry-sync-status';
const LOCATION = 'url:https://registry.example.com';

type ProviderParts = {
  fetchRegistryEntries(): Promise<McpRegistryServerEntry[] | undefined>;
  mapRegistryEntries(
    entries: McpRegistryServerEntry[],
    managedByLocation: string,
  ): { entities: DeferredEntity[]; hasDegradedEntries: boolean };
  mapRegistryEntry(
    entry: McpRegistryServerEntry,
    managedByLocation: string,
  ): DeferredEntity;
  buildMappingDefaults(): McpServerMappingDefaults;
  applyProviderAnnotations(
    entity: Entity,
    managedByLocation: string,
    syncStatus: 'ok' | 'degraded',
  ): void;
  retainLastGoodOnMappingFailure(
    entry: McpRegistryServerEntry,
    err: unknown,
    managedByLocation: string,
  ): DeferredEntity | undefined;
  rebuildLastGoodIndex(entities: DeferredEntity[]): void;
  lastGoodIndex: Map<string, DeferredEntity>;
};

function parts(provider: McpRegistryEntityProvider): ProviderParts {
  return provider as unknown as ProviderParts;
}

function createMockLogger() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

function createDefaultConfig(
  overrides?: Partial<McpRegistryProviderConfig>,
): McpRegistryProviderConfig {
  return {
    baseUrl: 'https://registry.example.com',
    apiVersion: 'v1',
    pageLimit: 10,
    maxEntries: 5000,
    schedule: {
      frequency: { minutes: 30 },
      timeout: { minutes: 3 },
    },
    ...overrides,
  };
}

function mockFetchForResponses(
  responses: McpRegistryListResponse[],
): jest.Mock {
  const fn = jest.fn();
  for (const body of responses) {
    fn.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as unknown as Response);
  }
  return fn;
}

function makeDeferred(
  name: string,
  version: string,
  syncStatus: 'ok' | 'degraded' = 'ok',
): DeferredEntity {
  return {
    locationKey: 'mcp-registry-provider',
    entity: {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      metadata: {
        name: `${name}-${version}`,
        annotations: {
          'modelcontextprotocol.io/name': name,
          'modelcontextprotocol.io/version': version,
          [SYNC_STATUS_ANNOTATION]: syncStatus,
        },
      },
      spec: {
        type: 'mcp-server',
        lifecycle: 'experimental',
        owner: 'unknown',
        remotes: [{ type: 'streamable-http', url: 'https://example.com/mcp' }],
      },
    },
  };
}

describe('buildLastGoodKey', () => {
  it('joins name and version with a double-colon separator', () => {
    expect(buildLastGoodKey('io.example/weather', '1.0.0')).toBe(
      'io.example/weather::1.0.0',
    );
  });
});

describe('readServerIdentity', () => {
  it('returns name and version from a valid entry', () => {
    expect(
      readServerIdentity({
        server: createMockServerDoc('io.example/weather', '1.2.3'),
      }),
    ).toEqual({ name: 'io.example/weather', version: '1.2.3' });
  });

  it('returns undefined fields for null or undefined entries', () => {
    expect(readServerIdentity(null)).toEqual({
      name: undefined,
      version: undefined,
    });
    expect(readServerIdentity(undefined)).toEqual({
      name: undefined,
      version: undefined,
    });
  });

  it('ignores non-string name and version values', () => {
    expect(
      readServerIdentity({
        server: {
          ...createMockServerDoc('io.example/weather', '1.0.0'),
          name: 42 as unknown as string,
          version: { n: 1 } as unknown as string,
        },
      }),
    ).toEqual({ name: undefined, version: undefined });
  });
});

describe('formatMappingFailureMessage', () => {
  it('includes name and version when both are present', () => {
    expect(
      formatMappingFailureMessage('io.example/weather', '1.0.0', 'boom'),
    ).toBe(
      'Failed to map MCP Registry server entry "io.example/weather" version "1.0.0": boom',
    );
  });

  it('omits missing name and version segments', () => {
    expect(formatMappingFailureMessage(undefined, undefined, 'boom')).toBe(
      'Failed to map MCP Registry server entry: boom',
    );
  });

  it('includes only the version when name is missing', () => {
    expect(formatMappingFailureMessage(undefined, '1.0.0', 'boom')).toBe(
      'Failed to map MCP Registry server entry version "1.0.0": boom',
    );
  });
});

describe('McpRegistryEntityProvider parts', () => {
  describe('fetchRegistryEntries', () => {
    it('returns the registry server list on success', async () => {
      const body: McpRegistryListResponse = {
        servers: [{ server: createMockServerDoc('a/b', '1.0.0') }],
        metadata: { count: 1 },
      };
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        createMockLogger(),
        { fetchApi: mockFetchForResponses([body]) },
      );

      await expect(parts(provider).fetchRegistryEntries()).resolves.toEqual(
        body.servers,
      );
    });

    it('buffers entries and returns undefined when pageLimit leaves more pages', async () => {
      const logger = createMockLogger();
      const page1: McpRegistryListResponse = {
        servers: [{ server: createMockServerDoc('a/one', '1.0.0') }],
        metadata: { count: 2, nextCursor: 'cursor-1' },
      };
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig({ pageLimit: 1 }),
        logger,
        { fetchApi: mockFetchForResponses([page1]) },
      );

      await expect(
        parts(provider).fetchRegistryEntries(),
      ).resolves.toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('will resume from the saved cursor'),
      );
    });

    it('resumes from the saved cursor and returns all buffered entries when complete', async () => {
      const page1: McpRegistryListResponse = {
        servers: [{ server: createMockServerDoc('a/one', '1.0.0') }],
        metadata: { count: 2, nextCursor: 'cursor-1' },
      };
      const page2: McpRegistryListResponse = {
        servers: [{ server: createMockServerDoc('a/two', '2.0.0') }],
        metadata: { count: 2 },
      };
      const fetchFn = mockFetchForResponses([page1, page2]);
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig({ pageLimit: 1 }),
        createMockLogger(),
        { fetchApi: fetchFn },
      );

      await expect(
        parts(provider).fetchRegistryEntries(),
      ).resolves.toBeUndefined();

      await expect(parts(provider).fetchRegistryEntries()).resolves.toEqual([
        ...page1.servers,
        ...page2.servers,
      ]);

      const secondUrl = fetchFn.mock.calls[1][0] as string;
      expect(secondUrl).toContain('cursor=cursor-1');
    });

    it('starts from the beginning again after a complete traversal', async () => {
      const firstPassPage: McpRegistryListResponse = {
        servers: [{ server: createMockServerDoc('a/one', '1.0.0') }],
        metadata: { count: 1 },
      };
      const secondPassPage: McpRegistryListResponse = {
        servers: [{ server: createMockServerDoc('a/two', '2.0.0') }],
        metadata: { count: 1 },
      };
      const fetchFn = mockFetchForResponses([firstPassPage, secondPassPage]);
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig({ pageLimit: 1 }),
        createMockLogger(),
        { fetchApi: fetchFn },
      );

      await expect(parts(provider).fetchRegistryEntries()).resolves.toEqual(
        firstPassPage.servers,
      );
      await expect(parts(provider).fetchRegistryEntries()).resolves.toEqual(
        secondPassPage.servers,
      );

      const firstUrl = fetchFn.mock.calls[0][0] as string;
      const secondUrl = fetchFn.mock.calls[1][0] as string;
      expect(firstUrl).not.toContain('cursor=');
      expect(secondUrl).not.toContain('cursor=');
    });

    it('commits buffered entries and saves endCursor when maxEntries is hit', async () => {
      const logger = createMockLogger();
      const page1: McpRegistryListResponse = {
        servers: Array.from({ length: 3 }, (_, i) => ({
          server: createMockServerDoc(`a/s${i}`, '1.0.0'),
        })),
        metadata: { count: 6, nextCursor: 'cursor-1' },
      };
      const page2: McpRegistryListResponse = {
        servers: Array.from({ length: 3 }, (_, i) => ({
          server: createMockServerDoc(`a/s${i + 3}`, '1.0.0'),
        })),
        metadata: { count: 6, nextCursor: 'cursor-2' },
      };
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig({ maxEntries: 4, pageLimit: 10 }),
        logger,
        { fetchApi: mockFetchForResponses([page1, page2]) },
      );

      await expect(parts(provider).fetchRegistryEntries()).resolves.toEqual(
        page1.servers,
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('reached maxEntries'),
      );

      const state = provider as unknown as {
        endCursor?: string;
        endCursorMaxEntries?: number;
      };
      expect(state.endCursor).toBe('cursor-1');
      expect(state.endCursorMaxEntries).toBe(4);
    });

    it('stops later traversals at the saved endCursor', async () => {
      const page1: McpRegistryListResponse = {
        servers: Array.from({ length: 3 }, (_, i) => ({
          server: createMockServerDoc(`a/s${i}`, '1.0.0'),
        })),
        metadata: { count: 6, nextCursor: 'cursor-1' },
      };
      const page2: McpRegistryListResponse = {
        servers: Array.from({ length: 3 }, (_, i) => ({
          server: createMockServerDoc(`a/s${i + 3}`, '1.0.0'),
        })),
        metadata: { count: 6, nextCursor: 'cursor-2' },
      };
      const secondPass: McpRegistryListResponse = {
        servers: Array.from({ length: 3 }, (_, i) => ({
          server: createMockServerDoc(`a/s${i}`, '1.0.0'),
        })),
        metadata: { count: 6, nextCursor: 'cursor-1' },
      };
      const fetchFn = mockFetchForResponses([page1, page2, secondPass]);
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig({ maxEntries: 4, pageLimit: 10 }),
        createMockLogger(),
        { fetchApi: fetchFn },
      );

      await parts(provider).fetchRegistryEntries();
      await expect(parts(provider).fetchRegistryEntries()).resolves.toEqual(
        secondPass.servers,
      );
      expect(fetchFn).toHaveBeenCalledTimes(3);
    });

    it('clears endCursor when maxEntries is patched', async () => {
      const page1: McpRegistryListResponse = {
        servers: Array.from({ length: 3 }, (_, i) => ({
          server: createMockServerDoc(`a/s${i}`, '1.0.0'),
        })),
        metadata: { count: 6, nextCursor: 'cursor-1' },
      };
      const page2: McpRegistryListResponse = {
        servers: Array.from({ length: 3 }, (_, i) => ({
          server: createMockServerDoc(`a/s${i + 3}`, '1.0.0'),
        })),
        metadata: { count: 6, nextCursor: 'cursor-2' },
      };
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig({ maxEntries: 4, pageLimit: 10 }),
        createMockLogger(),
        { fetchApi: mockFetchForResponses([page1, page2]) },
      );

      await parts(provider).fetchRegistryEntries();
      const state = provider as unknown as {
        endCursor?: string;
        endCursorMaxEntries?: number;
        config: { maxEntries: number };
      };
      expect(state.endCursor).toBe('cursor-1');

      state.config.maxEntries = 5000;
      const fullPage: McpRegistryListResponse = {
        servers: [{ server: createMockServerDoc('a/only', '1.0.0') }],
        metadata: { count: 1 },
      };
      const fetchFn = mockFetchForResponses([fullPage]);
      (provider as unknown as { fetchApi?: typeof fetch }).fetchApi = fetchFn;

      await expect(parts(provider).fetchRegistryEntries()).resolves.toEqual(
        fullPage.servers,
      );
      expect(state.endCursor).toBeUndefined();
    });

    it('logs and returns undefined for McpRegistryClientError', async () => {
      const logger = createMockLogger();
      const fetchFn = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'unavailable',
      } as unknown as Response);
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        logger,
        { fetchApi: fetchFn },
      );

      await expect(
        parts(provider).fetchRegistryEntries(),
      ).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'MCP Registry sync failed (no mutation emitted)',
        ),
      );
    });

    it('wraps transport failures as client errors and returns undefined', async () => {
      const logger = createMockLogger();
      const fetchFn = jest
        .fn()
        .mockRejectedValue(new TypeError('network down'));
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        logger,
        { fetchApi: fetchFn },
      );

      await expect(
        parts(provider).fetchRegistryEntries(),
      ).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'MCP Registry sync failed (no mutation emitted)',
        ),
      );
    });
  });

  describe('buildMappingDefaults', () => {
    it('uses baseUrl as placeholderRemoteUrl when other overrides are omitted', () => {
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        createMockLogger(),
      );
      expect(parts(provider).buildMappingDefaults()).toEqual({
        placeholderRemoteUrl: 'https://registry.example.com',
      });
    });

    it('keeps a trailing slash on the configured baseUrl', () => {
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig({ baseUrl: 'https://registry.example.com/' }),
        createMockLogger(),
      );
      expect(parts(provider).buildMappingDefaults()).toEqual({
        placeholderRemoteUrl: 'https://registry.example.com/',
      });
    });

    it('includes owner and prefix when configured', () => {
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig({
          defaultOwner: 'group:default/mcp-admins',
          baseName: 'com.example.registry',
        }),
        createMockLogger(),
      );
      expect(parts(provider).buildMappingDefaults()).toEqual({
        owner: 'group:default/mcp-admins',
        prefix: 'com.example.registry',
        placeholderRemoteUrl: 'https://registry.example.com',
      });
    });
  });

  describe('applyProviderAnnotations', () => {
    it('sets location, origin, and sync-status annotations', () => {
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        createMockLogger(),
      );
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'API',
        metadata: { name: 'weather' },
        spec: { type: 'mcp-server' },
      };

      parts(provider).applyProviderAnnotations(entity, LOCATION, 'ok');

      expect(entity.metadata.annotations).toEqual({
        'backstage.io/managed-by-location': LOCATION,
        'backstage.io/managed-by-origin-location': LOCATION,
        [SYNC_STATUS_ANNOTATION]: 'ok',
      });
    });

    it('creates the annotations object when missing', () => {
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        createMockLogger(),
      );
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'API',
        metadata: { name: 'weather' },
        spec: { type: 'mcp-server' },
      };

      parts(provider).applyProviderAnnotations(entity, LOCATION, 'degraded');

      expect(entity.metadata.annotations?.[SYNC_STATUS_ANNOTATION]).toBe(
        'degraded',
      );
    });
  });

  describe('mapRegistryEntry', () => {
    it('maps a server entry to a deferred entity with ok sync status', () => {
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig({ defaultOwner: 'user:default/guest' }),
        createMockLogger(),
      );
      const deferred = parts(provider).mapRegistryEntry(
        { server: createMockServerDoc('io.example/weather', '1.0.0') },
        LOCATION,
      );

      expect(deferred.locationKey).toBe('mcp-registry-provider');
      expect(deferred.entity.spec?.owner).toBe('user:default/guest');
      expect(deferred.entity.metadata.annotations).toEqual(
        expect.objectContaining({
          'backstage.io/managed-by-location': LOCATION,
          'backstage.io/managed-by-origin-location': LOCATION,
          [SYNC_STATUS_ANNOTATION]: 'ok',
          'modelcontextprotocol.io/name': 'io.example/weather',
          'modelcontextprotocol.io/version': '1.0.0',
        }),
      );
    });

    it('uses the registry baseUrl as the placeholder remote when remotes are absent', () => {
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        createMockLogger(),
      );
      const deferred = parts(provider).mapRegistryEntry(
        {
          server: createMockServerDoc('io.example/weather', '1.0.0', {
            remotes: undefined,
            websiteUrl: 'https://website.example.com',
          }),
        },
        LOCATION,
      );

      expect(deferred.entity.spec).toEqual(
        expect.objectContaining({
          remotes: [{ type: 'undefined', url: 'https://registry.example.com' }],
        }),
      );
    });

    it('keeps a trailing slash on the placeholder remote url', () => {
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig({ baseUrl: 'https://registry.example.com/' }),
        createMockLogger(),
      );
      const deferred = parts(provider).mapRegistryEntry(
        {
          server: createMockServerDoc('io.example/weather', '1.0.0', {
            remotes: [],
          }),
        },
        LOCATION,
      );

      expect(deferred.entity.spec).toEqual(
        expect.objectContaining({
          remotes: [
            { type: 'undefined', url: 'https://registry.example.com/' },
          ],
        }),
      );
    });

    it('throws when the server document cannot be mapped', () => {
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        createMockLogger(),
      );

      expect(() =>
        parts(provider).mapRegistryEntry(
          {
            server: {
              $schema:
                'https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json',
              name: 'bad/server',
              description: '',
              version: '1.0.0',
            } as any,
          },
          LOCATION,
        ),
      ).toThrow();
    });
  });

  describe('mapRegistryEntries', () => {
    it('maps successful entries and retains last-good on failure', () => {
      const logger = createMockLogger();
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        logger,
      );
      const good = makeDeferred('ok/server', '1.0.0');
      parts(provider).lastGoodIndex.set(
        buildLastGoodKey('fail/server', '1.0.0'),
        good,
      );

      const result = parts(provider).mapRegistryEntries(
        [
          { server: createMockServerDoc('ok/server', '1.0.0') },
          {
            server: {
              $schema:
                'https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json',
              name: 'fail/server',
              description: '',
              version: '1.0.0',
            } as any,
          },
        ],
        LOCATION,
      );

      expect(result.hasDegradedEntries).toBe(true);
      expect(result.entities).toHaveLength(2);
      expect(
        result.entities[0].entity.metadata.annotations?.[
          SYNC_STATUS_ANNOTATION
        ],
      ).toBe('ok');
      expect(
        result.entities[1].entity.metadata.annotations?.[
          SYNC_STATUS_ANNOTATION
        ],
      ).toBe('degraded');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('omits failed entries when no last-good exists', () => {
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        createMockLogger(),
      );

      const result = parts(provider).mapRegistryEntries(
        [
          {
            server: {
              $schema:
                'https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json',
              name: 'fail/server',
              description: '',
              version: '1.0.0',
            } as any,
          },
        ],
        LOCATION,
      );

      expect(result).toEqual({ entities: [], hasDegradedEntries: false });
    });
  });

  describe('retainLastGoodOnMappingFailure', () => {
    it('returns undefined when name or version is missing', () => {
      const logger = createMockLogger();
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        logger,
      );

      const retained = parts(provider).retainLastGoodOnMappingFailure(
        {
          server: {
            ...createMockServerDoc('io.example/weather', '1.0.0'),
            version: undefined as unknown as string,
          },
        },
        new Error('map failed'),
        LOCATION,
      );

      expect(retained).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to map MCP Registry server entry'),
      );
    });

    it('returns undefined and logs when no last-good entity exists', () => {
      const logger = createMockLogger();
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        logger,
      );

      const retained = parts(provider).retainLastGoodOnMappingFailure(
        { server: createMockServerDoc('missing/server', '1.0.0') },
        new Error('map failed'),
        LOCATION,
      );

      expect(retained).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('No last-good entity found'),
      );
    });

    it('returns a degraded clone of the last-good entity', () => {
      const logger = createMockLogger();
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        logger,
      );
      const lastGood = makeDeferred('kept/server', '2.0.0');
      parts(provider).lastGoodIndex.set(
        buildLastGoodKey('kept/server', '2.0.0'),
        lastGood,
      );

      const retained = parts(provider).retainLastGoodOnMappingFailure(
        { server: createMockServerDoc('kept/server', '2.0.0') },
        new Error('map failed'),
        LOCATION,
      );

      expect(retained).toBeDefined();
      expect(retained!.entity).not.toBe(lastGood.entity);
      expect(retained!.entity.metadata.annotations).toEqual(
        expect.objectContaining({
          'backstage.io/managed-by-location': LOCATION,
          'backstage.io/managed-by-origin-location': LOCATION,
          [SYNC_STATUS_ANNOTATION]: 'degraded',
        }),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Retained last-good entity'),
      );
    });
  });

  describe('rebuildLastGoodIndex', () => {
    it('indexes ok entities and skips degraded ones', () => {
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        createMockLogger(),
      );
      const ok = makeDeferred('ok/server', '1.0.0', 'ok');
      const degraded = makeDeferred('bad/server', '1.0.0', 'degraded');

      parts(provider).rebuildLastGoodIndex([ok, degraded]);

      expect(parts(provider).lastGoodIndex.size).toBe(1);
      expect(
        parts(provider).lastGoodIndex.get(
          buildLastGoodKey('ok/server', '1.0.0'),
        ),
      ).toBe(ok);
      expect(
        parts(provider).lastGoodIndex.has(
          buildLastGoodKey('bad/server', '1.0.0'),
        ),
      ).toBe(false);
    });

    it('skips entities missing name or version annotations', () => {
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        createMockLogger(),
      );
      const incomplete: DeferredEntity = {
        locationKey: 'mcp-registry-provider',
        entity: {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'API',
          metadata: {
            name: 'incomplete',
            annotations: {
              [SYNC_STATUS_ANNOTATION]: 'ok',
              'modelcontextprotocol.io/name': 'only/name',
            },
          },
          spec: { type: 'mcp-server' },
        },
      };

      parts(provider).rebuildLastGoodIndex([incomplete]);

      expect(parts(provider).lastGoodIndex.size).toBe(0);
    });

    it('clears prior index entries before rebuilding', () => {
      const provider = new McpRegistryEntityProvider(
        createDefaultConfig(),
        createMockLogger(),
      );
      parts(provider).lastGoodIndex.set(
        buildLastGoodKey('old/server', '0.1.0'),
        makeDeferred('old/server', '0.1.0'),
      );

      parts(provider).rebuildLastGoodIndex([
        makeDeferred('new/server', '2.0.0'),
      ]);

      expect(parts(provider).lastGoodIndex.size).toBe(1);
      expect(
        parts(provider).lastGoodIndex.has(
          buildLastGoodKey('old/server', '0.1.0'),
        ),
      ).toBe(false);
    });
  });
});
