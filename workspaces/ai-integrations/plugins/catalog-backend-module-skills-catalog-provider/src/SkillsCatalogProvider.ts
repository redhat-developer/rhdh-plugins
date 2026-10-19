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

  /** @override */
  getProviderName(): string {
    return `SkillsCatalogProvider:${this.config.id}`;
  }

  /** @override */
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
   * validation failure for one source does not stop others.
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

    // Collect entities from all sources, each polled independently
    const allEntities: Entity[] = [];
    let sourcesFailed = 0;

    for (const source of this.config.sources) {
      try {
        const entities = await this.pollSource(source);
        allEntities.push(...entities);
      } catch (error) {
        sourcesFailed++;
        this.logger.error(`Source ${source.sourceId} failed: ${error}`);
      }
    }

    const successCount = this.config.sources.length - sourcesFailed;
    const failMsg =
      sourcesFailed > 0 ? `, ${sourcesFailed} source(s) failed` : '';
    this.logger.info(
      `Refresh complete: ${allEntities.length} entities from ${successCount} successful source(s)${failMsg}`,
    );

    // Apply full mutation per source-scoped location key
    // Each source gets its own locationKey for independent ownership
    for (const source of this.config.sources) {
      const locationKey = this.buildLocationKey(source);
      const sourceEntities = allEntities.filter(e => {
        const assetSource = e.metadata.annotations?.['rhdh.io/ai-asset-source'];
        return assetSource === `${source.sourceType}/${source.sourceId}`;
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
   */
  private async pollSource(source: SourceConsumerConfig): Promise<Entity[]> {
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

    // For loading/failed status, return empty — preserve previous state
    if (result.status === 'loading' || result.status === 'failed') {
      return [];
    }

    return result.entities.map((m: MappedSkillEntity) => m.entity);
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
