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
import { stringifyEntityRef, type Entity } from '@backstage/catalog-model';
import type { EntityProviderConnection } from '@backstage/plugin-catalog-node';
import {
  validOciRecordFull,
  validOciRecordMinimal,
  ociSource,
  computeCatalogName,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type { SkillSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

import { SkillsCatalogProvider } from './SkillsCatalogProvider';
import type {
  PendingAcknowledgment,
  PendingDelta,
  ReconciliationStore,
} from './reconciliation-store';
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
  const pendingAcks = new Map<string, PendingAcknowledgment>();

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
    commitStateAndSaveAcknowledgment: jest
      .fn()
      .mockImplementation((sourceType, sourceId, nextState, ack) => {
        const stateKey = `${sourceType}:${sourceId}`;
        committedStates.set(stateKey, nextState);
        pendingDeltas.delete(stateKey);
        pendingAcks.set(stateKey, ack);
        return Promise.resolve();
      }),
    getPendingAcknowledgment: jest
      .fn()
      .mockImplementation((sourceType, sourceId) => {
        const key = `${sourceType}:${sourceId}`;
        return Promise.resolve(pendingAcks.get(key));
      }),
    getAllPendingAcknowledgments: jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve(Array.from(pendingAcks.values())),
      ),
    clearPendingAcknowledgment: jest
      .fn()
      .mockImplementation((sourceType, sourceId) => {
        pendingAcks.delete(`${sourceType}:${sourceId}`);
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

  const catalogApi = {
    getEntitiesByRefs: jest.fn(
      async ({ entityRefs }: { entityRefs: string[] }) => {
        const entities = new Map<string, Entity>();
        for (const [mutation] of (mockConnection.applyMutation as jest.Mock)
          .mock.calls) {
          for (const entry of mutation.added ?? [])
            entities.set(stringifyEntityRef(entry.entity), entry.entity);
          for (const entry of mutation.removed ?? [])
            entities.delete(
              entry.entityRef ?? stringifyEntityRef(entry.entity),
            );
        }
        return { items: entityRefs.map(ref => entities.get(ref)) };
      },
    ),
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
      catalogApi,
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
      catalogApi,
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
      catalogApi,
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
      catalogApi,
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
      catalogApi,
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
      catalogApi,
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
      catalogApi,
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
      catalogApi,
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
      catalogApi,
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
        catalogApi,
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
        catalogApi,
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
        catalogApi,
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
        catalogApi,
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
        key: validOciRecordFull.key,
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

      const absentBefore = structuredClone(
        store.committedStates.get('oci:quay-public')!.entities[1],
      );

      // Partial snapshot updates A while B is absent.
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
        catalogApi,
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
      expect(mockConnection.applyMutation).toHaveBeenCalledTimes(1);
      expect(committedState!.entities).toHaveLength(2);
      expect(
        committedState!.entities.map(entity => entity.catalogName).sort(),
      ).toEqual([nameA, nameB].sort());
      expect(
        committedState!.entities.find(entity => entity.catalogName === nameA)
          ?.digest,
      ).toBe(validOciRecordFull.digest);
      expect(
        committedState!.entities.find(entity => entity.catalogName === nameB),
      ).toEqual(absentBefore);
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
        catalogApi,
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

  describe('TechDocs acknowledgment (D8)', () => {
    it('persists acknowledgment after ready OCI reconciliation with revision', async () => {
      const snapshot = makeSnapshot({
        skills: [validOciRecordFull],
      });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'X-Skilldocs-Revision': '7' }),
        text: () => Promise.resolve(JSON.stringify(snapshot)),
      });

      // Mock the reconcile endpoint for immediate delivery attempt
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({ 'X-Skilldocs-Revision': '7' }),
          text: () => Promise.resolve(JSON.stringify(snapshot)),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
          headers: new Headers(),
          text: () => Promise.resolve(''),
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
        catalogApi,
      );

      await provider.connect(mockConnection);
      await taskFn.fn!();

      // Acknowledgment should have been persisted atomically
      expect(store.commitStateAndSaveAcknowledgment).toHaveBeenCalledWith(
        'oci',
        'quay-public',
        expect.objectContaining({
          sourceType: 'oci',
          sourceId: 'quay-public',
        }),
        expect.objectContaining({
          sourceType: 'oci',
          sourceId: 'quay-public',
          connectorPluginId: 'skill-image-connector',
          revision: '7',
          retainedDigests: expect.arrayContaining([validOciRecordFull.digest]),
        }),
      );
    });

    it('does not persist acknowledgment for partial OCI snapshot', async () => {
      const snapshot = makeSnapshot({
        status: 'partial',
        skills: [validOciRecordFull],
        failedSkillKeys: ['some-key'],
      });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'X-Skilldocs-Revision': '7' }),
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
        catalogApi,
      );

      await provider.connect(mockConnection);
      await taskFn.fn!();

      // Partial snapshot: no acknowledgment, uses regular commit
      expect(store.commitStateAndSaveAcknowledgment).not.toHaveBeenCalled();
      expect(store.commitStateAndClearPending).toHaveBeenCalled();
    });

    it('does not persist acknowledgment when revision header is absent', async () => {
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
        catalogApi,
      );

      await provider.connect(mockConnection);
      await taskFn.fn!();

      // No revision → no acknowledgment
      expect(store.commitStateAndSaveAcknowledgment).not.toHaveBeenCalled();
      expect(store.commitStateAndClearPending).toHaveBeenCalled();
    });

    it('retries pending acknowledgments and delivers successfully', async () => {
      const snapshot = makeSnapshot({
        skills: [validOciRecordFull],
      });
      // First fetch: reconcile delivery (204 success)
      // Subsequent fetches: snapshot poll
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
          headers: new Headers(),
          text: () => Promise.resolve(''),
        })
        .mockResolvedValue({
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

      // Pre-populate a pending acknowledgment
      const pendingAck = {
        sourceType: 'oci' as const,
        sourceId: 'quay-public',
        connectorPluginId: 'skill-image-connector',
        revision: '5',
        retainedDigests: ['sha256:aaa'],
        expectedEntityUrls: {},
        expectedRemovals: [],
      };
      (store.getAllPendingAcknowledgments as jest.Mock).mockResolvedValueOnce([
        pendingAck,
      ]);

      const provider = new SkillsCatalogProvider(
        config,
        mockDiscovery,
        mockAuth,
        logger,
        mockTaskRunner,
        store,
        catalogApi,
      );

      await provider.connect(mockConnection);
      await taskFn.fn!();

      // Acknowledgment retry was attempted and delivered
      expect(store.getAllPendingAcknowledgments).toHaveBeenCalled();
      // Reconcile request was sent (first fetch call)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/skilldocs/quay-public/reconcile'),
        expect.objectContaining({ method: 'POST' }),
      );
      // Pending ack was cleared after successful delivery
      expect(store.clearPendingAcknowledgment).toHaveBeenCalledWith(
        'oci',
        'quay-public',
      );
    });

    it('discards superseded acknowledgment on 409 response', async () => {
      const snapshot = makeSnapshot({
        skills: [validOciRecordFull],
      });
      // First fetch: reconcile returns 409 (superseded)
      // Subsequent fetches: snapshot poll
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          headers: new Headers(),
          text: () => Promise.resolve('Revision superseded'),
        })
        .mockResolvedValue({
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

      // Pre-populate a pending acknowledgment
      const pendingAck = {
        sourceType: 'oci' as const,
        sourceId: 'quay-public',
        connectorPluginId: 'skill-image-connector',
        revision: '5',
        retainedDigests: ['sha256:aaa'],
        expectedEntityUrls: {},
        expectedRemovals: [],
      };
      (store.getAllPendingAcknowledgments as jest.Mock).mockResolvedValueOnce([
        pendingAck,
      ]);

      const provider = new SkillsCatalogProvider(
        config,
        mockDiscovery,
        mockAuth,
        logger,
        mockTaskRunner,
        store,
        catalogApi,
      );

      await provider.connect(mockConnection);
      await taskFn.fn!();

      // 409: acknowledgment should be discarded
      expect(store.clearPendingAcknowledgment).toHaveBeenCalledWith(
        'oci',
        'quay-public',
      );
    });

    it('blocks source polling when ack retry fails', async () => {
      const snapshot = makeSnapshot({
        skills: [validOciRecordFull],
      });
      // Reconcile request fails with network error
      mockFetch
        .mockRejectedValueOnce(new Error('Network failure'))
        .mockResolvedValue({
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

      // Pre-populate a pending acknowledgment
      const pendingAck = {
        sourceType: 'oci' as const,
        sourceId: 'quay-public',
        connectorPluginId: 'skill-image-connector',
        revision: '5',
        retainedDigests: ['sha256:aaa'],
        expectedEntityUrls: {},
        expectedRemovals: [],
      };
      (store.getAllPendingAcknowledgments as jest.Mock).mockResolvedValueOnce([
        pendingAck,
      ]);

      const provider = new SkillsCatalogProvider(
        config,
        mockDiscovery,
        mockAuth,
        logger,
        mockTaskRunner,
        store,
        catalogApi,
      );

      await provider.connect(mockConnection);
      await taskFn.fn!();

      // clearPendingAcknowledgment should NOT have been called (preserved)
      expect(store.clearPendingAcknowledgment).not.toHaveBeenCalled();

      // Verify the source was actually blocked from polling:
      // reconcileSource calls store.getCommittedState; if blocked,
      // it should NOT have been called for this source.
      expect(store.getCommittedState).not.toHaveBeenCalled();

      // Snapshot polling would make a second fetch call (GET /skills/:sourceId);
      // only one fetch call should have happened (the failed reconcile POST).
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
