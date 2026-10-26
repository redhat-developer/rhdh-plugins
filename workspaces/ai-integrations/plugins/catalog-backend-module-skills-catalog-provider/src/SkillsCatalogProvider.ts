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
import type { CatalogApi } from '@backstage/catalog-client';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { InputError } from '@backstage/errors';
import type {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';

import type { SkillSourceType } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

import { calculateReconciliationPlan } from './reconciliation-planner';
import type {
  PendingAcknowledgment,
  PendingDelta,
  ReconciliationStore,
} from './reconciliation-store';
import { consumeSnapshot } from './snapshot-consumer';
import { withRequestTimeout } from './request-timeout';
import type {
  CommittedSourceState,
  ExternalOwnership,
  PlannedRemoval,
  PlannedUpsert,
  SkillsCatalogProviderConfig,
  SourceConsumerConfig,
} from './types';

// ─── Error types ─────────────────────────────────────────────────────

/**
 * Error thrown when a reconcile request returns 409 indicating the
 * revision has been superseded.
 */
class SupersededRevisionError extends Error {
  constructor(revision: string) {
    super(`Revision ${revision} has been superseded`);
    this.name = 'SupersededRevisionError';
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
  private readonly catalogApi: Pick<CatalogApi, 'getEntitiesByRefs'>;
  private connection?: EntityProviderConnection;

  /**
   * Creates a provider using a caller-owned reconciliation store.
   *
   * @remarks
   * The store owner must await `store.initialize()` before calling
   * `connect()`. The backend module performs this initialization;
   * the provider does not initialize externally supplied stores.
   *
   * The required catalog client verifies processed entity URLs and removals
   * before any D8 release acknowledgment. There is no visibility bypass.
   */
  constructor(
    config: SkillsCatalogProviderConfig,
    discovery: DiscoveryService,
    auth: AuthService,
    logger: LoggerService,
    taskRunner: SchedulerServiceTaskRunner,
    store: ReconciliationStore,
    catalogApi: Pick<CatalogApi, 'getEntitiesByRefs'>,
  ) {
    if (!catalogApi || typeof catalogApi.getEntitiesByRefs !== 'function') {
      throw new InputError(
        'SkillsCatalogProvider requires catalog visibility verification',
      );
    }
    this.config = config;
    this.discovery = discovery;
    this.auth = auth;
    this.logger = logger.child({
      source: `SkillsCatalogProvider:${config.id}`,
    });
    this.taskRunner = taskRunner;
    this.store = store;
    this.catalogApi = catalogApi;
  }

  getProviderName(): string {
    return `SkillsCatalogProvider:${this.config.id}`;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.taskRunner.run({
      id: `skills-catalog-provider-${this.config.id}`,
      fn: async signal => {
        await this.refresh(signal);
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
  private async refresh(signal?: AbortSignal): Promise<void> {
    if (!this.connection) {
      throw new Error(
        `${this.getProviderName()}: not connected to catalog yet`,
      );
    }

    // Recover catalog ownership first, then deliver recovered acknowledgments
    // before consuming any newer snapshot. Do not release an unresolved source.
    const replayBlockedSources = await this.replayPendingDeltas();
    const ackBlockedSources = await this.retryPendingAcknowledgments(
      replayBlockedSources,
      signal,
    );

    // Merge blocked sources from both ack retry and pending delta replay
    const blockedSources = new Set([
      ...ackBlockedSources,
      ...replayBlockedSources,
    ]);

    this.logger.info(
      `Starting refresh with ${this.config.sources.length} source(s)`,
    );

    let sourcesSucceeded = 0;
    let sourcesFailed = 0;
    let sourcesSkipped = 0;
    let totalEntities = 0;

    for (const source of this.config.sources) {
      if (signal?.aborted) break;
      if (blockedSources.has(`${source.sourceType}:${source.sourceId}`)) {
        sourcesFailed++;
        this.logger.warn(
          `Source ${source.sourceId}: skipping snapshot consumption until pending recovery succeeds`,
        );
        continue;
      }
      try {
        const result = await this.reconcileSource(source, signal);
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
        if (
          delta.sourceType === 'oci' &&
          delta.revision &&
          !delta.acknowledgment
        ) {
          throw new Error(
            'Legacy pending OCI revision lacks release/visibility context; preserve it for operator investigation before polling',
          );
        }
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

        // Only full ready-OCI context can authorize release after replay.
        // Legacy revision-only deltas may be partial; never guess their status.
        if (delta.acknowledgment) {
          await this.store.commitStateAndSaveAcknowledgment(
            delta.sourceType,
            delta.sourceId,
            delta.nextState,
            delta.acknowledgment,
          );
        } else {
          await this.store.commitStateAndClearPending(
            delta.sourceType,
            delta.sourceId,
            delta.nextState,
          );
        }
        this.logger.info(
          `Recovered pending delta for ${delta.sourceType}/${delta.sourceId}`,
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
    signal?: AbortSignal,
  ): Promise<{ skipped: boolean; entityCount: number }> {
    // ── Poll the connector ──────────────────────────────────────────
    let connectorBaseUrl: string;
    try {
      connectorBaseUrl = await withRequestTimeout(
        () => this.discovery.getBaseUrl(source.connectorPluginId),
        signal,
      );
    } catch (error) {
      throw new Error(
        `Failed to resolve connector plugin '${source.connectorPluginId}': ${error}`,
      );
    }

    const { token } = await withRequestTimeout(
      async () =>
        this.auth.getPluginRequestToken({
          onBehalfOf: await this.auth.getOwnServiceCredentials(),
          targetPluginId: source.connectorPluginId,
        }),
      signal,
    );

    const result = await withRequestTimeout(
      requestSignal =>
        consumeSnapshot(
          connectorBaseUrl,
          token,
          source,
          this.config.namespace,
          this.config.defaultOwner,
          this.config.defaultLifecycle,
          this.logger,
          requestSignal,
        ),
      signal,
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

    const canAcknowledge =
      result.status === 'ready' &&
      source.sourceType === 'oci' &&
      result.revision &&
      !(plan.noOp && plan.reason === 'stale-observation');
    const acknowledgment = canAcknowledge
      ? this.buildAcknowledgment(
          source,
          result.revision!,
          plan.nextState,
          plan.removals,
        )
      : undefined;

    // ── No-op plans: persist observedAt advancement but skip mutation ─
    if (plan.noOp) {
      this.logger.info(
        `Source ${source.sourceId}: no-op (${plan.reason}), ` +
          `preserving ${plan.nextState.entities.length} entity/entities`,
      );

      if (acknowledgment) {
        await this.store.commitStateAndSaveAcknowledgment(
          source.sourceType,
          source.sourceId,
          plan.nextState,
          acknowledgment,
        );
        await this.tryDeliverAcknowledgment(acknowledgment, signal);
      } else {
        await this.store.commitStateAndClearPending(
          source.sourceType,
          source.sourceId,
          plan.nextState,
        );
      }

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

    // Step 1: Persist the pending delta before applying the mutation.
    // Include the revision so it survives crashes per design D8.
    await this.store.savePendingDelta({
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      upserts: plan.upserts,
      removals: plan.removals,
      nextState: plan.nextState,
      revision: acknowledgment?.revision,
      acknowledgment,
    });

    // Step 2: Apply the delta mutation to the catalog
    await this.applyDeltaMutation(
      this.connection!,
      locationKey,
      plan.upserts,
      plan.removals,
    );

    if (acknowledgment) {
      await this.store.commitStateAndSaveAcknowledgment(
        source.sourceType,
        source.sourceId,
        plan.nextState,
        acknowledgment,
      );
      await this.tryDeliverAcknowledgment(acknowledgment, signal);
    } else {
      await this.store.commitStateAndClearPending(
        source.sourceType,
        source.sourceId,
        plan.nextState,
      );
    }

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

  // ─── D8 acknowledgment lifecycle ──────────────────────────────────

  /**
   * Builds a pending acknowledgment from committed state and planned
   * removals per design D8.
   */
  private buildAcknowledgment(
    source: SourceConsumerConfig,
    revision: string,
    nextState: CommittedSourceState,
    removals: PlannedRemoval[],
  ): PendingAcknowledgment {
    // Unique digests from committed last-known-good entities
    const retainedDigests = [...new Set(nextState.entities.map(e => e.digest))];

    // Expected entity refs → TechDocs URLs for visibility verification
    const expectedEntityUrls: Record<string, string> = {};
    for (const owned of nextState.entities) {
      const ref = stringifyEntityRef(owned.entity);
      const techdocsRef =
        owned.entity.metadata?.annotations?.['backstage.io/techdocs-ref'];
      if (!techdocsRef)
        throw new Error(`Missing committed TechDocs reference: ${ref}`);
      expectedEntityUrls[ref] = techdocsRef;
    }

    // Entity refs expected to be absent (removed)
    const expectedRemovals = removals.map(removal => {
      if (!removal.entityRef)
        throw new Error('Missing persisted removal reference');
      return removal.entityRef;
    });

    return {
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      connectorPluginId: source.connectorPluginId,
      revision,
      retainedDigests,
      expectedEntityUrls,
      expectedRemovals,
    };
  }

  /**
   * Retries all pending acknowledgments before polling new snapshots.
   *
   * Per design D8: retry pending acknowledgments, including catalog
   * visibility checks, before consuming newer snapshots. Each
   * acknowledgment is isolated: a failure for one source does not
   * prevent retrying or polling other sources. Failures reading the
   * pending list itself propagate to the caller.
   *
   * @returns Set of `sourceType:sourceId` keys whose acknowledgment
   *   delivery or cleanup failed, blocking new snapshot polling for
   *   those sources until the next scheduled run.
   */
  private async retryPendingAcknowledgments(
    recoveryBlocked: ReadonlySet<string>,
    signal?: AbortSignal,
  ): Promise<Set<string>> {
    const blockedSources = new Set<string>();

    // Let getAllPendingAcknowledgments errors propagate — the caller
    // must know when the pending list itself cannot be read.
    const pendingAcks = await this.store.getAllPendingAcknowledgments();
    if (pendingAcks.length === 0) return blockedSources;

    this.logger.info(
      `Retrying ${pendingAcks.length} pending acknowledgment(s)`,
    );

    for (const ack of pendingAcks) {
      const key = `${ack.sourceType}:${ack.sourceId}`;
      if (recoveryBlocked.has(key)) {
        blockedSources.add(key);
        continue;
      }
      try {
        if (!(await this.tryDeliverAcknowledgment(ack, signal)))
          blockedSources.add(key);
      } catch (error) {
        // Preserve pending state and block this source's polling
        // until the next scheduled run.
        blockedSources.add(key);
        this.logger.error(
          `Source ${ack.sourceId}: acknowledgment retry failed ` +
            `(revision=${ack.revision}), blocking source polling: ${error}`,
        );
      }
    }

    return blockedSources;
  }

  /**
   * Attempts to deliver a pending acknowledgment.
   *
   * Verifies catalog processing visibility before sending the reconcile request.
   * A deferred visibility check blocks newer polling, just like a request error.
   * On success, clears the pending acknowledgment. On failure,
   * retains it for retry on the next scheduled run.
   */
  private async tryDeliverAcknowledgment(
    ack: PendingAcknowledgment,
    signal?: AbortSignal,
  ): Promise<boolean> {
    try {
      const visible = await withRequestTimeout(
        () => this.verifyCatalogVisibility(ack),
        signal,
      );
      if (!visible) {
        this.logger.info(
          `Source ${ack.sourceId}: catalog processing not yet visible, deferring acknowledgment revision=${ack.revision}`,
        );
        return false;
      }
      await withRequestTimeout(
        requestSignal => this.sendReconcileRequest(ack, requestSignal),
        signal,
      );

      // Clear the pending acknowledgment on success
      await this.store.clearPendingAcknowledgment(ack.sourceType, ack.sourceId);

      this.logger.info(
        `Source ${ack.sourceId}: acknowledgment delivered ` +
          `revision=${ack.revision}`,
      );
      return true;
    } catch (error) {
      if (error instanceof SupersededRevisionError) {
        // 409: discard superseded acknowledgment and permit new poll
        this.logger.warn(
          `Source ${ack.sourceId}: acknowledgment revision=${ack.revision} ` +
            `superseded (409), discarding`,
        );
        // If clearing fails, rethrow so retryPendingAcknowledgments
        // blocks this source's polling until the next run.
        await this.store.clearPendingAcknowledgment(
          ack.sourceType,
          ack.sourceId,
        );
        return true;
      }
      // Transport/auth/server errors: retain for retry.
      // Re-throw so retryPendingAcknowledgments can catch the error
      // and block this source's polling until the next scheduled run.
      throw error;
    }
  }

  /**
   * Verifies that the catalog has processed entities with the expected
   * TechDocs URLs and that removed entities are absent.
   *
   * @returns `true` if all visibility checks pass.
   */
  private async verifyCatalogVisibility(
    ack: PendingAcknowledgment,
  ): Promise<boolean> {
    const { token } = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });

    // Check expected entity URLs
    const entityRefs = Object.keys(ack.expectedEntityUrls);
    if (entityRefs.length > 0) {
      try {
        const response = await this.catalogApi.getEntitiesByRefs(
          { entityRefs },
          { token },
        );

        for (let i = 0; i < entityRefs.length; i++) {
          const entity = response.items[i];
          if (
            response.items.length !== entityRefs.length ||
            !entity ||
            stringifyEntityRef(entity) !== entityRefs[i]
          ) {
            this.logger.debug(
              `Visibility check: ${entityRefs[i]} not yet in catalog`,
            );
            return false;
          }
          const actualUrl =
            entity.metadata?.annotations?.['backstage.io/techdocs-ref'];
          const expectedUrl = ack.expectedEntityUrls[entityRefs[i]];
          if (actualUrl !== expectedUrl) {
            this.logger.debug(
              `Visibility check: ${entityRefs[i]} has stale techdocs-ref ` +
                `(expected=${expectedUrl}, actual=${actualUrl})`,
            );
            return false;
          }
        }
      } catch (error) {
        this.logger.warn(`Visibility check: catalog query failed: ${error}`);
        return false;
      }
    }

    // Check expected removals
    if (ack.expectedRemovals.length > 0) {
      try {
        const response = await this.catalogApi.getEntitiesByRefs(
          { entityRefs: ack.expectedRemovals },
          { token },
        );

        for (let i = 0; i < ack.expectedRemovals.length; i++) {
          if (
            response.items.length !== ack.expectedRemovals.length ||
            response.items[i]
          ) {
            this.logger.debug(
              `Visibility check: ${ack.expectedRemovals[i]} not yet removed`,
            );
            return false;
          }
        }
      } catch (error) {
        this.logger.warn(
          `Visibility check: catalog removal query failed: ${error}`,
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Sends the reconcile request to the connector's
   * `POST /skilldocs/:sourceId/reconcile` endpoint.
   *
   * @throws SupersededRevisionError on 409 (superseded revision)
   * @throws Error on other failures
   */
  private async sendReconcileRequest(
    ack: PendingAcknowledgment,
    signal: AbortSignal,
  ): Promise<void> {
    const connectorBaseUrl = await this.discovery.getBaseUrl(
      ack.connectorPluginId,
    );
    const url = `${connectorBaseUrl.replace(
      /\/+$/,
      '',
    )}/skilldocs/${encodeURIComponent(ack.sourceId)}/reconcile`;

    const { token } = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: ack.connectorPluginId,
    });

    const response = await fetch(url, {
      method: 'POST',
      redirect: 'error',
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        revision: ack.revision,
        retainedDigests: ack.retainedDigests,
      }),
    });

    await response.body?.cancel();
    if (response.status === 204) {
      return; // Success
    }

    if (response.status === 409) {
      throw new SupersededRevisionError(ack.revision);
    }

    throw new Error(`Reconcile request failed with ${response.status}`);
  }
}
