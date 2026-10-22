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
  computeCatalogName,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type { SkillSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

import { SkillsCatalogProvider } from './SkillsCatalogProvider';
import type { PendingDelta, ReconciliationStore } from './reconciliation-store';
import type {
  CommittedSourceState,
  SkillsCatalogProviderConfig,
} from './types';

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

/**
 * Creates a mock ReconciliationStore with in-memory state for testing.
 */
function createMockStore(): ReconciliationStore & {
  committedStates: Map<string, CommittedSourceState>;
} {
  const committedStates = new Map<string, CommittedSourceState>();
  const pendingDeltas = new Map<string, PendingDelta>();

  return {
    committedStates,
    initialize: jest.fn().mockResolvedValue(undefined),
    getCommittedState: jest.fn().mockImplementation((sourceType, sourceId) => {
      const key = `${sourceType}:${sourceId}`;
      return Promise.resolve(
        committedStates.get(key) ?? {
          sourceType,
          sourceId,
          observedAt: null,
          entities: [],
        },
      );
    }),
    getAllCommittedStates: jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve(Array.from(committedStates.values())),
      ),
    getPendingDelta: jest.fn().mockImplementation((sourceType, sourceId) => {
      const key = `${sourceType}:${sourceId}`;
      return Promise.resolve(pendingDeltas.get(key));
    }),
    getAllPendingDeltas: jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve(Array.from(pendingDeltas.values())),
      ),
    savePendingDelta: jest.fn().mockImplementation(delta => {
      const key = `${delta.sourceType}:${delta.sourceId}`;
      pendingDeltas.set(key, delta);
      return Promise.resolve();
    }),
    commitStateAndClearPending: jest
      .fn()
      .mockImplementation((sourceType, sourceId, nextState) => {
        const stateKey = `${sourceType}:${sourceId}`;
        committedStates.set(stateKey, nextState);
        pendingDeltas.delete(stateKey);
        return Promise.resolve();
      }),
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
    const store = createMockStore();
    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      { run: jest.fn() },
      store,
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
    const store = createMockStore();
    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      mockTaskRunner,
      store,
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
    const store = createMockStore();
    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      mockTaskRunner,
      store,
    );

    await provider.connect(mockConnection);
    await taskFn.fn!();

    expect(mockAuth.getPluginRequestToken).toHaveBeenCalledWith({
      onBehalfOf: expect.anything(),
      targetPluginId: 'skill-image-connector',
    });
  });

  it('applies delta mutation with source-scoped location key', async () => {
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
    const store = createMockStore();
    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      mockTaskRunner,
      store,
    );

    await provider.connect(mockConnection);
    await taskFn.fn!();

    expect(mockConnection.applyMutation).toHaveBeenCalledWith({
      type: 'delta',
      added: expect.arrayContaining([
        expect.objectContaining({
          locationKey: 'skills-catalog-provider:test:oci:quay-public',
          entity: expect.objectContaining({
            kind: 'AiResource',
          }),
        }),
      ]),
      removed: [],
    });
  });

  it('does not call applyMutation when source returns loading status', async () => {
    const snapshot = makeSnapshot({
      status: 'loading',
      skills: [],
      observedAt: null,
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
    const store = createMockStore();
    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      mockTaskRunner,
      store,
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
    const store = createMockStore();
    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      mockTaskRunner,
      store,
    );

    await provider.connect(mockConnection);
    await taskFn.fn!();

    expect(mockConnection.applyMutation).not.toHaveBeenCalled();
  });

  it('applies delta mutation for partial snapshot with upserts only', async () => {
    const snapshot = makeSnapshot({
      status: 'partial',
      skills: [validOciRecordFull],
      failedSkillKeys: ['quay.io/some/failed:latest'],
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
    const store = createMockStore();
    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      mockTaskRunner,
      store,
    );

    await provider.connect(mockConnection);
    await taskFn.fn!();

    // Partial status triggers a delta mutation with upserts only (no removals)
    expect(mockConnection.applyMutation).toHaveBeenCalledTimes(1);
    expect(mockConnection.applyMutation).toHaveBeenCalledWith({
      type: 'delta',
      added: expect.arrayContaining([
        expect.objectContaining({
          locationKey: 'skills-catalog-provider:test:oci:quay-public',
          entity: expect.objectContaining({
            kind: 'AiResource',
          }),
        }),
      ]),
      removed: [],
    });
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
      observedAt: null,
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

    const store = createMockStore();
    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      mockTaskRunner,
      store,
    );

    await provider.connect(mockConnection);
    await taskFn.fn!();

    // Only the ready source should have its mutation applied
    expect(mockConnection.applyMutation).toHaveBeenCalledTimes(1);
    expect(mockConnection.applyMutation).toHaveBeenCalledWith({
      type: 'delta',
      added: expect.arrayContaining([
        expect.objectContaining({
          locationKey: 'skills-catalog-provider:test:oci:quay-public',
        }),
      ]),
      removed: [],
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

    const store = createMockStore();
    const provider = new SkillsCatalogProvider(
      config,
      mockDiscovery,
      mockAuth,
      logger,
      mockTaskRunner,
      store,
    );

    await provider.connect(mockConnection);
    await taskFn.fn!();

    // Only the successful source should have its mutation applied
    expect(mockConnection.applyMutation).toHaveBeenCalledTimes(1);
    expect(mockConnection.applyMutation).toHaveBeenCalledWith({
      type: 'delta',
      added: expect.arrayContaining([
        expect.objectContaining({
          locationKey: 'skills-catalog-provider:test:oci:quay-public',
          entity: expect.objectContaining({
            kind: 'AiResource',
          }),
        }),
      ]),
      removed: [],
    });
  });

  describe('durable reconciliation', () => {
    it('persists committed state after successful mutation', async () => {
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
      const store = createMockStore();
      const provider = new SkillsCatalogProvider(
        config,
        mockDiscovery,
        mockAuth,
        logger,
        mockTaskRunner,
        store,
      );

      await provider.connect(mockConnection);
      await taskFn.fn!();

      // Verify committed state was persisted
      expect(store.commitStateAndClearPending).toHaveBeenCalledWith(
        'oci',
        'quay-public',
        expect.objectContaining({
          sourceType: 'oci',
          sourceId: 'quay-public',
          observedAt: '2025-01-15T10:00:00Z',
          entities: expect.arrayContaining([
            expect.objectContaining({
              tuple: {
                type: 'oci',
                id: 'quay-public',
                key: expect.any(String),
              },
              digest: expect.any(String),
            }),
          ]),
        }),
      );
    });

    it('saves pending delta before applying mutation', async () => {
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
      const store = createMockStore();
      const provider = new SkillsCatalogProvider(
        config,
        mockDiscovery,
        mockAuth,
        logger,
        mockTaskRunner,
        store,
      );

      await provider.connect(mockConnection);
      await taskFn.fn!();

      // Verify that savePendingDelta was called before applyMutation
      const saveCalls = (store.savePendingDelta as jest.Mock).mock
        .invocationCallOrder;
      const applyCalls = (mockConnection.applyMutation as jest.Mock).mock
        .invocationCallOrder;
      expect(saveCalls[0]).toBeLessThan(applyCalls[0]);
    });

    it('preserves entities on restart when source is loading', async () => {
      const tuple = {
        type: 'oci' as const,
        id: 'quay-public',
        key: 'quay.io/org/skill:v1',
      };
      const catalogName = computeCatalogName(tuple);

      const config = makeConfig();
      const store = createMockStore();

      // Simulate existing committed state from a previous run
      store.committedStates.set('oci:quay-public', {
        sourceType: 'oci',
        sourceId: 'quay-public',
        observedAt: '2025-01-14T10:00:00Z',
        entities: [
          {
            tuple,
            catalogName,
            digest:
              'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            entity: {
              apiVersion: 'backstage.io/v1alpha1',
              kind: 'AiResource',
              metadata: { name: catalogName, namespace: 'default' },
              spec: {
                type: 'skill',
                owner: 'team-skills',
                lifecycle: 'production',
              },
            },
          },
        ],
      });

      // Source returns loading
      const snapshot = makeSnapshot({
        status: 'loading',
        skills: [],
        observedAt: null,
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
        store,
      );

      await provider.connect(mockConnection);
      await taskFn.fn!();

      // No mutation applied — entities are preserved
      expect(mockConnection.applyMutation).not.toHaveBeenCalled();

      // Committed state still has the entity
      const committedState = store.committedStates.get('oci:quay-public');
      expect(committedState?.entities).toHaveLength(1);
    });

    it('removes previously owned entities absent from ready snapshot', async () => {
      const tuple = {
        type: 'oci' as const,
        id: 'quay-public',
        key: 'quay.io/org/skill:v1',
      };
      const catalogName = computeCatalogName(tuple);

      const config = makeConfig();
      const store = createMockStore();

      // Simulate existing committed state with one entity
      store.committedStates.set('oci:quay-public', {
        sourceType: 'oci',
        sourceId: 'quay-public',
        observedAt: '2025-01-14T10:00:00Z',
        entities: [
          {
            tuple,
            catalogName,
            digest:
              'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            entity: {
              apiVersion: 'backstage.io/v1alpha1',
              kind: 'AiResource',
              metadata: { name: catalogName, namespace: 'default' },
              spec: {
                type: 'skill',
                owner: 'team-skills',
                lifecycle: 'production',
              },
            },
          },
        ],
      });

      // Ready snapshot with no skills — should remove the entity
      const snapshot = makeSnapshot({
        skills: [],
        observedAt: '2025-01-15T10:00:00Z',
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
        store,
      );

      await provider.connect(mockConnection);
      await taskFn.fn!();

      // Delta mutation should have removals
      expect(mockConnection.applyMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'delta',
          added: [],
          removed: expect.arrayContaining([
            expect.objectContaining({
              locationKey: 'skills-catalog-provider:test:oci:quay-public',
              entityRef: `airesource:default/${catalogName}`,
            }),
          ]),
        }),
      );
    });

    it('retains absent entities on partial snapshot', async () => {
      const tupleA = {
        type: 'oci' as const,
        id: 'quay-public',
        key: 'quay.io/org/skill-a:v1',
      };
      const tupleB = {
        type: 'oci' as const,
        id: 'quay-public',
        key: 'quay.io/org/skill-b:v1',
      };
      const nameA = computeCatalogName(tupleA);
      const nameB = computeCatalogName(tupleB);

      const config = makeConfig();
      const store = createMockStore();

      // Simulate existing committed state with two entities
      store.committedStates.set('oci:quay-public', {
        sourceType: 'oci',
        sourceId: 'quay-public',
        observedAt: '2025-01-14T10:00:00Z',
        entities: [
          {
            tuple: tupleA,
            catalogName: nameA,
            digest:
              'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            entity: {
              apiVersion: 'backstage.io/v1alpha1',
              kind: 'AiResource',
              metadata: { name: nameA, namespace: 'default' },
              spec: {
                type: 'skill',
                owner: 'team-skills',
                lifecycle: 'production',
              },
            },
          },
          {
            tuple: tupleB,
            catalogName: nameB,
            digest:
              'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            entity: {
              apiVersion: 'backstage.io/v1alpha1',
              kind: 'AiResource',
              metadata: { name: nameB, namespace: 'default' },
              spec: {
                type: 'skill',
                owner: 'team-skills',
                lifecycle: 'production',
              },
            },
          },
        ],
      });

      // Partial snapshot with only one skill (skill-b is absent)
      const snapshot = makeSnapshot({
        status: 'partial',
        skills: [validOciRecordFull],
        failedSkillKeys: ['quay.io/org/skill-b:v1'],
        observedAt: '2025-01-15T10:00:00Z',
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
        store,
      );

      await provider.connect(mockConnection);
      await taskFn.fn!();

      // If a mutation was applied, it should have no removals (partial retention)
      const applyCalls = (mockConnection.applyMutation as jest.Mock).mock.calls;
      const removals = applyCalls.flatMap(
        (call: [{ removed?: unknown[] }]) => call[0].removed ?? [],
      );
      expect(removals).toHaveLength(0);

      // Committed state should still have both entities
      const committedState = store.committedStates.get('oci:quay-public');
      expect(committedState!.entities.length).toBeGreaterThanOrEqual(2);
    });

    it('replays pending delta on startup recovery', async () => {
      const tuple = {
        type: 'oci' as const,
        id: 'quay-public',
        key: 'quay.io/org/skill:v1',
      };
      const catalogName = computeCatalogName(tuple);
      const entity = {
        apiVersion: 'backstage.io/v1alpha1' as const,
        kind: 'AiResource',
        metadata: { name: catalogName, namespace: 'default' },
        spec: { type: 'skill', owner: 'team-skills', lifecycle: 'production' },
      };

      const config = makeConfig();
      const store = createMockStore();

      // Simulate a pending delta from a crashed run
      const pendingDelta = {
        sourceType: 'oci',
        sourceId: 'quay-public',
        upserts: [
          {
            tuple,
            catalogName,
            digest:
              'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            entity,
          },
        ],
        removals: [],
        nextState: {
          sourceType: 'oci' as const,
          sourceId: 'quay-public',
          observedAt: '2025-01-15T10:00:00Z',
          entities: [
            {
              tuple,
              catalogName,
              digest:
                'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
              entity,
            },
          ],
        },
      };

      // Set up the store to return the pending delta
      (store.getAllPendingDeltas as jest.Mock).mockResolvedValueOnce([
        pendingDelta,
      ]);

      // After replay, return empty pending list for the main refresh
      // The second call returns empty because commitStateAndClearPending clears it
      (store.getAllPendingDeltas as jest.Mock).mockResolvedValue([]);

      // Source returns same snapshot (recovery scenario)
      const snapshot = makeSnapshot({
        skills: [],
        observedAt: '2025-01-15T10:00:00Z',
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
        store,
      );

      await provider.connect(mockConnection);
      await taskFn.fn!();

      // The pending delta should have been replayed
      expect(mockConnection.applyMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'delta',
          added: expect.arrayContaining([
            expect.objectContaining({
              entity: expect.objectContaining({
                kind: 'AiResource',
              }),
            }),
          ]),
        }),
      );

      // And the state should have been committed
      expect(store.commitStateAndClearPending).toHaveBeenCalledWith(
        'oci',
        'quay-public',
        expect.objectContaining({
          sourceType: 'oci',
          sourceId: 'quay-public',
          observedAt: '2025-01-15T10:00:00Z',
        }),
      );
    });
  });
});
