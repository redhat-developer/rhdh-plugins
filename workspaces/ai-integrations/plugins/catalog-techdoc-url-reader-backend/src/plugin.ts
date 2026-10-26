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

import {
  ReaderFactory,
  ReadUrlResponseFactory,
  urlReaderFactoriesServiceRef,
} from '@backstage/backend-defaults/urlReader';
import {
  coreServices,
  createServiceFactory,
  UrlReaderService,
  UrlReaderServiceReadUrlOptions,
  UrlReaderServiceSearchOptions,
  UrlReaderServiceSearchResponse,
  UrlReaderServiceReadUrlResponse,
  UrlReaderServiceReadTreeOptions,
  UrlReaderServiceReadTreeResponse,
  UrlReaderServiceReadTreeResponseFile,
  UrlReaderServiceReadTreeResponseDirOptions,
  LoggerService,
  AuthService,
} from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { NotFoundError, NotModifiedError } from '@backstage/errors';
import { Readable } from 'stream';
import fs from 'fs';
import platformPath from 'path';
import os from 'os';

export class ModelCatalogBridgeUrlReaderServiceReadTreeResponse
  implements UrlReaderServiceReadTreeResponse
{
  private readonly siteName: string;

  constructor(
    private readonly workDir: string,
    public readonly etag: string,
    private readonly buffer: Promise<Buffer>,
    private readonly logger: LoggerService,
    siteName?: string,
  ) {
    this.siteName = siteName ?? 'Model Card';
    this.logger = logger.child({
      source: 'ModelCatalogBridgeUrlReaderServiceReadTreeResponse"',
    });
  }
  async files(): Promise<UrlReaderServiceReadTreeResponseFile[]> {
    throw new Error(
      'ModelCatalogBridgeUrlReaderServiceReadTreeResponse does not implement files',
    );
  }
  async archive(): Promise<Readable> {
    throw new Error(
      'ModelCatalogBridgeUrlReaderServiceReadTreeResponse does not implement archive',
    );
  }

  async dir(
    options?: UrlReaderServiceReadTreeResponseDirOptions,
  ): Promise<string> {
    const dir =
      options?.targetDir ??
      (await fs.promises.mkdtemp(
        platformPath.join(this.workDir, 'backstage-'),
      ));

    // Write a minimal mkdocs.yml that the TechDocs builder (mkdocs)
    // requires at the project root.
    const mkdocsPath = platformPath.join(dir, 'mkdocs.yml');
    const escapedSiteName = this.siteName.replace(/'/g, "''");
    const mkdocsContent = `site_name: '${escapedSiteName}'\nnav:\n  - Home: index.md\n`;
    try {
      await fs.promises.writeFile(mkdocsPath, mkdocsContent);
    } catch (error) {
      this.logger.error(`Error writing mkdocs.yml to ${mkdocsPath}:`, error);
    }

    const subDir = platformPath.join(dir, 'docs');
    const filePath = platformPath.join(subDir, 'index.md');
    try {
      fs.mkdirSync(subDir);
      const buf = await this.buffer;
      await fs.promises.writeFile(filePath, buf);
    } catch (error) {
      this.logger.error(`Error writing to file ${filePath}:`, error);
    }

    return dir;
  }
}

export type BridgeConfig = {
  id: string;
  name: string;
  kubeflowModelCatalogUrl: string;
  defaultOwner: string;
  defaultLifecycle: string;
};

export function readBridgeConfigs(config: Config): BridgeConfig[] {
  const configs = config.getOptionalConfig('catalog.providers.modelCatalog');
  if (!configs) {
    return [];
  }
  const result: BridgeConfig[] = [];
  for (const connectorId of configs.keys()) {
    const connectorConfig = configs.getConfig(connectorId);
    for (const clusterKey of connectorConfig.keys()) {
      const clusterConfig = connectorConfig.getOptionalConfig(clusterKey);
      if (!clusterConfig) {
        continue;
      }
      if (clusterConfig.has('frequency') || clusterConfig.has('timeout')) {
        continue;
      }
      result.push(readBridgeConfig(connectorId, clusterConfig));
    }
  }
  return result;
}

function safeGetOptionalString(config: Config, key: string): string {
  try {
    return config.getOptionalString(key) ?? '';
  } catch {
    // Backstage ConfigReader throws TypeError for empty-string values
    // (e.g. from env var substitution like ${VAR:-}).
    return '';
  }
}

export function readBridgeConfig(id: string, config: Config): BridgeConfig {
  return {
    id,
    name: safeGetOptionalString(config, 'name'),
    kubeflowModelCatalogUrl: safeGetOptionalString(
      config,
      'kubeflow-model-catalog-url',
    ),
    defaultOwner: safeGetOptionalString(config, 'default-owner'),
    defaultLifecycle: safeGetOptionalString(config, 'default-lifecycle'),
  };
}

// ─── OCI skill TechDocs source configuration ────────────────────────

/** Digest format: sha256:<64 lowercase hex digits>. */
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;

export type SkillSourceConfig = {
  /** Backstage plugin ID of the connector (e.g. 'skill-image-connector'). */
  connectorPluginId: string;
  /** Configured source identifier. */
  sourceId: string;
};

/**
 * Read OCI skill source configurations from
 * `catalog.providers.skillsCatalogProvider.*.sources[]`.
 *
 * Only `oci` source types are supported;
 * `npx` sources are skipped.
 *
 * Source IDs that are blank, `.`, or `..` are rejected because URL
 * parsing normalizes literal and encoded dot segments, making them
 * unreachable as stable path components.
 */
export function readSkillSourceConfigs(config: Config): SkillSourceConfig[] {
  const providerConfigs = config.getOptionalConfig(
    'catalog.providers.skillsCatalogProvider',
  );
  if (!providerConfigs) {
    return [];
  }

  const result: SkillSourceConfig[] = [];
  const seen = new Set<string>();

  for (const providerId of providerConfigs.keys()) {
    const providerConfig = providerConfigs.getConfig(providerId);
    const sourcesConfig = providerConfig.getOptionalConfigArray('sources');
    if (!sourcesConfig) {
      continue;
    }

    for (const sourceConfig of sourcesConfig) {
      const sourceType = safeGetOptionalString(sourceConfig, 'sourceType');
      if (sourceType !== 'oci') {
        continue; // npx and other source types are not supported
      }

      const connectorPluginId = safeGetOptionalString(
        sourceConfig,
        'connectorPluginId',
      );
      if (!connectorPluginId) {
        continue;
      }

      const sourceId = safeGetOptionalString(sourceConfig, 'sourceId');
      if (
        !sourceId.trim() ||
        sourceId.trim() === '.' ||
        sourceId.trim() === '..'
      ) {
        continue; // Reject blank, dot, and dot-dot source IDs
      }

      // Deduplicate across provider instances
      const key = `${connectorPluginId}:${sourceId}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      result.push({ connectorPluginId, sourceId });
    }
  }

  return result;
}

export class ModeCatalogBridgeTechdocUrlReader implements UrlReaderService {
  private readonly workDir: string;
  private readonly logger: LoggerService;
  private readonly bridgeConfigs: BridgeConfig[];
  private readonly skillSourceConfigs: Array<
    SkillSourceConfig & { connectorBase: URL }
  >;

  // TODO we are limited in which core services can be passed into the ReaderFactory, so as a work around we
  // define these globals that are set in the plugin init method; if we merge this plugin with the
  // kserve-kubeflow-connector plugins, and bypass the need for plugin to plugin REST calls, we can
  // bypass the need for the auth service.
  static auth: AuthService;

  /**
   * Legacy factory for model-card URLs only; skill documentation fails closed
   * without discovery-resolved connector bases. Register
   * `catalogTechdocUrlReaderPlugin` for OCI skill documentation support.
   */
  static factory: ReaderFactory = ({ config, logger }) => {
    const reader = new ModeCatalogBridgeTechdocUrlReader(config, logger);
    return [{ reader, predicate: reader.bridgePredicate }];
  };

  constructor(
    config: Config,
    logger: LoggerService,
    trustedConnectorBases: ReadonlyMap<string, string> = new Map(),
  ) {
    this.logger = logger.child({
      source: 'ModeCatalogBridgeTechdocUrlReader"',
    });
    this.bridgeConfigs = readBridgeConfigs(config);
    // Bases come only from service discovery during factory initialization.
    // Direct construction without them fails closed for skill documentation.
    this.skillSourceConfigs = readSkillSourceConfigs(config).flatMap(source => {
      const base = trustedConnectorBases.get(source.connectorPluginId);
      if (!base) return [];
      const connectorBase = new URL(base);
      if (
        !['http:', 'https:'].includes(connectorBase.protocol) ||
        connectorBase.username ||
        connectorBase.password ||
        connectorBase.search ||
        connectorBase.hash
      )
        throw new Error(
          `Invalid discovered connector base for ${source.connectorPluginId}`,
        );
      return [{ ...source, connectorBase }];
    });
    this.workDir = os.tmpdir();

    const bkend = config.getOptionalString('backend.workingDirectory');
    if (bkend) {
      this.workDir = bkend;
    }
  }

  private matchingBridgeConfig(url: URL): BridgeConfig | undefined {
    // Skill documentation must never fall through to the legacy substring matcher.
    if (url.pathname.includes('/skilldocs/')) return undefined;
    for (let index = 0; index < this.bridgeConfigs.length; index++) {
      const bc = this.bridgeConfigs[index];
      if (url.pathname.includes('modelcard') && url.pathname.includes(bc.id)) {
        return bc;
      }
    }
    return undefined;
  }

  /**
   * Match a URL against configured OCI skill source destinations.
   *
   * Requires the discovered origin and complete base pathname, followed by
   *   /skilldocs/<sourceId>/<digest>
   *
   * Rejects URLs with query strings, fragments, URL credentials,
   * extra path segments, or invalid digest format.
   */
  private matchingSkillSourceConfig(url: URL): SkillSourceConfig | undefined {
    // Reject URL credentials
    if (url.username || url.password) return undefined;
    // Reject query strings and fragments
    if (url.search || url.hash) return undefined;

    const pathname = url.pathname;

    for (const source of this.skillSourceConfigs) {
      if (url.origin !== source.connectorBase.origin) continue;
      const basePath = `${source.connectorBase.pathname.replace(
        /\/+$/,
        '',
      )}/skilldocs/`;
      if (!pathname.startsWith(basePath)) continue;

      const remainder = pathname.substring(basePath.length);
      // remainder must be exactly <encodedSourceId>/<encodedDigest>
      const parts = remainder.split('/');
      if (parts.length !== 2 || parts[0] === '' || parts[1] === '') continue;

      let sourceId: string;
      let digest: string;
      try {
        sourceId = decodeURIComponent(parts[0]);
        digest = decodeURIComponent(parts[1]);
      } catch {
        // Reader predicates reject malformed input rather than breaking selection.
        continue;
      }

      // Validate source ID matches configuration
      if (sourceId !== source.sourceId) continue;

      // Validate digest format: sha256:<64 lowercase hex digits>
      if (!DIGEST_RE.test(digest)) continue;

      return source;
    }
    return undefined;
  }

  bridgePredicate = (url: URL): boolean => {
    return (
      this.matchingBridgeConfig(url) !== undefined ||
      this.matchingSkillSourceConfig(url) !== undefined
    );
  };

  async readUrl(
    url: string,
    options?: UrlReaderServiceReadUrlOptions,
  ): Promise<UrlReaderServiceReadUrlResponse> {
    this.logger.info(`ModelCatalogBridgeTechdocUrlReader.readUrl of ${url}`);
    const parsedUrl = new URL(url);

    // Try model-card match first (preserve existing behavior)
    const bc = this.matchingBridgeConfig(parsedUrl);
    if (bc) {
      return this.readModelCardUrl(url, bc, options);
    }

    // Try OCI skill docs match
    const sc = this.matchingSkillSourceConfig(parsedUrl);
    if (sc) {
      return this.readSkillDocsUrl(url, sc, options);
    }

    throw new Error(`No matching config for ${url}`);
  }

  private async readModelCardUrl(
    url: string,
    bc: BridgeConfig,
    options?: UrlReaderServiceReadUrlOptions,
  ): Promise<UrlReaderServiceReadUrlResponse> {
    let response: Response;
    try {
      const token =
        await ModeCatalogBridgeTechdocUrlReader.auth.getPluginRequestToken({
          onBehalfOf:
            await ModeCatalogBridgeTechdocUrlReader.auth.getOwnServiceCredentials(),
          targetPluginId: bc.id,
        });
      this.logger.info(`Using service-to-service token for ${url}`);
      response = await fetch(url, {
        method: 'GET',
        redirect: 'error',
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
        signal: options?.signal as any,
      });
    } catch (e) {
      throw new Error(`Unable to read ${url}, ${e}`);
    }

    if (response.ok) {
      return ReadUrlResponseFactory.fromResponse(response);
    }

    const message = `could not read ${url}, ${response.status} ${response.statusText}`;
    if (response.status === 404) {
      throw new NotFoundError(message);
    }
    if (response.status === 304) {
      throw new NotModifiedError();
    }
    throw new Error(message);
  }

  /**
   * Fetch OCI skill documentation from the connector.
   *
   * - Authenticates with `auth.getPluginRequestToken` targeting the
   *   connector plugin's registered pluginId.
   * - Forwards the caller's ETag as `If-None-Match` for conditional requests.
   * - Rejects redirects without forwarding service tokens.
   * - Propagates 404 as NotFoundError, 304 as NotModifiedError.
   */
  private async readSkillDocsUrl(
    url: string,
    source: SkillSourceConfig,
    options?: UrlReaderServiceReadUrlOptions,
  ): Promise<UrlReaderServiceReadUrlResponse> {
    const headers: Record<string, string> = {};

    let response: Response;
    try {
      const token =
        await ModeCatalogBridgeTechdocUrlReader.auth.getPluginRequestToken({
          onBehalfOf:
            await ModeCatalogBridgeTechdocUrlReader.auth.getOwnServiceCredentials(),
          targetPluginId: source.connectorPluginId,
        });
      headers.Authorization = `Bearer ${token.token}`;

      // Forward caller's ETag for conditional requests (D8)
      if (options?.etag) {
        headers['If-None-Match'] = options.etag;
      }

      this.logger.info(
        `Fetching OCI skill documentation from ${url} (connector: ${source.connectorPluginId})`,
      );
      response = await fetch(url, {
        method: 'GET',
        headers,
        redirect: 'error',
        // Node fetch otherwise adds Cache-Control: no-cache for conditional
        // headers, preventing Express req.fresh from returning 304.
        cache: options?.etag ? 'no-cache' : undefined,
        signal: options?.signal as any,
      });
    } catch (e) {
      throw new Error(`Unable to read ${url}, ${e}`);
    }

    if (response.ok) {
      if (!response.headers.get('etag')?.trim()) {
        await response.body?.cancel();
        throw new Error(
          'Skill documentation response is missing a nonblank ETag',
        );
      }
      return ReadUrlResponseFactory.fromResponse(response);
    }

    const message = `could not read ${url}, ${response.status} ${response.statusText}`;
    if (response.status === 404) {
      throw new NotFoundError(message);
    }
    if (response.status === 304) {
      throw new NotModifiedError();
    }
    throw new Error(message);
  }

  async search(
    url: string,
    options?: UrlReaderServiceSearchOptions,
  ): Promise<UrlReaderServiceSearchResponse> {
    this.logger.info(
      `ModelCatalogBridgeTechdocUrlReader.search of ${url} with options ${JSON.stringify(
        options,
      )}`,
    );

    throw new Error(
      'ModeCatalogBridgeTechdocUrlReader does not implement search',
    );
    // const { pathname } = new URL(url);

    // if (pathname.match(/[*?]/)) {
    //   throw new Error('Unsupported search pattern URL');
    // }

    // try {
    //   const data = await this.readUrl(url, options);

    //   return {
    //     files: [
    //       {
    //         url: url,
    //         content: data.buffer,
    //         lastModifiedAt: data.lastModifiedAt,
    //       },
    //     ],
    //     etag: data.etag ?? '',
    //   };
    // } catch (error) {
    //   assertError(error);
    //   if (error.name === 'NotFoundError') {
    //     return {
    //       files: [],
    //       etag: '',
    //     };
    //   }
    //   throw error;
    // }
  }

  async readTree(
    url: string,
    options?: UrlReaderServiceReadTreeOptions,
  ): Promise<UrlReaderServiceReadTreeResponse> {
    this.logger.info(`ModelCatalogBridgeTechdocUrlReader.readTree of ${url}`);
    const parsedUrl = new URL(url);

    const data = await this.readUrl(url, options);

    // Mirror readUrl's priority: bridge config first, then skill docs
    const isSkillDocs =
      this.matchingBridgeConfig(parsedUrl) === undefined &&
      this.matchingSkillSourceConfig(parsedUrl) !== undefined;

    if (isSkillDocs) {
      // Use the connector's response ETag for TechDocs caching (D8).
      if (!data.etag?.trim()) {
        throw new Error(
          'Skill documentation response is missing a nonblank ETag',
        );
      }
      return new ModelCatalogBridgeUrlReaderServiceReadTreeResponse(
        this.workDir,
        data.etag,
        data.buffer(),
        this.logger,
        'Skill Documentation',
      );
    }

    // Preserve existing model-card behavior
    const et = options?.etag;
    if (!et) {
      return new ModelCatalogBridgeUrlReaderServiceReadTreeResponse(
        this.workDir,
        '',
        data.buffer(),
        this.logger,
      );
    }
    return new ModelCatalogBridgeUrlReaderServiceReadTreeResponse(
      this.workDir,
      et,
      data.buffer(),
      this.logger,
    );
  }
}

/**
 * catalogTechdocUrlReaderPlugin define the factory for the ModelCatalogBridgeUrlReader service
 *
 * @public
 */
export const catalogTechdocUrlReaderPlugin = createServiceFactory({
  service: urlReaderFactoriesServiceRef,
  deps: {
    logger: coreServices.logger,
    auth: coreServices.auth,
    discovery: coreServices.discovery,
    config: coreServices.rootConfig,
  },
  async factory({ logger, auth, discovery, config }) {
    logger
      .child({ source: 'catalogTechdocUrlReaderPlugin"' })
      .info('Registering the model catalog bridge URL reader ');

    ModeCatalogBridgeTechdocUrlReader.auth = auth;

    // Reader predicates are synchronous, so resolve trusted destinations before
    // publishing the factory. Do not infer a destination from annotation text.
    const trustedConnectorBases = new Map<string, string>();
    const connectorIds = new Set(
      readSkillSourceConfigs(config).map(source => source.connectorPluginId),
    );
    for (const connectorId of connectorIds) {
      trustedConnectorBases.set(
        connectorId,
        await discovery.getBaseUrl(connectorId),
      );
    }
    return ({ config: readerConfig, logger: readerLogger }) => {
      const reader = new ModeCatalogBridgeTechdocUrlReader(
        readerConfig,
        readerLogger,
        trustedConnectorBases,
      );
      return [{ reader, predicate: reader.bridgePredicate }];
    };
  },
});
