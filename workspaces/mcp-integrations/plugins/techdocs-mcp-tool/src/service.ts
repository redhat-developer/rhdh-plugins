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

import { LoggerService, DiscoveryService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import {
  Publisher,
  PublisherBase,
  TechDocsMetadata,
} from '@backstage/plugin-techdocs-node';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { Entity } from '@backstage/catalog-model';
import TurndownService from 'turndown';

/**
 * TechDocsEntity
 *
 * @public
 */
export interface TechDocsEntity {
  name: string;
  tags: Array<string>;
  description: string;
  owner: string;
  lifecycle: string;
  namespace: string;
  title: string;
  kind: string;
}

/**
 * TechDocsEntityWithUrls
 *
 * @public
 */
export interface TechDocsEntityWithUrls extends TechDocsEntity {
  techDocsUrl: string;
  metadataUrl: string;
}

/**
 * TechDocsEntityWithMetadata
 *
 * @public
 */
export interface TechDocsEntityWithMetadata extends TechDocsEntityWithUrls {
  metadata?: {
    lastUpdated?: string;
    buildTimestamp?: number;
    siteName?: string;
    siteDescription?: string;
    etag?: string;
    files?: string[];
  };
}

/**
 * TechDocsContentResult
 *
 * @public
 */
export interface TechDocsContentResult {
  entityRef: string;
  name: string;
  title: string;
  kind: string;
  namespace: string;
  content: string;
  pageTitle?: string;
  lastModified?: string;
  path?: string;
  contentType: 'markdown' | 'html' | 'text';
  metadata?: {
    lastUpdated?: string;
    buildTimestamp?: number;
    siteName?: string;
    siteDescription?: string;
  };
}

/**
 * ListTechDocsOptions
 *
 * @public
 */
export interface ListTechDocsOptions {
  entityType?: string;
  namespace?: string;
  owner?: string;
  lifecycle?: string;
  tags?: string[];
  limit?: number;
}

/**
 * TechDocsCoverageResult
 *
 * @public
 */
export interface TechDocsCoverageResult {
  totalEntities: number;
  entitiesWithDocs: number;
  coveragePercentage: number;
}

/**
 * TechDocsService
 *
 * @public
 */
export class TechDocsService {
  private publisher?: PublisherBase;
  private turndownService: TurndownService;

  constructor(
    private config: Config,
    private logger: LoggerService,
    private discovery: DiscoveryService,
    private fetchFunction?: any,
  ) {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
    });
  }

  // convertHtmlToText:: converts an HTML text to markdown/text using turndown
  private convertHtmlToText(html: string): string {
    try {
      return this.turndownService.turndown(html);
    } catch (error) {
      this.logger.warn(
        'Failed to convert HTML with turndown, falling back to plain text',
        error,
      );
      // Fallback to simple text extraction if turndown fails
      return html
        .replace(/<(script|style)[^>]*>.*?<\/\1>/gims, '')
        .replace(/<!--.*?-->/gims, '')
        .replace(/<[^>]*>/gims, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  async initialize() {
    this.publisher = await Publisher.fromConfig(this.config, {
      logger: this.logger,
      discovery: this.discovery,
    });
  }

  async getPublisher(): Promise<PublisherBase> {
    if (!this.publisher) {
      await this.initialize();
    }
    return this.publisher!;
  }

  // generateTechDocsUrls:: creates the techdoc urls
  async generateTechDocsUrls(
    entity: Entity,
  ): Promise<{ techDocsUrl: string; metadataUrl: string }> {
    const appBaseUrl = this.config.getString('app.baseUrl');
    const backendBaseUrl = await this.discovery.getBaseUrl('catalog');

    const { namespace = 'default', name } = entity.metadata;
    const kind = entity.kind.toLowerCase();

    return {
      techDocsUrl: `${appBaseUrl}/docs/${namespace}/${kind}/${name}`,
      metadataUrl: `${backendBaseUrl}/entities/by-name/${kind}/${namespace}/${name}`,
    };
  }

  // fetchTechDocsMetadata:: fetches all metadata for given entity
  async fetchTechDocsMetadata(
    entity: Entity,
  ): Promise<TechDocsMetadata | null> {
    try {
      const publisher = await this.getPublisher();
      const { namespace = 'default', name } = entity.metadata;
      const kind = entity.kind.toLowerCase();

      const entityName = {
        kind,
        namespace,
        name,
      };

      const metadata = await publisher.fetchTechDocsMetadata(entityName);
      return metadata;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch TechDocs metadata for ${entity.kind}:${entity.metadata.namespace}/${entity.metadata.name}`,
        error,
      );
      return null;
    }
  }

  // retrieveTechDocsContent:: fetches TechDoc content
  // for given entity
  async retrieveTechDocsContent(
    entityRef: string,
    pagePath?: string,
    auth?: any,
    catalog?: CatalogService,
  ): Promise<TechDocsContentResult | null> {
    try {
      const [kind, namespaceAndName] = entityRef.split(':');
      const [namespace = 'default', name] = namespaceAndName?.split('/') || [];

      if (!kind || !name) {
        throw new Error(
          `Invalid entity reference format: ${entityRef}. Expected format: kind:namespace/name`,
        );
      }

      let entity: Entity | undefined;

      // get entity
      if (catalog && auth) {
        const credentials = await auth.getOwnServiceCredentials();
        this.logger.info(credentials);
        const entityResponse = await catalog.getEntityByRef(
          { kind, namespace, name },
          { credentials },
        );
        entity = entityResponse || undefined;
      }

      // raise error if there's no techdoc for entity
      if (
        entity &&
        !entity.metadata?.annotations?.['backstage.io/techdocs-ref']
      ) {
        throw new Error(
          `Entity ${entityRef} does not have TechDocs configured`,
        );
      }

      // set target path to default if not specified
      const targetPath = pagePath || 'index.html';

      this.logger.info(
        `Fetching TechDocs content for ${entityRef} at path: ${targetPath}`,
      );

      const techdocsBaseUrl = await this.discovery.getBaseUrl('techdocs');
      const contentUrl = `${techdocsBaseUrl}/static/docs/${namespace}/${kind.toLowerCase()}/${name}/${targetPath}`;

      this.logger.debug(`Fetching content from URL: ${contentUrl}`);
      const fetch = this.fetchFunction || (await import('node-fetch')).default;
      const headers: Record<string, string> = {};

      if (auth) {
        const { token } = await auth.getPluginRequestToken({
          onBehalfOf: await auth.getOwnServiceCredentials(),
          targetPluginId: 'techdocs',
        });
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(contentUrl, { headers });

      // check 404 and err_status cases
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            `TechDocs content not found for ${entityRef} at path: ${targetPath}`,
          );
        }
        throw new Error(
          `Failed to fetch TechDocs content: ${response.status} ${response.statusText}`,
        );
      }

      let content = await response.text();

      // fetch metadata for entity
      const metadata = await this.fetchTechDocsMetadata(
        entity ||
          ({
            kind,
            metadata: { name, namespace },
          } as Entity),
      );

      // try to convert any type to raw text
      let contentType: 'markdown' | 'html' | 'text' = 'text';
      if (targetPath.endsWith('.md')) {
        contentType = 'markdown';
      } else if (targetPath.endsWith('.html') || targetPath.endsWith('.htm')) {
        contentType = 'html';
      }

      // get page title
      let pageTitle: string | undefined;
      if (contentType === 'html') {
        const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          pageTitle = titleMatch[1].trim();
        }
        content = this.convertHtmlToText(content);
        contentType = 'text';
      }

      return {
        entityRef,
        name,
        title: entity?.metadata?.title || name,
        kind,
        namespace,
        content,
        pageTitle,
        path: targetPath,
        contentType,
        lastModified: metadata?.build_timestamp
          ? new Date(metadata.build_timestamp * 1000).toISOString()
          : undefined,
        metadata: metadata
          ? {
              lastUpdated: metadata.build_timestamp
                ? new Date(metadata.build_timestamp * 1000).toISOString()
                : undefined,
              buildTimestamp: metadata.build_timestamp,
              siteName: metadata.site_name,
              siteDescription: metadata.site_description,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve TechDocs content for ${entityRef}: ${error}`,
      );
      throw error;
    }
  }

  // analyzeCoverage:: analyzes the coverage of techdocs
  // in the catalog
  // @public
  async analyzeCoverage(
    options: ListTechDocsOptions = {},
    auth: any,
    catalog: CatalogService,
  ): Promise<TechDocsCoverageResult> {
    const {
      entityType,
      namespace,
      owner,
      lifecycle,
      tags,
      limit = 500,
    } = options;
    const credentials = await auth.getOwnServiceCredentials();

    this.logger.info('Analyzing TechDocs coverage...');

    const filters: Record<string, string | string[]> = {};
    if (entityType) {
      filters.kind = entityType;
    }
    if (namespace) {
      filters['metadata.namespace'] = namespace;
    }
    if (owner) {
      filters['spec.owner'] = owner;
    }
    if (lifecycle) {
      filters['spec.lifecycle'] = lifecycle;
    }
    if (tags) {
      filters['metadata.tags'] = tags;
    }

    const getEntitiesOptions: any = {
      filter: Object.keys(filters).length > 0 ? filters : undefined,
      fields: [
        'kind',
        'metadata.namespace',
        'metadata.name',
        'metadata.annotations',
      ],
      limit,
    };

    const resp = await catalog.getEntities(getEntitiesOptions, { credentials });
    const totalEntities = resp.items.length;

    const entitiesWithDocs = resp.items.filter(
      entity => entity.metadata?.annotations?.['backstage.io/techdocs-ref'],
    ).length;

    const coveragePercentage =
      totalEntities > 0 ? (entitiesWithDocs / totalEntities) * 100 : 0;

    this.logger.info(
      `Coverage analysis complete: ${entitiesWithDocs}/${totalEntities} entities (${coveragePercentage.toFixed(
        1,
      )}%) have TechDocs`,
    );

    return {
      totalEntities,
      entitiesWithDocs,
      coveragePercentage: Math.round(coveragePercentage * 10) / 10, // Round to 1 decimal place
    };
  }

  // listTechDocs:: lists all techdoc entities
  async listTechDocs(
    options: ListTechDocsOptions = {},
    auth: any,
    catalog: CatalogService,
  ): Promise<{ entities: TechDocsEntityWithMetadata[] }> {
    const {
      entityType,
      namespace,
      owner,
      lifecycle,
      tags,
      limit = 500,
    } = options;
    const credentials = await auth.getOwnServiceCredentials();

    this.logger.info('Fetching entities from catalog...');
    const filters: Record<string, string | string[]> = {};
    if (entityType) {
      filters.kind = entityType;
    }
    if (namespace) {
      filters['metadata.namespace'] = namespace;
    }
    if (owner) {
      filters['spec.owner'] = owner;
    }
    if (lifecycle) {
      filters['spec.lifecycle'] = lifecycle;
    }
    if (tags) {
      filters['metadata.tags'] = tags;
    }

    const getEntitiesOptions: any = {
      filter: Object.keys(filters).length > 0 ? filters : undefined,
      fields: [
        'kind',
        'metadata.namespace',
        'metadata.name',
        'metadata.title',
        'metadata.annotations',
        'metadata.tags',
        'metadata.description',
        'metadata.owner',
        'metadata.lifecycle',
        'spec.lifecycle',
        'spec.owner',
      ],
      limit,
    };

    const resp = await catalog.getEntities(getEntitiesOptions, { credentials });

    this.logger.info(
      `Found ${resp.items.length} entities, filtering for techdocs-ref annotation`,
    );

    // filter entities that have techdocs
    const entitiesWithTechDocs = resp.items.filter(
      entity => entity.metadata?.annotations?.['backstage.io/techdocs-ref'],
    );

    const entities = await Promise.all(
      entitiesWithTechDocs.map(async entity => {
        const urls = await this.generateTechDocsUrls(entity);
        const techDocsMetadata = await this.fetchTechDocsMetadata(entity);

        const metadata = techDocsMetadata
          ? {
              lastUpdated: techDocsMetadata.build_timestamp
                ? new Date(
                    techDocsMetadata.build_timestamp * 1000,
                  ).toISOString()
                : undefined,
              buildTimestamp: techDocsMetadata.build_timestamp,
              siteName: techDocsMetadata.site_name,
              siteDescription: techDocsMetadata.site_description,
              etag: techDocsMetadata.etag,
              files: techDocsMetadata.files,
            }
          : undefined;

        return {
          name: entity.metadata.name,
          title: entity.metadata.title || '',
          tags: entity.metadata.tags || [],
          description: entity.metadata.description || '',
          owner: String(entity.metadata.owner || entity.spec?.owner || ''),
          lifecycle: String(
            entity.metadata.lifecycle || entity.spec?.lifecycle || '',
          ),
          namespace: entity.metadata.namespace || 'default',
          kind: entity.kind,
          techDocsUrl: urls.techDocsUrl,
          metadataUrl: urls.metadataUrl,
          metadata,
        };
      }),
    );

    this.logger.info(
      `Successfully found ${entities.length} entities with TechDocs`,
    );

    return { entities };
  }
}
