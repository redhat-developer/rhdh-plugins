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

import type {
  AuthService,
  DiscoveryService,
  LoggerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import { stringifyEntityRef } from '@backstage/catalog-model';
import type {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';

import type { SkillSourceType } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

import { calculateReconciliationPlan } from './reconciliation-planner';
import type { PendingDelta, ReconciliationStore } from './reconciliation-store';
import { consumeSnapshot } from './snapshot-consumer';
import type {
  CommittedSourceState,
  ExternalOwnership,
  PlannedRemoval,
  PlannedUpsert,
  SkillsCatalogProviderConfig,
  SourceConsumerConfig,
} from './types';

// ─── Default in-memory store ──────────────────────────────────────────

/**
 * In-memory reconciliation store used as the default when no persistent
 * store is provided. State is retained for the lifetime of the process
 * but not across restarts.
 */
class InMemoryReconciliationStore implements ReconciliationStore {
  private committed = new Map<string, CommittedSourceState>();
  private pending = new Map<string, PendingDelta>();

  private key(sourceType: SkillSourceType, sourceId: string): string {
    return `${sourceType}:${sourceId}`;
  }

  async initialize(): Promise<void> {}

  async getCommittedState(
    sourceType: SkillSourceType,
    sourceId: string,
  ): Promise<CommittedSourceState> {
    return (
      this.committed.get(this.key(sourceType, sourceId)) ?? {
        sourceType,
        sourceId,
        observedAt: null,
        entities: [],
      }
    );
  }

  async getAllCommittedStates(): Promise<CommittedSourceState[]> {
    return Array.from(this.committed.values());
  }

  async getPendingDelta(
    sourceType: SkillSourceType,
    sourceId: string,
  ): Promise<PendingDelta | undefined> {
    return this.pending.get(this.key(sourceType, sourceId));
  }

  async getAllPendingDeltas(): Promise<PendingDelta[]> {
    return Array.from(this.pending.values());
  }

  async savePendingDelta(delta: PendingDelta): Promise<void> {
    this.pending.set(this.key(delta.sourceType, delta.sourceId), delta);
  }

  async commitStateAndClearPending(
    sourceType: SkillSourceType,
    sourceId: string,
    nextState: CommittedSourceState,
  ): Promise<void> {
    const k = this.key(sourceType, sourceId);
    this.committed.set(k, nextState);
    this.pending.delete(k);
  }
}

/**
 * Common skills catalog entity provider.
 *
 * Consumes normalized v1 snapshots from OCI and npx connectors using
 * the same implementation. Each source has independent configuration,
 * location keys, polling, and durable reconciliation state.
 *
 * The provider resolves `connectorPluginId` through Backstage discovery
 * and obtains a service token targeted to that receiving plugin ID.
 *
 * This provider does not retrieve registry artifacts or parse native
 * skill files — that responsibility belongs to the connectors.
 *
 * @remarks
 * Uses source-scoped delta mutations with durable persistence per
 * design D6. Before applying a catalog mutation, the exact pending
 * delta and intended next state are persisted. After the mutation
 * succeeds, the next state is committed and the pending record is
 * cleared. On restart, pending deltas are replayed before consuming
 * newer snapshots.
 *
 * @public
 */
export class SkillsCatalogProvider implements EntityProvider {
  private readonly config: SkillsCatalogProviderConfig;
  private readonly discovery: DiscoveryService;
  private readonly auth: AuthService;
  private readonly logger: LoggerService;
  private readonly taskRunner: SchedulerServiceTaskRunner;
  private readonly store: ReconciliationStore;
  private connection?: EntityProviderConnection;

  /**
   * Creates a provider using an optional caller-owned reconciliation store.
   *
   * @remarks
   * When supplying a store, its owner must await `store.initialize()` before
   * calling `connect()`. The backend module performs this initialization;
   * the provider does not initialize externally supplied stores. Omitting the
   * store uses process-local in-memory state without restart persistence.
   */
  constructor(
    config: SkillsCatalogProviderConfig,
    discovery: DiscoveryService,
    auth: AuthService,
    logger: LoggerService,
    taskRunner: SchedulerServiceTaskRunner,
    store?: ReconciliationStore,
  ) {
    this.config = config;
    this.discovery = discovery;
    this.auth = auth;
    this.logger = logger.child({
      source: `SkillsCatalogProvider:${config.id}`,
    });
    this.taskRunner = taskRunner;
    this.store = store ?? new InMemoryReconciliationStore();
  }

  getProviderName(): string {
    return `SkillsCatalogProvider:${this.config.id}`;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.taskRunner.run({
      id: `skills-catalog-provider-${this.config.id}`,
      fn: async () => {
        await this.refresh();
      },
    });
  }

  /**
   * Polls all configured sources and applies entity mutations.
   *
   * On each refresh:
   * 1. Replay any pending deltas from a previous interrupted run
   * 2. For each source, poll the connector and compute a reconciliation plan
   * 3. Apply delta mutations with crash-safe pending persistence
   *
   * Each source is polled independently. An HTTP, authentication, or
   * validation failure for one source does not stop others. Sources
   * that fail or return a non-ready status preserve their previously
   * committed entities.
   */
  private async refresh(): Promise<void> {
    if (!this.connection) {
      throw new Error(
        `${this.getProviderName()}: not connected to catalog yet`,
      );
    }

    // ── Step 1: Replay pending deltas from previous interrupted runs ──
    const blockedSources = await this.replayPendingDeltas();

    this.logger.info(
      `Starting refresh with ${this.config.sources.length} source(s)`,
    );

    let sourcesSucceeded = 0;
    let sourcesFailed = 0;
    let sourcesSkipped = 0;
    let totalEntities = 0;

    for (const source of this.config.sources) {
      if (blockedSources.has(`${source.sourceType}:${source.sourceId}`)) {
        sourcesFailed++;
        this.logger.warn(
          `Source ${source.sourceId}: skipping snapshot consumption until pending recovery succeeds`,
        );
        continue;
      }
      try {
        const result = await this.reconcileSource(source);
        if (result.skipped) {
          sourcesSkipped++;
        } else {
          sourcesSucceeded++;
          totalEntities += result.entityCount;
        }
      } catch (error) {
        sourcesFailed++;
        this.logger.error(`Source ${source.sourceId} failed: ${error}`);
      }
    }

    const failMsg =
      sourcesFailed > 0 ? `, ${sourcesFailed} source(s) failed` : '';
    const skipMsg =
      sourcesSkipped > 0
        ? `, ${sourcesSkipped} source(s) non-ready (preserved)`
        : '';
    this.logger.info(
      `Refresh complete: ${totalEntities} entities from ${sourcesSucceeded} successful source(s)${failMsg}${skipMsg}`,
    );
  }

  /**
   * Replays pending deltas that survived a previous crash.
   *
   * Per design D6: on restart or retry, replay any pending delta and
   * commit its state before consuming a newer connector snapshot.
   * Replays must be idempotent and scoped to the original source.
   */
  private async replayPendingDeltas(): Promise<Set<string>> {
    const blockedSources = new Set<string>();
    const pendingDeltas = await this.store.getAllPendingDeltas();
    if (pendingDeltas.length === 0) {
      return blockedSources;
    }

    this.logger.info(
      `Recovering ${pendingDeltas.length} pending delta(s) from previous run`,
    );

    for (const delta of pendingDeltas) {
      try {
        const locationKey = this.buildLocationKeyFromParts(
          delta.sourceType,
          delta.sourceId,
        );

        // Re-apply the mutation (idempotent — Backstage handles duplicates)
        await this.applyDeltaMutation(
          this.connection!,
          locationKey,
          delta.upserts,
          await this.resolvePendingRemovals(delta),
        );

        // Commit the next state and clear the pending delta
        await this.store.commitStateAndClearPending(
          delta.sourceType,
          delta.sourceId,
          delta.nextState,
        );

        this.logger.info(
          `Recovered pending delta for ${delta.sourceType}/${delta.sourceId}: ` +
            `${delta.upserts.length} upsert(s), ${delta.removals.length} removal(s)`,
        );
      } catch (error) {
        // Preserve unresolved work and block newer observations for this source.
        // Other sources can still refresh independently.
        blockedSources.add(`${delta.sourceType}:${delta.sourceId}`);
        this.logger.error(
          `Failed to recover pending delta for ${delta.sourceType}/${delta.sourceId}: ${error}`,
        );
      }
    }
    return blockedSources;
  }

  /**
   * Reconciles a single source: polls the connector, computes a
   * reconciliation plan, and applies it with crash-safe persistence.
   */
  private async reconcileSource(
    source: SourceConsumerConfig,
  ): Promise<{ skipped: boolean; entityCount: number }> {
    // ── Poll the connector ──────────────────────────────────────────
    let baseUrl: string;
    try {
      baseUrl = await this.discovery.getBaseUrl(source.connectorPluginId);
    } catch (error) {
      throw new Error(
        `Failed to resolve connector plugin '${source.connectorPluginId}': ${error}`,
      );
    }

    const { token } = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: source.connectorPluginId,
    });

    const result = await consumeSnapshot(
      baseUrl,
      token,
      source,
      this.config.namespace,
      this.config.defaultOwner,
      this.config.defaultLifecycle,
      this.logger,
    );

    if (!result.ok) {
      throw new Error(result.error ?? 'Unknown error consuming snapshot');
    }

    // ── Load committed state and compute plan ────────────────────────
    const previousState = await this.store.getCommittedState(
      source.sourceType,
      source.sourceId,
    );

    // Build external ownership from all other sources for collision detection
    const externalOwnership = await this.buildExternalOwnership(source);

    const plan = calculateReconciliationPlan({
      previousState,
      snapshotStatus: result.status,
      snapshotObservedAt: result.observedAt,
      mappedEntities: result.entities,
      externalOwnership,
    });

    // Log collisions if any
    for (const collision of plan.collisions) {
      this.logger.warn(
        `Identity collision on '${collision.catalogName}': ` +
          `incoming [${collision.incomingTuple.type}, ${collision.incomingTuple.id}, ${collision.incomingTuple.key}] ` +
          `collides with existing [${collision.existingTuple.type}, ${collision.existingTuple.id}, ${collision.existingTuple.key}] ` +
          `(scope: ${collision.scope})`,
      );
    }

    // ── No-op plans: persist observedAt advancement but skip mutation ─
    if (plan.noOp) {
      this.logger.info(
        `Source ${source.sourceId}: no-op (${plan.reason}), ` +
          `preserving ${plan.nextState.entities.length} entity/entities`,
      );

      // Always persist nextState — observedAt may have advanced
      await this.store.commitStateAndClearPending(
        source.sourceType,
        source.sourceId,
        plan.nextState,
      );

      if (
        plan.reason === 'loading' ||
        plan.reason === 'failed' ||
        plan.reason === 'stale-observation' ||
        plan.reason === 'repeated-observation'
      ) {
        return { skipped: true, entityCount: 0 };
      }

      // 'no-changes': still a successful reconciliation
      return { skipped: false, entityCount: plan.nextState.entities.length };
    }

    // ── Apply the plan with crash-safe persistence ───────────────────
    const locationKey = this.buildLocationKey(source);

    // Step 1: Persist the pending delta before applying the mutation
    await this.store.savePendingDelta({
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      upserts: plan.upserts,
      removals: plan.removals,
      nextState: plan.nextState,
    });

    // Step 2: Apply the delta mutation to the catalog
    await this.applyDeltaMutation(
      this.connection!,
      locationKey,
      plan.upserts,
      plan.removals,
    );

    // Step 3: Commit the next state and clear the pending delta
    await this.store.commitStateAndClearPending(
      source.sourceType,
      source.sourceId,
      plan.nextState,
    );

    this.logger.info(
      `Source ${source.sourceId}: reconciled ` +
        `(${plan.upserts.length} upsert(s), ${plan.removals.length} removal(s), ` +
        `${plan.nextState.entities.length} total entity/entities)`,
    );

    return { skipped: false, entityCount: plan.nextState.entities.length };
  }

  /**
   * Applies a delta mutation to the catalog connection.
   *
   * Converts planned upserts and removals into the Backstage
   * `EntityProviderMutation` format with `type: 'delta'`.
   */
  private async applyDeltaMutation(
    connection: EntityProviderConnection,
    locationKey: string,
    upserts: PlannedUpsert[],
    removals: PlannedRemoval[],
  ): Promise<void> {
    if (upserts.length === 0 && removals.length === 0) {
      return;
    }

    await connection.applyMutation({
      type: 'delta',
      added: upserts.map(u => ({
        locationKey,
        entity: u.entity,
      })),
      removed: removals.map(r => {
        if (!r.entityRef) {
          throw new Error(
            `Removal has no persisted entity reference: ${r.catalogName}`,
          );
        }
        return { entityRef: r.entityRef, locationKey };
      }),
    });
  }

  /** Recover original removal targets from pre-upgrade pending plans. */
  private async resolvePendingRemovals(
    delta: PendingDelta,
  ): Promise<PlannedRemoval[]> {
    if (delta.removals.every(removal => removal.entityRef))
      return delta.removals;
    const committed = await this.store.getCommittedState(
      delta.sourceType,
      delta.sourceId,
    );
    return delta.removals.map(removal => {
      if (removal.entityRef) return removal;
      const owned = committed.entities.filter(
        entity =>
          entity.catalogName === removal.catalogName &&
          entity.tuple.type === removal.tuple.type &&
          entity.tuple.id === removal.tuple.id &&
          entity.tuple.key === removal.tuple.key,
      );
      if (owned.length !== 1) {
        throw new Error(
          `Cannot recover original identity for pending removal: ${removal.catalogName}`,
        );
      }
      return { ...removal, entityRef: stringifyEntityRef(owned[0].entity) };
    });
  }

  /**
   * Builds external ownership records from all other committed sources
   * for cross-source identity collision detection.
   */
  private async buildExternalOwnership(
    currentSource: SourceConsumerConfig,
  ): Promise<ExternalOwnership[]> {
    const allStates = await this.store.getAllCommittedStates();
    const external: ExternalOwnership[] = [];

    for (const state of allStates) {
      // Skip the current source
      if (
        state.sourceType === currentSource.sourceType &&
        state.sourceId === currentSource.sourceId
      ) {
        continue;
      }

      for (const entity of state.entities) {
        external.push({
          entityRef: stringifyEntityRef(entity.entity),
          catalogName: entity.catalogName,
          tuple: entity.tuple,
        });
      }
    }

    return external;
  }

  /**
   * Builds a source-scoped location key for catalog mutations.
   *
   * Per design D5/D6, each source has an independent location key so
   * that delta mutations are scoped per source.
   */
  private buildLocationKey(source: SourceConsumerConfig): string {
    return this.buildLocationKeyFromParts(source.sourceType, source.sourceId);
  }

  /**
   * Builds a location key from raw source type and ID parts.
   * Used during pending delta replay when a SourceConsumerConfig may
   * not be available.
   */
  private buildLocationKeyFromParts(
    sourceType: SkillSourceType,
    sourceId: string,
  ): string {
    return `skills-catalog-provider:${this.config.id}:${sourceType}:${sourceId}`;
  }
}
