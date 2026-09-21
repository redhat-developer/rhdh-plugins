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

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { McpRegistryEntityProvider } from './McpRegistryEntityProvider';
import type { SchedulerServiceTaskRunner } from '@backstage/backend-plugin-api';
import type { EntityProviderConnection } from '@backstage/plugin-catalog-node';
import type { McpRegistryListResponse } from './client';
import {
  createDefaultConfig,
  createMockLogger,
  createMockServerDoc,
  mockFetchForResponses,
} from './testUtils';

function createMockConnection(): EntityProviderConnection {
  return {
    applyMutation: jest.fn(),
    refresh: jest.fn(),
  } as unknown as EntityProviderConnection;
}

describe('McpRegistryEntityProvider', () => {
  it('returns provider name mcp-registry-provider', () => {
    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      createMockLogger(),
    );
    expect(provider.getProviderName()).toBe('mcp-registry-provider');
  });

  it('applies documented defaults when optional config fields are omitted', () => {
    const provider = new McpRegistryEntityProvider(
      {
        baseUrl: 'https://registry.example.com',
        schedule: {
          frequency: { minutes: 30 },
          timeout: { minutes: 3 },
        },
      },
      createMockLogger(),
    );

    const resolved = (
      provider as unknown as {
        config: {
          apiVersion: string;
          pageLimit: number;
          maxEntries: number;
          remotesOnly: boolean;
          latestVersion: boolean;
        };
      }
    ).config;

    expect(resolved.apiVersion).toBe('v1');
    expect(resolved.pageLimit).toBe(10);
    expect(resolved.maxEntries).toBe(5000);
    expect(resolved.remotesOnly).toBe(false);
    expect(resolved.latestVersion).toBe(false);
  });

  it('registers the refresh task from connect after the catalog connection exists', async () => {
    const body: McpRegistryListResponse = {
      servers: [],
      metadata: { count: 0 },
    };
    const fetchFn = mockFetchForResponses([body]);
    const connection = createMockConnection();
    let scheduled: (() => Promise<void>) | undefined;
    const taskRunner = {
      run: jest.fn(async ({ fn }: { fn: () => Promise<void> }) => {
        scheduled = fn;
      }),
    } as unknown as SchedulerServiceTaskRunner & {
      run: jest.Mock;
    };

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      createMockLogger(),
      { fetchApi: fetchFn, taskRunner },
    );
    await provider.connect(connection);

    expect(taskRunner.run).toHaveBeenCalledTimes(1);
    expect(scheduled).toBeDefined();
    await scheduled!();
    expect(connection.applyMutation).toHaveBeenCalledTimes(1);
  });

  it('throws if run() is called before connect()', async () => {
    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      createMockLogger(),
    );
    await expect(provider.run()).rejects.toThrow(/not initialized/);
  });

  it('applies full mutation with mapped entities', async () => {
    const body: McpRegistryListResponse = {
      servers: [
        { server: createMockServerDoc('io.github.user/weather', '1.0.0') },
      ],
      metadata: { count: 1 },
    };
    const fetchFn = mockFetchForResponses([body]);
    const connection = createMockConnection();
    const logger = createMockLogger();

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      logger,
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);
    await provider.run();

    expect(connection.applyMutation).toHaveBeenCalledTimes(1);
    const mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    expect(mutation.type).toBe('full');
    expect(mutation.entities).toHaveLength(1);

    const entity = mutation.entities[0];
    expect(entity.locationKey).toBe('mcp-registry-provider');
    expect(entity.entity.kind).toBe('API');
    expect(entity.entity.spec.type).toBe('mcp-server');
    expect(
      entity.entity.metadata.annotations['backstage.io/managed-by-location'],
    ).toBe('url:https://registry.example.com');
    expect(
      entity.entity.metadata.annotations[
        'backstage.io/managed-by-origin-location'
      ],
    ).toBe('url:https://registry.example.com');
    expect(
      entity.entity.metadata.annotations[
        'redhat.com/rhdh-mcp-registry-sync-status'
      ],
    ).toBe('ok');
  });

  it('strips trailing slash from baseUrl in managed-by-location', async () => {
    const body: McpRegistryListResponse = {
      servers: [
        { server: createMockServerDoc('io.github.user/weather', '1.0.0') },
      ],
      metadata: { count: 1 },
    };
    const fetchFn = mockFetchForResponses([body]);
    const connection = createMockConnection();

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig({ baseUrl: 'https://registry.example.com/' }),
      createMockLogger(),
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);
    await provider.run();

    const mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    expect(
      mutation.entities[0].entity.metadata.annotations[
        'backstage.io/managed-by-location'
      ],
    ).toBe('url:https://registry.example.com');
    expect(
      mutation.entities[0].entity.metadata.annotations[
        'backstage.io/managed-by-origin-location'
      ],
    ).toBe('url:https://registry.example.com');
  });

  it('passes defaultOwner to the mapping', async () => {
    const body: McpRegistryListResponse = {
      servers: [
        { server: createMockServerDoc('io.github.user/weather', '1.0.0') },
      ],
      metadata: { count: 1 },
    };
    const fetchFn = mockFetchForResponses([body]);
    const connection = createMockConnection();

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig({
        defaultOwner: 'group:default/mcp-admins',
      }),
      createMockLogger(),
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);
    await provider.run();

    const mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    expect(mutation.entities[0].entity.spec.owner).toBe(
      'group:default/mcp-admins',
    );
  });

  it('passes defaultLifecycle to the mapping', async () => {
    const body: McpRegistryListResponse = {
      servers: [
        { server: createMockServerDoc('io.github.user/weather', '1.0.0') },
      ],
      metadata: { count: 1 },
    };
    const fetchFn = mockFetchForResponses([body]);
    const connection = createMockConnection();

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig({
        defaultLifecycle: 'experimental',
      }),
      createMockLogger(),
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);
    await provider.run();

    const mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    expect(mutation.entities[0].entity.spec.lifecycle).toBe('experimental');
  });

  it('uses mapping default owner when defaultOwner is omitted', async () => {
    const body: McpRegistryListResponse = {
      servers: [
        { server: createMockServerDoc('io.github.user/weather', '1.0.0') },
      ],
      metadata: { count: 1 },
    };
    const fetchFn = mockFetchForResponses([body]);
    const connection = createMockConnection();

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      createMockLogger(),
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);
    await provider.run();

    const mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    expect(mutation.entities[0].entity.spec.owner).toBe('unknown');
  });

  it('uses mapping default lifecycle when defaultLifecycle is omitted', async () => {
    const body: McpRegistryListResponse = {
      servers: [
        { server: createMockServerDoc('io.github.user/weather', '1.0.0') },
      ],
      metadata: { count: 1 },
    };
    const fetchFn = mockFetchForResponses([body]);
    const connection = createMockConnection();

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      createMockLogger(),
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);
    await provider.run();

    const mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    expect(mutation.entities[0].entity.spec.lifecycle).toBe('production');
  });

  it('passes baseName as prefix override to the mapping', async () => {
    const body: McpRegistryListResponse = {
      servers: [
        { server: createMockServerDoc('io.github.user/weather', '1.0.2') },
      ],
      metadata: { count: 1 },
    };
    const fetchFn = mockFetchForResponses([body]);
    const connection = createMockConnection();

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig({ baseName: 'com.example.registry' }),
      createMockLogger(),
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);
    await provider.run();

    const mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    // The metadata.name should use the baseName prefix
    expect(mutation.entities[0].entity.metadata.name).toContain(
      'com.example.registry',
    );
  });

  it('uses mapping default prefix when baseName is omitted', async () => {
    const body: McpRegistryListResponse = {
      servers: [
        { server: createMockServerDoc('io.github.user/weather', '1.0.2') },
      ],
      metadata: { count: 1 },
    };
    const fetchFn = mockFetchForResponses([body]);
    const connection = createMockConnection();

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      createMockLogger(),
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);
    await provider.run();

    const mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    // The metadata.name should use default prefix mcp.registry
    expect(mutation.entities[0].entity.metadata.name).toContain('mcp.registry');
  });

  it('does not emit mutation on registry fetch error', async () => {
    const fetchFn = jest.fn().mockRejectedValueOnce(new Error('network'));
    const connection = createMockConnection();
    const logger = createMockLogger();

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      logger,
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);
    await provider.run();

    expect(connection.applyMutation).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('resumes pagination across syncs and mutates only when complete', async () => {
    const page1: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('io.github.user/one', '1.0.0') }],
      metadata: { count: 2, nextCursor: 'cursor-1' },
    };
    const page2: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('io.github.user/two', '2.0.0') }],
      metadata: { count: 2 },
    };
    const fetchFn = mockFetchForResponses([page1, page2]);
    const connection = createMockConnection();
    const logger = createMockLogger();

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig({ pageLimit: 1 }),
      logger,
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);

    await provider.run();
    expect(connection.applyMutation).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('will resume from the saved cursor'),
    );

    await provider.run();
    expect(connection.applyMutation).toHaveBeenCalledTimes(1);
    const mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    expect(mutation.entities).toHaveLength(2);
    expect(fetchFn.mock.calls[1][0] as string).toContain('cursor=cursor-1');
  });

  it('continues sync when one entry fails mapping', async () => {
    const body: McpRegistryListResponse = {
      servers: [
        { server: createMockServerDoc('io.github.user/good', '1.0.0') },
        {
          server: {
            // Missing required fields - will fail mapping
            $schema:
              'https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json',
            name: '',
            description: '',
            version: '',
          } as any,
        },
      ],
      metadata: { count: 2 },
    };
    const fetchFn = mockFetchForResponses([body]);
    const connection = createMockConnection();
    const logger = createMockLogger();

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      logger,
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);
    await provider.run();

    expect(connection.applyMutation).toHaveBeenCalledTimes(1);
    const mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    // Only the good server should be in the mutation
    expect(mutation.entities).toHaveLength(1);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('retains last-good entity with degraded status on mapping failure', async () => {
    const goodBody: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server', '1.0.0') }],
      metadata: { count: 1 },
    };

    const badBody: McpRegistryListResponse = {
      servers: [
        {
          server: {
            $schema:
              'https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json',
            name: 'test/server',
            description: '',
            version: '1.0.0',
          } as any,
        },
      ],
      metadata: { count: 1 },
    };

    // Use a single provider with a combined fetch mock that returns
    // good data first, then bad data on the second sync
    const combinedFetch = jest.fn();
    // First sync
    combinedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => goodBody,
      text: async () => JSON.stringify(goodBody),
    } as unknown as Response);
    // Second sync
    combinedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => badBody,
      text: async () => JSON.stringify(badBody),
    } as unknown as Response);

    const connection2 = createMockConnection();
    const logger2 = createMockLogger();
    const provider2 = new McpRegistryEntityProvider(
      createDefaultConfig(),
      logger2,
      { fetchApi: combinedFetch },
    );
    await provider2.connect(connection2);

    // First sync: populates last-good index
    await provider2.run();
    expect(connection2.applyMutation).toHaveBeenCalledTimes(1);

    // Second sync: mapping fails, should retain last-good
    await provider2.run();
    expect(connection2.applyMutation).toHaveBeenCalledTimes(2);

    const secondMutation = (connection2.applyMutation as jest.Mock).mock
      .calls[1][0];
    expect(secondMutation.entities).toHaveLength(1);
    expect(
      secondMutation.entities[0].entity.metadata.annotations[
        'redhat.com/rhdh-mcp-registry-sync-status'
      ],
    ).toBe('degraded');
    expect(secondMutation.entities[0].locationKey).toBe(
      'mcp-registry-provider',
    );
  });

  it('omits entry on first-time mapping failure with no last-good', async () => {
    const body: McpRegistryListResponse = {
      servers: [
        {
          server: {
            $schema:
              'https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json',
            name: 'test/new-server',
            description: '',
            version: '1.0.0',
          } as any,
        },
      ],
      metadata: { count: 1 },
    };
    const fetchFn = mockFetchForResponses([body]);
    const connection = createMockConnection();
    const logger = createMockLogger();

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      logger,
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);
    await provider.run();

    const mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    expect(mutation.entities).toHaveLength(0);
  });

  it('prunes removed servers via full mutation', async () => {
    // Use a single provider for both syncs
    const body1: McpRegistryListResponse = {
      servers: [
        { server: createMockServerDoc('test/server-a', '1.0.0') },
        { server: createMockServerDoc('test/server-b', '1.0.0') },
      ],
      metadata: { count: 2 },
    };
    const body2: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-a', '1.0.0') }],
      metadata: { count: 1 },
    };
    const combinedFetch = jest.fn();
    combinedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => body1,
      text: async () => JSON.stringify(body1),
    } as unknown as Response);
    combinedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => body2,
      text: async () => JSON.stringify(body2),
    } as unknown as Response);

    const connection = createMockConnection();
    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      createMockLogger(),
      { fetchApi: combinedFetch },
    );
    await provider.connect(connection);

    // First sync: 2 servers
    await provider.run();
    let mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    expect(mutation.entities).toHaveLength(2);

    // Second sync: 1 server (server-b pruned by full mutation)
    await provider.run();
    mutation = (connection.applyMutation as jest.Mock).mock.calls[1][0];
    expect(mutation.type).toBe('full');
    expect(mutation.entities).toHaveLength(1);
  });

  it('handles multi-page sync with correct entity count', async () => {
    const page1: McpRegistryListResponse = {
      servers: [
        { server: createMockServerDoc('test/server-a', '1.0.0') },
        { server: createMockServerDoc('test/server-b', '1.0.0') },
      ],
      metadata: { count: 4, nextCursor: 'page2' },
    };
    const page2: McpRegistryListResponse = {
      servers: [
        { server: createMockServerDoc('test/server-c', '1.0.0') },
        { server: createMockServerDoc('test/server-d', '1.0.0') },
      ],
      metadata: { count: 4 },
    };
    const fetchFn = mockFetchForResponses([page1, page2]);
    const connection = createMockConnection();

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      createMockLogger(),
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);
    await provider.run();

    const mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    expect(mutation.entities).toHaveLength(4);
  });

  it('reflects updated server.json in the current mutation', async () => {
    const body: McpRegistryListResponse = {
      servers: [
        {
          server: createMockServerDoc('io.github.user/weather', '1.0.0', {
            description: 'Updated weather description',
          }),
        },
      ],
      metadata: { count: 1 },
    };
    const fetchFn = mockFetchForResponses([body]);
    const connection = createMockConnection();

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      createMockLogger(),
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);
    await provider.run();

    const mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    expect(mutation.entities[0].entity.metadata.description).toBe(
      'Updated weather description',
    );
  });

  it('commits full mutation with empty entities for empty registry', async () => {
    const body: McpRegistryListResponse = {
      servers: [],
      metadata: { count: 0 },
    };
    const fetchFn = mockFetchForResponses([body]);
    const connection = createMockConnection();

    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      createMockLogger(),
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);
    await provider.run();

    expect(connection.applyMutation).toHaveBeenCalledTimes(1);
    const mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    expect(mutation.type).toBe('full');
    expect(mutation.entities).toHaveLength(0);
  });

  it('does not update lastGoodIndex when applyMutation throws', async () => {
    const goodBody: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server', '1.0.0') }],
      metadata: { count: 1 },
    };

    const badBody: McpRegistryListResponse = {
      servers: [
        {
          server: {
            $schema:
              'https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json',
            name: 'test/server',
            description: '',
            version: '1.0.0',
          } as any,
        },
      ],
      metadata: { count: 1 },
    };

    const combinedFetch = jest.fn();
    // First sync — succeeds and populates last-good index
    combinedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => goodBody,
      text: async () => JSON.stringify(goodBody),
    } as unknown as Response);
    // Second sync — good data, but applyMutation will throw
    combinedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => goodBody,
      text: async () => JSON.stringify(goodBody),
    } as unknown as Response);
    // Third sync — mapping fails, should still use last-good from first sync
    combinedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => badBody,
      text: async () => JSON.stringify(badBody),
    } as unknown as Response);

    const connection = createMockConnection();
    const logger = createMockLogger();
    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      logger,
      { fetchApi: combinedFetch },
    );
    await provider.connect(connection);

    // First sync — succeeds, populates last-good
    await provider.run();
    expect(connection.applyMutation).toHaveBeenCalledTimes(1);

    // Second sync — applyMutation throws
    (connection.applyMutation as jest.Mock).mockRejectedValueOnce(
      new Error('catalog unavailable'),
    );
    await expect(provider.run()).rejects.toThrow('catalog unavailable');

    // Third sync — mapping fails; last-good should still be available
    // from the first sync (applyMutation throw did not update the index)
    (connection.applyMutation as jest.Mock).mockResolvedValueOnce(undefined);
    await provider.run();
    expect(connection.applyMutation).toHaveBeenCalledTimes(3);

    const thirdMutation = (connection.applyMutation as jest.Mock).mock
      .calls[2][0];
    expect(thirdMutation.entities).toHaveLength(1);
    expect(
      thirdMutation.entities[0].entity.metadata.annotations[
        'redhat.com/rhdh-mcp-registry-sync-status'
      ],
    ).toBe('degraded');
  });

  it('leaves seenCursors unchanged on fetch error so the next sync resumes correctly', async () => {
    // First sync: page 1 succeeds, page 2 fails mid-pagination
    const page1: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('io.github.user/one', '1.0.0') }],
      metadata: { count: 3, nextCursor: 'cursor-1' },
    };
    // Second page fails (non-2xx)
    const failPage = {
      ok: false,
      status: 500,
      url: '',
      headers: { get: () => null },
      json: async () => ({}),
      text: async () => 'Internal Server Error',
    } as unknown as Response;
    // Retry sync: page 1 again, then page 2 succeeds
    const retryPage1: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('io.github.user/one', '1.0.0') }],
      metadata: { count: 3, nextCursor: 'cursor-1' },
    };
    const retryPage2: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('io.github.user/two', '2.0.0') }],
      metadata: { count: 3 },
    };

    const combinedFetch = jest.fn();
    // First sync: page 1 ok, page 2 fails
    combinedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => page1,
      text: async () => JSON.stringify(page1),
    } as unknown as Response);
    combinedFetch.mockResolvedValueOnce(failPage);
    // Retry sync: both pages ok
    combinedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => retryPage1,
      text: async () => JSON.stringify(retryPage1),
    } as unknown as Response);
    combinedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => retryPage2,
      text: async () => JSON.stringify(retryPage2),
    } as unknown as Response);

    const connection = createMockConnection();
    const logger = createMockLogger();
    const provider = new McpRegistryEntityProvider(
      createDefaultConfig({ pageLimit: 10 }),
      logger,
      { fetchApi: combinedFetch },
    );
    await provider.connect(connection);

    // First sync: fails mid-pagination (provider keeps prior seenCursors)
    await provider.run();
    expect(connection.applyMutation).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('sync failed'),
    );

    // Retry sync: should succeed because the failed call did not
    // assign result.seenCursors, so cursor-1 is not incorrectly marked
    await provider.run();
    expect(connection.applyMutation).toHaveBeenCalledTimes(1);
    const mutation = (connection.applyMutation as jest.Mock).mock.calls[0][0];
    expect(mutation.entities).toHaveLength(2);
  });

  it('keeps re-adding degraded entities on subsequent syncs until refreshed', async () => {
    const goodBody: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server', '1.0.0') }],
      metadata: { count: 1 },
    };

    const badBody: McpRegistryListResponse = {
      servers: [
        {
          server: {
            $schema:
              'https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json',
            name: 'test/server',
            description: '',
            version: '1.0.0',
          } as any,
        },
      ],
      metadata: { count: 1 },
    };

    const combinedFetch = jest.fn();
    // First sync — succeeds
    combinedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => goodBody,
      text: async () => JSON.stringify(goodBody),
    } as unknown as Response);
    // Second and third syncs — mapping fails; degraded last-good is re-added
    combinedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => badBody,
      text: async () => JSON.stringify(badBody),
    } as unknown as Response);
    combinedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => badBody,
      text: async () => JSON.stringify(badBody),
    } as unknown as Response);
    // Fourth sync — mapping succeeds again
    combinedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => goodBody,
      text: async () => JSON.stringify(goodBody),
    } as unknown as Response);

    const connection = createMockConnection();
    const provider = new McpRegistryEntityProvider(
      createDefaultConfig(),
      createMockLogger(),
      { fetchApi: combinedFetch },
    );
    await provider.connect(connection);

    await provider.run();
    await provider.run();
    await provider.run();
    await provider.run();

    expect(connection.applyMutation).toHaveBeenCalledTimes(4);
    const secondMutation = (connection.applyMutation as jest.Mock).mock
      .calls[1][0];
    const thirdMutation = (connection.applyMutation as jest.Mock).mock
      .calls[2][0];
    const fourthMutation = (connection.applyMutation as jest.Mock).mock
      .calls[3][0];

    expect(secondMutation.entities).toHaveLength(1);
    expect(
      secondMutation.entities[0].entity.metadata.annotations?.[
        'redhat.com/rhdh-mcp-registry-sync-status'
      ],
    ).toBe('degraded');
    expect(thirdMutation.entities).toHaveLength(1);
    expect(
      thirdMutation.entities[0].entity.metadata.annotations?.[
        'redhat.com/rhdh-mcp-registry-sync-status'
      ],
    ).toBe('degraded');
    expect(fourthMutation.entities).toHaveLength(1);
    expect(
      fourthMutation.entities[0].entity.metadata.annotations?.[
        'redhat.com/rhdh-mcp-registry-sync-status'
      ],
    ).toBe('ok');
  });

  it('retains last-good as degraded when maxEntries soft-stop drops a previously synced seed server after a listing shift', async () => {
    const seedDocs = JSON.parse(
      readFileSync(
        resolve(
          __dirname,
          '../../../examples/mcp-registry/seed-data/seed.json',
        ),
        'utf8',
      ),
    ) as Array<{ name: string; version: string }>;

    expect(seedDocs).toHaveLength(4);
    const [atlas, workspaceFs, diceWeather, remoteWorkspace] = seedDocs;
    const inserted = createMockServerDoc('io.example.labs/new-front', '0.1.0');

    // pageSize=1 so maxEntries=3 soft-stops after three servers and
    // saves an end cursor at the fourth page's request cursor.
    const firstPassPages: McpRegistryListResponse[] = [
      {
        servers: [{ server: atlas as any }],
        metadata: { count: 4, nextCursor: 'cursor-1' },
      },
      {
        servers: [{ server: workspaceFs as any }],
        metadata: { count: 4, nextCursor: 'cursor-2' },
      },
      {
        servers: [{ server: diceWeather as any }],
        metadata: { count: 4, nextCursor: 'cursor-3' },
      },
      {
        servers: [{ server: remoteWorkspace as any }],
        metadata: { count: 4, nextCursor: 'cursor-4' },
      },
    ];

    // New entry at the front shifts listings; traversal still stops at
    // endCursor cursor-3, so dice-weather falls out of the window.
    const secondPassPages: McpRegistryListResponse[] = [
      {
        servers: [{ server: inserted }],
        metadata: { count: 5, nextCursor: 'cursor-1' },
      },
      {
        servers: [{ server: atlas as any }],
        metadata: { count: 5, nextCursor: 'cursor-2' },
      },
      {
        servers: [{ server: workspaceFs as any }],
        metadata: { count: 5, nextCursor: 'cursor-3' },
      },
    ];

    const fetchFn = mockFetchForResponses([
      ...firstPassPages,
      ...secondPassPages,
      ...secondPassPages,
    ]);
    const connection = createMockConnection();
    const logger = createMockLogger();
    const provider = new McpRegistryEntityProvider(
      createDefaultConfig({
        maxEntries: 3,
        pageSize: 1,
        pageLimit: 10,
        defaultOwner: 'default-owner',
      }),
      logger,
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);

    await provider.run();
    expect(connection.applyMutation).toHaveBeenCalledTimes(1);
    const firstMutation = (connection.applyMutation as jest.Mock).mock
      .calls[0][0];
    const firstNames = firstMutation.entities.map(
      (d: { entity: { metadata: { annotations?: Record<string, string> } } }) =>
        d.entity.metadata.annotations?.['modelcontextprotocol.io/name'],
    );
    expect(firstNames).toEqual([
      atlas.name,
      workspaceFs.name,
      diceWeather.name,
    ]);
    expect(
      firstMutation.entities.every(
        (d: {
          entity: { metadata: { annotations?: Record<string, string> } };
        }) =>
          d.entity.metadata.annotations?.[
            'redhat.com/rhdh-mcp-registry-sync-status'
          ] === 'ok',
      ),
    ).toBe(true);

    await provider.run();
    expect(connection.applyMutation).toHaveBeenCalledTimes(2);
    const secondMutation = (connection.applyMutation as jest.Mock).mock
      .calls[1][0];
    const secondByName = new Map(
      secondMutation.entities.map(
        (d: {
          entity: { metadata: { annotations?: Record<string, string> } };
        }) => [
          d.entity.metadata.annotations?.['modelcontextprotocol.io/name'],
          d.entity.metadata.annotations?.[
            'redhat.com/rhdh-mcp-registry-sync-status'
          ],
        ],
      ),
    );

    expect(secondByName.get(inserted.name)).toBe('ok');
    expect(secondByName.get(atlas.name)).toBe('ok');
    expect(secondByName.get(workspaceFs.name)).toBe('ok');
    expect(secondByName.get(diceWeather.name)).toBe('degraded');
    expect(secondByName.has(remoteWorkspace.name)).toBe(false);
    expect(secondMutation.entities).toHaveLength(4);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('degraded entries'),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(diceWeather.name),
    );

    // Third sync: still outside the window — degraded must be re-added.
    await provider.run();
    expect(connection.applyMutation).toHaveBeenCalledTimes(3);
    const thirdMutation = (connection.applyMutation as jest.Mock).mock
      .calls[2][0];
    const thirdByName = new Map(
      thirdMutation.entities.map(
        (d: {
          entity: { metadata: { annotations?: Record<string, string> } };
        }) => [
          d.entity.metadata.annotations?.['modelcontextprotocol.io/name'],
          d.entity.metadata.annotations?.[
            'redhat.com/rhdh-mcp-registry-sync-status'
          ],
        ],
      ),
    );
    expect(thirdMutation.entities).toHaveLength(4);
    expect(thirdByName.get(diceWeather.name)).toBe('degraded');
  });

  it('retains last-good as degraded on formatting/mapping failure while maxEntries soft-stop is active', async () => {
    const seedDocs = JSON.parse(
      readFileSync(
        resolve(
          __dirname,
          '../../../examples/mcp-registry/seed-data/seed.json',
        ),
        'utf8',
      ),
    ) as Array<{ name: string; version: string }>;

    const [atlas, workspaceFs, diceWeather, remoteWorkspace] = seedDocs;

    const firstPassPages: McpRegistryListResponse[] = [
      {
        servers: [{ server: atlas as any }],
        metadata: { count: 4, nextCursor: 'cursor-1' },
      },
      {
        servers: [{ server: workspaceFs as any }],
        metadata: { count: 4, nextCursor: 'cursor-2' },
      },
      {
        servers: [{ server: diceWeather as any }],
        metadata: { count: 4, nextCursor: 'cursor-3' },
      },
      {
        servers: [{ server: remoteWorkspace as any }],
        metadata: { count: 4, nextCursor: 'cursor-4' },
      },
    ];

    // Soft-stop window still covers atlas + workspace-fs + dice-weather,
    // but dice-weather's payload is now malformed so mapping fails.
    const malformedDice = {
      $schema:
        'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',
      name: diceWeather.name,
      description: '',
      version: diceWeather.version,
    };
    const secondPassPages: McpRegistryListResponse[] = [
      {
        servers: [{ server: atlas as any }],
        metadata: { count: 4, nextCursor: 'cursor-1' },
      },
      {
        servers: [{ server: workspaceFs as any }],
        metadata: { count: 4, nextCursor: 'cursor-2' },
      },
      {
        servers: [{ server: malformedDice as any }],
        metadata: { count: 4, nextCursor: 'cursor-3' },
      },
    ];

    const fetchFn = mockFetchForResponses([
      ...firstPassPages,
      ...secondPassPages,
    ]);
    const connection = createMockConnection();
    const provider = new McpRegistryEntityProvider(
      createDefaultConfig({
        maxEntries: 3,
        pageSize: 1,
        pageLimit: 10,
      }),
      createMockLogger(),
      { fetchApi: fetchFn },
    );
    await provider.connect(connection);

    await provider.run();
    await provider.run();

    const secondMutation = (connection.applyMutation as jest.Mock).mock
      .calls[1][0];
    const diceEntity = secondMutation.entities.find(
      (d: { entity: { metadata: { annotations?: Record<string, string> } } }) =>
        d.entity.metadata.annotations?.['modelcontextprotocol.io/name'] ===
        diceWeather.name,
    );
    expect(diceEntity).toBeDefined();
    expect(
      diceEntity.entity.metadata.annotations?.[
        'redhat.com/rhdh-mcp-registry-sync-status'
      ],
    ).toBe('degraded');
  });
});
