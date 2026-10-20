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
import type { Entity } from '@backstage/catalog-model';
import type {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';

import { consumeSnapshot } from './snapshot-consumer';
import type {
  MappedSkillEntity,
  SkillsCatalogProviderConfig,
  SourceConsumerConfig,
} from './types';

/**
 * Common skills catalog entity provider.
 *
 * Consumes normalized v1 snapshots from OCI and npx connectors using
 * the same implementation. Each source has independent configuration,
 * location keys, and polling. The provider resolves `connectorPluginId`
 * through Backstage discovery and obtains a service token targeted to
 * that receiving plugin ID.
 *
 * This provider does not retrieve registry artifacts or parse native
 * skill files — that responsibility belongs to the connectors.
 *
 * @remarks
 * Partial snapshots are currently handled as full replacements: a
 * `partial` status triggers a `type: 'full'` mutation identical to a
 * `ready` snapshot. Comprehensive partial-result retention is deferred
 * to task 4.4.
 *
 * @public
 */
export class SkillsCatalogProvider implements EntityProvider {
  private readonly config: SkillsCatalogProviderConfig;
  private readonly discovery: DiscoveryService;
  private readonly auth: AuthService;
  private readonly logger: LoggerService;
  private readonly taskRunner: SchedulerServiceTaskRunner;
  private connection?: EntityProviderConnection;

  constructor(
    config: SkillsCatalogProviderConfig,
    discovery: DiscoveryService,
    auth: AuthService,
    logger: LoggerService,
    taskRunner: SchedulerServiceTaskRunner,
  ) {
    this.config = config;
    this.discovery = discovery;
    this.auth = auth;
    this.logger = logger.child({
      source: `SkillsCatalogProvider:${config.id}`,
    });
    this.taskRunner = taskRunner;
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
   * Each source is polled independently. An HTTP, authentication, or
   * validation failure for one source does not stop others. Sources
   * that fail or return a non-ready status are skipped during mutation
   * so their previously-emitted entities remain in the catalog.
   */
  private async refresh(): Promise<void> {
    if (!this.connection) {
      throw new Error(
        `${this.getProviderName()}: not connected to catalog yet`,
      );
    }

    this.logger.info(
      `Starting refresh with ${this.config.sources.length} source(s)`,
    );

    // Collect entities from all sources, each polled independently.
    // Track which sources succeeded so we can skip mutations for
    // failed or non-ready sources, preserving their previous state.
    const allEntities: Entity[] = [];
    const succeededSourceIds = new Set<string>();
    let sourcesFailed = 0;

    for (const source of this.config.sources) {
      try {
        const result = await this.pollSource(source);
        if (result.skipped) {
          // Source returned loading/failed status — preserve previous state
          this.logger.info(
            `Source ${source.sourceId}: non-ready status, preserving previous entities`,
          );
        } else {
          allEntities.push(...result.entities);
          succeededSourceIds.add(`${source.sourceType}/${source.sourceId}`);
        }
      } catch (error) {
        sourcesFailed++;
        this.logger.error(`Source ${source.sourceId} failed: ${error}`);
      }
    }

    const successCount = succeededSourceIds.size;
    const skippedCount =
      this.config.sources.length - successCount - sourcesFailed;
    const failMsg =
      sourcesFailed > 0 ? `, ${sourcesFailed} source(s) failed` : '';
    const skipMsg =
      skippedCount > 0
        ? `, ${skippedCount} source(s) non-ready (preserved)`
        : '';
    this.logger.info(
      `Refresh complete: ${allEntities.length} entities from ${successCount} successful source(s)${failMsg}${skipMsg}`,
    );

    // Apply full mutation only for sources that returned a ready snapshot.
    // Failed or non-ready sources are skipped so their previously-emitted
    // entities remain in the catalog.
    for (const source of this.config.sources) {
      const sourceKey = `${source.sourceType}/${source.sourceId}`;
      if (!succeededSourceIds.has(sourceKey)) {
        continue;
      }

      const locationKey = this.buildLocationKey(source);
      const sourceEntities = allEntities.filter(e => {
        const assetSource = e.metadata.annotations?.['rhdh.io/ai-asset-source'];
        return assetSource === sourceKey;
      });

      await this.connection.applyMutation({
        type: 'full',
        entities: sourceEntities.map(entity => ({
          locationKey,
          entity,
        })),
      });
    }
  }

  /**
   * Polls a single connector source and returns mapped entities.
   *
   * Returns `{ skipped: true }` when the snapshot status is not ready
   * (loading or failed), signalling that the source's previous catalog
   * entities should be preserved. Throws on HTTP, auth, or validation
   * failures so the caller can distinguish transient errors from
   * intentional non-ready states.
   */
  private async pollSource(
    source: SourceConsumerConfig,
  ): Promise<
    { skipped: false; entities: Entity[] } | { skipped: true; entities?: never }
  > {
    // Resolve connector URL through Backstage discovery
    let baseUrl: string;
    try {
      baseUrl = await this.discovery.getBaseUrl(source.connectorPluginId);
    } catch (error) {
      throw new Error(
        `Failed to resolve connector plugin '${source.connectorPluginId}': ${error}`,
      );
    }

    // Obtain a service token targeted to the receiving plugin ID
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

    // For loading/failed status, signal the caller to preserve previous
    // catalog entities rather than applying an empty mutation.
    // NOTE: `partial` snapshots currently fall through to the ready path
    // and trigger a `type: 'full'` mutation. Comprehensive status handling
    // (including partial-result retention) is deferred to task 4.4.
    if (result.status === 'loading' || result.status === 'failed') {
      return { skipped: true };
    }

    return {
      skipped: false,
      entities: result.entities.map((m: MappedSkillEntity) => m.entity),
    };
  }

  /**
   * Builds a source-scoped location key for catalog mutations.
   *
   * Per design D5/D6, each source has an independent location key so
   * that full mutations are scoped per source and removals only affect
   * entities owned by that specific source.
   */
  private buildLocationKey(source: SourceConsumerConfig): string {
    return `skills-catalog-provider:${this.config.id}:${source.sourceType}:${source.sourceId}`;
  }
}
