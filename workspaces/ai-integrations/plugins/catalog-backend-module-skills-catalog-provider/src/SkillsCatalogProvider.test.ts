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

import { mockServices } from '@backstage/backend-test-utils';
import type { EntityProviderConnection } from '@backstage/plugin-catalog-node';
import {
  validOciRecordFull,
  validOciRecordMinimal,
  ociSource,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type { SkillSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

import { SkillsCatalogProvider } from './SkillsCatalogProvider';
import type { SkillsCatalogProviderConfig } from './types';

const logger = mockServices.logger.mock();

// Mock global fetch
const originalFetch = global.fetch;
let mockFetch: jest.Mock;

beforeEach(() => {
  mockFetch = jest.fn();
  global.fetch = mockFetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

function makeConfig(
  overrides: Partial<SkillsCatalogProviderConfig> = {},
): SkillsCatalogProviderConfig {
  return {
    id: 'test',
    sources: [
      {
        connectorPluginId: 'skill-image-connector',
        sourceId: 'quay-public',
        sourceType: 'oci',
      },
    ],
    namespace: 'default',
    defaultOwner: 'team-skills',
    defaultLifecycle: 'production',
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<SkillSnapshot> = {}): SkillSnapshot {
  return {
    schemaVersion: '1',
    source: ociSource,
    status: 'ready',
    observedAt: '2025-01-15T10:00:00Z',
    skills: [validOciRecordFull, validOciRecordMinimal],
    failedSkillKeys: [],
    ...overrides,
  };
}

describe('SkillsCatalogProvider', () => {
  const mockDiscovery = {
    getBaseUrl: jest
      .fn()
      .mockResolvedValue('http://localhost:7007/api/skill-image-connector'),
    getExternalBaseUrl: jest.fn(),
  };

  const mockAuth = mockServices.auth.mock({
    getPluginRequestToken: jest.fn().mockResolvedValue({
      token: 'test-service-token',
    }),
    getOwnServiceCredentials: jest.fn().mockResolvedValue({
      principal: { subject: 'test' },
    }),
  });

  const mockConnection: EntityProviderConnection = {
    applyMutation: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the correct provider name', () => {
    const config = makeConfig();
    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      { run: jest.fn() },
    );
    expect(provider.getProviderName()).toBe('SkillsCatalogProvider:test');
  });

  it('resolves connector URL through discovery', async () => {
    const snapshot = makeSnapshot();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve(JSON.stringify(snapshot)),
    });

    const taskFn: { fn?: () => Promise<void> } = {};
    const mockTaskRunner = {
      run: jest.fn().mockImplementation(({ fn }) => {
        taskFn.fn = fn;
      }),
    };

    const config = makeConfig();
    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      mockTaskRunner,
    );

    await provider.connect(mockConnection);
    await taskFn.fn!();

    expect(mockDiscovery.getBaseUrl).toHaveBeenCalledWith(
      'skill-image-connector',
    );
  });

  it('obtains service token targeted to receiving plugin ID', async () => {
    const snapshot = makeSnapshot();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve(JSON.stringify(snapshot)),
    });

    const taskFn: { fn?: () => Promise<void> } = {};
    const mockTaskRunner = {
      run: jest.fn().mockImplementation(({ fn }) => {
        taskFn.fn = fn;
      }),
    };

    const config = makeConfig();
    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      mockTaskRunner,
    );

    await provider.connect(mockConnection);
    await taskFn.fn!();

    expect(mockAuth.getPluginRequestToken).toHaveBeenCalledWith({
      onBehalfOf: expect.anything(),
      targetPluginId: 'skill-image-connector',
    });
  });

  it('applies full mutation with source-scoped location key', async () => {
    const snapshot = makeSnapshot({
      skills: [validOciRecordFull],
    });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve(JSON.stringify(snapshot)),
    });

    const taskFn: { fn?: () => Promise<void> } = {};
    const mockTaskRunner = {
      run: jest.fn().mockImplementation(({ fn }) => {
        taskFn.fn = fn;
      }),
    };

    const config = makeConfig();
    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      mockTaskRunner,
    );

    await provider.connect(mockConnection);
    await taskFn.fn!();

    expect(mockConnection.applyMutation).toHaveBeenCalledWith({
      type: 'full',
      entities: expect.arrayContaining([
        expect.objectContaining({
          locationKey: 'skills-catalog-provider:test:oci:quay-public',
          entity: expect.objectContaining({
            kind: 'AiResource',
          }),
        }),
      ]),
    });
  });

  it('does not call applyMutation when source returns loading status', async () => {
    const snapshot = makeSnapshot({ status: 'loading', skills: [] });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve(JSON.stringify(snapshot)),
    });

    const taskFn: { fn?: () => Promise<void> } = {};
    const mockTaskRunner = {
      run: jest.fn().mockImplementation(({ fn }) => {
        taskFn.fn = fn;
      }),
    };

    const config = makeConfig();
    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      mockTaskRunner,
    );

    await provider.connect(mockConnection);
    await taskFn.fn!();

    expect(mockConnection.applyMutation).not.toHaveBeenCalled();
  });

  it('does not call applyMutation when source returns failed status', async () => {
    const snapshot = makeSnapshot({ status: 'failed', skills: [] });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve(JSON.stringify(snapshot)),
    });

    const taskFn: { fn?: () => Promise<void> } = {};
    const mockTaskRunner = {
      run: jest.fn().mockImplementation(({ fn }) => {
        taskFn.fn = fn;
      }),
    };

    const config = makeConfig();
    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      mockTaskRunner,
    );

    await provider.connect(mockConnection);
    await taskFn.fn!();

    expect(mockConnection.applyMutation).not.toHaveBeenCalled();
  });

  it('applies mutation only for ready source when another returns loading', async () => {
    const config = makeConfig({
      sources: [
        {
          connectorPluginId: 'skill-image-connector',
          sourceId: 'quay-public',
          sourceType: 'oci',
        },
        {
          connectorPluginId: 'npx-skill-connector',
          sourceId: 'npx-source',
          sourceType: 'npx',
        },
      ],
    });

    const readySnapshot = makeSnapshot({ skills: [validOciRecordFull] });
    const loadingSnapshot = makeSnapshot({
      source: { id: 'npx-source', type: 'npx' },
      status: 'loading',
      skills: [],
    });

    mockDiscovery.getBaseUrl
      .mockResolvedValueOnce('http://localhost:7007/api/skill-image-connector')
      .mockResolvedValueOnce('http://localhost:7007/api/npx-skill-connector');

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify(readySnapshot)),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify(loadingSnapshot)),
      });

    const taskFn: { fn?: () => Promise<void> } = {};
    const mockTaskRunner = {
      run: jest.fn().mockImplementation(({ fn }) => {
        taskFn.fn = fn;
      }),
    };

    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      mockTaskRunner,
    );

    await provider.connect(mockConnection);
    await taskFn.fn!();

    // Only the ready source should have its mutation applied
    expect(mockConnection.applyMutation).toHaveBeenCalledTimes(1);
    expect(mockConnection.applyMutation).toHaveBeenCalledWith({
      type: 'full',
      entities: expect.arrayContaining([
        expect.objectContaining({
          locationKey: 'skills-catalog-provider:test:oci:quay-public',
        }),
      ]),
    });
  });

  it('continues processing other sources when one fails', async () => {
    const config = makeConfig({
      sources: [
        {
          connectorPluginId: 'failing-connector',
          sourceId: 'failing-source',
          sourceType: 'oci',
        },
        {
          connectorPluginId: 'skill-image-connector',
          sourceId: 'quay-public',
          sourceType: 'oci',
        },
      ],
    });

    // First source fails discovery, second succeeds
    mockDiscovery.getBaseUrl
      .mockRejectedValueOnce(new Error('Plugin not found'))
      .mockResolvedValueOnce('http://localhost:7007/api/skill-image-connector');

    const snapshot = makeSnapshot({
      skills: [validOciRecordFull],
    });
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: () => Promise.resolve(JSON.stringify(snapshot)),
    });

    const taskFn: { fn?: () => Promise<void> } = {};
    const mockTaskRunner = {
      run: jest.fn().mockImplementation(({ fn }) => {
        taskFn.fn = fn;
      }),
    };

    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      mockTaskRunner,
    );

    await provider.connect(mockConnection);
    await taskFn.fn!();

    // Only the successful source should have its mutation applied.
    // The failed source must NOT get an empty full mutation (which
    // would wipe its previously-existing entities).
    expect(mockConnection.applyMutation).toHaveBeenCalledTimes(1);
    expect(mockConnection.applyMutation).toHaveBeenCalledWith({
      type: 'full',
      entities: expect.arrayContaining([
        expect.objectContaining({
          locationKey: 'skills-catalog-provider:test:oci:quay-public',
          entity: expect.objectContaining({
            kind: 'AiResource',
          }),
        }),
      ]),
    });
  });
});
