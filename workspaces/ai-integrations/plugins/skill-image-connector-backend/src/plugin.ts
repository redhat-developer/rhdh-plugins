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
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import {
  boundSnapshot,
  buildOciRef,
  createLoadingSnapshot,
  isValidDigest,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type {
  OciSkillRecord,
  SkillSnapshot,
  SnapshotSource,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import { createRouter } from './router';
import type { SkillImageProcessingStatus } from './router';
import {
  ManifestResponseError,
  OCI_REGISTRY_PATTERN,
  validateTag,
  parseImageRef,
  fetchManifest,
} from './services/OciClient';
import { discoverQuayRepositorySnapshot } from './services/QuayDiscovery';
import {
  AmbiguousSkillFilesError,
  ExtractionBoundsError,
  NonSkillImageError,
  cleanupSkillImageExtraction,
  cleanupStaleExtractionDirs,
  fetchAndExtractSkillImage,
} from './services/SkillImageService';
import { normalizeSkillImageExtraction } from './services/normalizeExtraction';
import type {
  QuayDiscoveryConfig,
  RegistryCredentials,
  SkillImageConfig,
  SkillImageExtraction,
  SkillImageOptions,
  SourceConfig,
} from './services/types';
import { MAX_CONCURRENT_IMAGE_FETCHES, MAX_CANDIDATES } from './services/types';
import { withRetry } from './services/Retry';
import { readSkillImageOptions, readSourceConfigs } from './services/config';

/**
 * Safely read an optional string from a Backstage Config object.
 * ConfigReader throws TypeError for empty-string values from
 * env var substitution like ${VAR:-}, so we catch and return undefined.
 */
function safeGetOptionalString(
  config: Config,
  key: string,
): string | undefined {
  try {
    return config.getOptionalString(key);
  } catch {
    return undefined;
  }
}

function validateTokenRealm(tokenRealm: string, imageRef: string): void {
  let tokenRealmUrl: URL;
  try {
    tokenRealmUrl = new URL(tokenRealm);
  } catch {
    throw new InputError(
      `Invalid credentials for skill image ${imageRef}: tokenRealm must be a valid HTTPS URL`,
    );
  }
  if (
    tokenRealmUrl.protocol !== 'https:' ||
    tokenRealmUrl.username ||
    tokenRealmUrl.password
  ) {
    throw new InputError(
      `Invalid credentials for skill image ${imageRef}: tokenRealm must be a valid HTTPS URL without credentials`,
    );
  }
}

function readImageCredentials(
  entry: Config,
  imageRef: string,
): RegistryCredentials | undefined {
  const credentialsConfig = entry.getOptionalConfig('credentials');
  if (!credentialsConfig) {
    return undefined;
  }

  const username = safeGetOptionalString(credentialsConfig, 'username');
  const password = safeGetOptionalString(credentialsConfig, 'password');
  const tokenRealm = safeGetOptionalString(credentialsConfig, 'tokenRealm');
  if (Boolean(username) !== Boolean(password)) {
    throw new InputError(
      `Invalid credentials for skill image ${imageRef}: username and password must be provided together`,
    );
  }
  if (tokenRealm) {
    validateTokenRealm(tokenRealm, imageRef);
  }

  if (!username && !password && !tokenRealm) {
    return undefined;
  }
  return {
    ...(username && password ? { username, password } : {}),
    ...(tokenRealm ? { tokenRealm } : {}),
  };
}

/** Comparison key only: preserve the original reference and tag casing. */
function imageRefComparisonKey(imageRef: string): string {
  return imageRef.replace(
    /^((?:oci:\/\/)?)([^/]+)\//,
    (_match, prefix: string, registry: string) =>
      `${prefix}${registry.toLowerCase()}/`,
  );
}

function parseConfiguredImage(
  entry: Config,
  index: number,
  seenImageRefs: Set<string>,
  logger?: Pick<LoggerService, 'warn'>,
): SkillImageConfig | undefined {
  const imageRef = safeGetOptionalString(entry, 'imageRef')?.trim();
  if (!imageRef) {
    logger?.warn(
      `Skipping skill image configuration at index ${index}: imageRef is missing`,
    );
    return undefined;
  }

  const comparisonKey = imageRefComparisonKey(imageRef);
  if (seenImageRefs.has(comparisonKey)) {
    logger?.warn(
      `Skipping duplicate skill image configuration for ${imageRef}`,
    );
    return undefined;
  }

  seenImageRefs.add(comparisonKey);
  const credentials = readImageCredentials(entry, imageRef);
  return {
    id: `image-${index}`,
    imageRef,
    ...(credentials ? { credentials } : {}),
  };
}

/**
 * Reads skill image configuration entries from app-config.
 *
 * Expected config shape:
 * ```yaml
 * skillImageConnector:
 *   images:
 *     - imageRef: quay.io/gabemontero/hello-world-skill:1.0.0-draft
 * ```
 */
export function readSkillImageConfigs(
  config: Config,
  logger?: Pick<LoggerService, 'warn'>,
): SkillImageConfig[] {
  const pluginConfig = config.getOptionalConfig('skillImageConnector');
  if (!pluginConfig) {
    return [];
  }

  const imagesConfig = pluginConfig.getOptionalConfigArray('images');
  if (!imagesConfig) {
    return [];
  }

  const results: SkillImageConfig[] = [];
  const seenImageRefs = new Set<string>();
  for (const [index, entry] of imagesConfig.entries()) {
    const imageConfig = parseConfiguredImage(
      entry,
      index,
      seenImageRefs,
      logger,
    );
    if (imageConfig) {
      results.push(imageConfig);
    }
  }

  return results;
}

/**
 * Reads skill image configs from a specific source config entry.
 */
function readSourceImageConfigs(
  sourceEntry: Config,
  logger?: Pick<LoggerService, 'warn'>,
): SkillImageConfig[] {
  const imagesConfig = sourceEntry.getOptionalConfigArray('images');
  if (!imagesConfig) return [];

  const results: SkillImageConfig[] = [];
  const seenImageRefs = new Set<string>();
  for (const [index, entry] of imagesConfig.entries()) {
    const imageConfig = parseConfiguredImage(
      entry,
      index,
      seenImageRefs,
      logger,
    );
    if (imageConfig) {
      results.push(imageConfig);
    }
  }
  return results;
}

/**
 * Reads Quay organization discovery configuration from app-config.
 *
 * Expected config shape:
 * ```yaml
 * skillImageConnector:
 *   quayDiscovery:
 *     registry: quay.io          # optional, defaults to quay.io
 *     organization: my-org       # enables discovery; omitted/blank skips with a warning
 *     tag: latest                # optional exact filter; omit for all active tags
 * ```
 */
export function readQuayDiscoveryConfig(
  config: Config,
  logger?: Pick<LoggerService, 'warn'>,
): QuayDiscoveryConfig | undefined {
  const pluginConfig = config.getOptionalConfig('skillImageConnector');
  if (!pluginConfig) {
    return undefined;
  }

  const discoveryConfig = pluginConfig.getOptionalConfig('quayDiscovery');
  if (!discoveryConfig) {
    return undefined;
  }

  return parseQuayDiscoveryConfig(discoveryConfig, logger);
}

/**
 * Parses Quay discovery config from a Config object (source or top-level).
 */
function parseQuayDiscoveryConfig(
  discoveryConfig: Config,
  logger?: Pick<LoggerService, 'warn'>,
): QuayDiscoveryConfig | undefined {
  const organization = safeGetOptionalString(
    discoveryConfig,
    'organization',
  )?.trim();
  if (!organization) {
    logger?.warn(
      'quayDiscovery.organization is missing; skipping Quay discovery',
    );
    return undefined;
  }

  const registry =
    safeGetOptionalString(discoveryConfig, 'registry')?.trim() || 'quay.io';
  if (!OCI_REGISTRY_PATTERN.test(registry)) {
    throw new InputError(
      `Invalid quayDiscovery.registry value '${registry}': must be a valid registry host`,
    );
  }
  const configuredTag = discoveryConfig.getOptional('tag');
  if (
    configuredTag !== undefined &&
    configuredTag !== null &&
    typeof configuredTag !== 'string'
  ) {
    throw new InputError('quayDiscovery.tag must be a string when provided');
  }
  const tag = (configuredTag as string | undefined | null)?.trim() || undefined;
  if (tag !== undefined) {
    validateTag(tag, 'quayDiscovery.tag');
  }

  return { registry, organization, ...(tag === undefined ? {} : { tag }) };
}

/**
 * Merges discovered image references into an existing list of explicit
 * image configs, skipping duplicates and enforcing the configured image cap.
 * Uses a separate zero-based counter for discovered image IDs.
 */
export function mergeDiscoveredRefs(
  existingConfigs: readonly SkillImageConfig[],
  discoveredRefs: string[],
  maxImages: number,
  logger: Pick<LoggerService, 'warn'>,
): { merged: SkillImageConfig[]; added: number; skipped: number } {
  const allImageConfigs: SkillImageConfig[] = [...existingConfigs];
  const existingRefSet = new Set(
    existingConfigs.map(c => imageRefComparisonKey(c.imageRef)),
  );
  let discoveredAdded = 0;
  let discoveredSkipped = 0;

  for (const ref of discoveredRefs) {
    const comparisonKey = imageRefComparisonKey(ref);
    if (existingRefSet.has(comparisonKey)) {
      continue;
    }
    existingRefSet.add(comparisonKey);
    if (allImageConfigs.length < maxImages) {
      allImageConfigs.push({
        id: `discovered-${discoveredAdded}`,
        imageRef: ref,
        logNotFoundAsError: false,
      });
      discoveredAdded++;
    } else {
      discoveredSkipped++;
    }
  }

  if (discoveredSkipped > 0) {
    logger.warn(
      `${discoveredSkipped} discovered image candidate(s) were dropped because the total ` +
        `image count would exceed the maximum of ${maxImages}`,
    );
  }

  return {
    merged: allImageConfigs,
    added: discoveredAdded,
    skipped: discoveredSkipped,
  };
}

/** Report failures according to whether the caller expects the image to exist. */
function logImageProcessingFailure(
  logger: LoggerService,
  imageRef: string,
  error: unknown,
  logNotFoundAsError: boolean,
): void {
  if (
    !logNotFoundAsError &&
    error instanceof ManifestResponseError &&
    error.status === 404
  ) {
    logger.debug(`Discovered skill image ${imageRef} was not found (404)`);
    return;
  }
  logger.error(`Failed to process skill image ${imageRef}`, error as Error);
}

/**
 * Builds a stable OCI skill key from a parsed image reference.
 *
 * The key uses the lowercase registry host, repository path, and exact
 * case-sensitive tag. It excludes the manifest digest.
 *
 * @internal Exported for testing.
 */
export function buildAcquisitionKey(imageRef: {
  registry: string;
  repository: string;
  tag: string;
}): string {
  return `${imageRef.registry.toLowerCase()}/${imageRef.repository}:${
    imageRef.tag
  }`;
}

/**
 * Builds a digest-addressed OCI source URI.
 *
 * Returns `oci://<registry>/<repository>@<digest>` with the registry
 * lowercased to match the normalization in {@link buildAcquisitionKey}.
 *
 * Delegates to the shared `buildOciRef` helper, insulating the plugin
 * from changes in the common library's API surface.
 *
 * @internal Exported for testing.
 */
export function buildSourceUri(
  registry: string,
  repository: string,
  digest: string,
): string {
  return buildOciRef(registry.toLowerCase(), repository, digest);
}

/**
 * Resolves a tag to a digest, then retries the whole image acquisition
 * using the pinned digest. Tag resolution and image extraction each
 * use the configured retry policy independently.
 *
 * For tag references: the tag is resolved once. All subsequent manifest
 * fetches (including retries) use the pinned digest, preventing a
 * mutable tag from redirecting to different content mid-acquisition.
 *
 * For explicit digest references: acquisition proceeds directly without
 * a separate resolution step, and no tagged identity is produced.
 */
async function fetchWithRetry(
  imageRefStr: string,
  workDir: string | undefined,
  logger: LoggerService,
  credentials: RegistryCredentials | undefined,
  signal: AbortSignal,
  options: SkillImageOptions,
): Promise<SkillImageExtraction> {
  const imageRef = parseImageRef(imageRefStr);

  // Explicit digest reference — no tag resolution, no tagged identity
  if (imageRef.digest) {
    return withRetry(
      () =>
        fetchAndExtractSkillImage(
          imageRefStr,
          workDir,
          logger,
          credentials,
          signal,
          options,
        ),
      options,
      logger,
      imageRefStr,
      signal,
    );
  }

  // Tag reference — resolve the mutable tag to a SHA-256 digest first.
  // Failed resolution attempts use the existing bounded retry policy.
  logger.info(`Resolving tag for ${imageRefStr}`);
  const { digest: resolvedDigest } = await withRetry(
    () => fetchManifest(imageRef, logger, credentials, signal, options),
    options,
    logger,
    `tag resolution for ${imageRefStr}`,
    signal,
  );
  if (!isValidDigest(resolvedDigest)) {
    throw new Error(`Invalid resolved manifest digest for ${imageRefStr}`);
  }
  logger.info(`Resolved ${imageRefStr} to ${resolvedDigest}`);

  // Build the pinned reference: tag is preserved for identity, digest
  // ensures all subsequent fetches address the resolved content.
  const pinnedRefStr = `${imageRef.registry}/${imageRef.repository}:${imageRef.tag}@${resolvedDigest}`;

  // Acquisition with pinned digest — retries reuse the resolved digest
  const extraction = await withRetry(
    () =>
      fetchAndExtractSkillImage(
        pinnedRefStr,
        workDir,
        logger,
        credentials,
        signal,
        options,
      ),
    options,
    logger,
    imageRefStr,
    signal,
  );

  // Return a new object with verified acquisition metadata for tagged references
  return {
    ...extraction,
    acquisition: {
      key: buildAcquisitionKey(imageRef),
      digest: resolvedDigest,
      sourceUri: buildSourceUri(
        imageRef.registry,
        imageRef.repository,
        resolvedDigest,
      ),
    },
  };
}

/**
 * Safely attempt to add a failed key for the given image reference.
 * If the reference cannot be parsed (e.g. malformed discovered refs),
 * no key is added — the image still appears in failedImageRefs for
 * /images backward compat.
 */
function tryAddFailedKey(imageRefStr: string, failedKeys: string[]): void {
  try {
    const parsed = parseImageRef(imageRefStr);
    if (!parsed.digest) {
      failedKeys.push(buildAcquisitionKey(parsed));
    }
  } catch {
    // Unparseable reference — no stable key can be derived
  }
}

/**
 * Result of one source refresh cycle.
 * @internal
 */
interface SourceRefreshResult {
  /** Successful raw extractions keyed by image reference. */
  extractions: Map<string, SkillImageExtraction>;
  /** Normalized OCI skill records from successful, tagged extractions. */
  records: OciSkillRecord[];
  /** Stable keys of known failed candidates. */
  failedKeys: string[];
  /** Raw image references that failed (for /images backward compat). */
  failedImageRefs: string[];
  /** Whether discovery completed without failures or budget exhaustion. */
  discoveryComplete: boolean;
  /** Whether explicit candidates or a valid discovery page were available. */
  discoveryUsable: boolean;
}

/**
 * Runs one complete acquisition cycle for a source:
 * discovery → merge → concurrent fetch → normalization.
 *
 * The result contains all data needed to build a SkillSnapshot and
 * update the raw /images endpoint.
 *
 * @internal Exported for testing.
 */
export async function performSourceRefresh(
  source: SourceConfig,
  baseOptions: SkillImageOptions,
  logger: LoggerService,
  workDir: string | undefined,
  parentSignal: AbortSignal,
): Promise<SourceRefreshResult> {
  const extractions = new Map<string, SkillImageExtraction>();
  const records: OciSkillRecord[] = [];
  const failedKeys: string[] = [];
  const failedImageRefs: string[] = [];
  const nonSkillRefs = new Set<string>();
  let discoveryComplete = true;
  let discoveryUsable = source.images.length > 0;
  const options = Object.freeze({
    ...baseOptions,
    allowedOrigins: source.allowedOrigins,
  });

  // Source-operation deadline: bounds the total wall-clock time
  const refreshController = new AbortController();
  const onAbort = () => refreshController.abort(parentSignal.reason);
  if (parentSignal.aborted) onAbort();
  else parentSignal.addEventListener('abort', onAbort, { once: true });
  const deadlineTimer = setTimeout(() => {
    if (!refreshController.signal.aborted) {
      logger.warn(
        `Source operation deadline reached (${options.sourceOperationDeadlineMs}ms) ` +
          `for source ${source.id}; aborting remaining work`,
      );
      refreshController.abort(new Error('Source operation deadline exceeded'));
    }
  }, options.sourceOperationDeadlineMs);

  const signal = refreshController.signal;
  let aggregateContentSize = 0;
  let candidatesInspected = 0;

  try {
    let allImageConfigs: SkillImageConfig[] = [...source.images];

    // Run Quay organization discovery if configured
    if (source.quayDiscovery) {
      try {
        const discovery = await discoverQuayRepositorySnapshot(
          source.quayDiscovery,
          logger,
          signal,
          options,
        );
        discoveryUsable ||= discovery.usable;
        discoveryComplete = discovery.complete;
        const mergeResult = mergeDiscoveredRefs(
          source.images,
          discovery.imageRefs,
          options.maxImages,
          logger,
        );
        allImageConfigs = mergeResult.merged;

        logger.info(
          `Quay discovery added ${mergeResult.added} new image(s) to process` +
            ` for source ${source.id}`,
        );

        if (mergeResult.added > 0) {
          logger.warn(
            `${mergeResult.added} discovered image(s) use mutable tags. ` +
              'Use digest references in production to prevent tag mutation attacks.',
          );
        }
        if (mergeResult.skipped > 0) {
          discoveryComplete = false;
        }
      } catch (error) {
        discoveryComplete = false;
        if (!signal.aborted) {
          logger.error(
            `Quay organization discovery failed for ${source.quayDiscovery.organization}`,
            error as Error,
          );
        }
      }
    }

    let nextImageIndex = 0;
    const processNextImage = async () => {
      while (!signal.aborted && nextImageIndex < allImageConfigs.length) {
        if (candidatesInspected >= MAX_CANDIDATES) {
          logger.warn(
            `Candidate inspection limit reached (${MAX_CANDIDATES}); stopping`,
          );
          discoveryComplete = false;
          break;
        }
        candidatesInspected++;

        const imageIndex = nextImageIndex++;
        const imgConfig = allImageConfigs[imageIndex];
        try {
          const result = await fetchWithRetry(
            imgConfig.imageRef,
            workDir,
            logger,
            imgConfig.credentials,
            signal,
            options,
          );

          const contentSize =
            Buffer.byteLength(result.skillImageYaml, 'utf-8') +
            Buffer.byteLength(result.skillsMd, 'utf-8');
          if (
            aggregateContentSize + contentSize >
            options.maxAggregateContentSizeBytes
          ) {
            logger.error(
              `Aggregate content budget exceeded after ${imgConfig.imageRef}; ` +
                `${aggregateContentSize + contentSize} bytes would exceed ` +
                `${options.maxAggregateContentSizeBytes} byte limit`,
            );
            await cleanupSkillImageExtraction(result, logger);
            failedImageRefs.push(imgConfig.imageRef);
            if (result.acquisition) {
              failedKeys.push(result.acquisition.key);
            }
          } else {
            aggregateContentSize += contentSize;
            extractions.set(imgConfig.imageRef, result);

            // Normalize the extracted content
            const normalization = normalizeSkillImageExtraction(result);
            if (
              normalization.outcome === 'normalized' &&
              normalization.record
            ) {
              records.push(normalization.record);
              logger.info(
                `Successfully extracted and normalized skill image ${imgConfig.imageRef}`,
              );
            } else if (normalization.outcome === 'malformed') {
              // Bare-digest refs and malformed files produce malformed outcomes.
              // Bare-digest exclusion is a deliberate policy (D4: keys require tags)
              // and does not affect snapshot completeness. Malformed tagged refs
              // do affect completeness.
              if (result.acquisition) {
                failedKeys.push(result.acquisition.key);
                discoveryComplete = false;
              }
              logger.warn(
                `Extracted skill image ${imgConfig.imageRef} but normalization ` +
                  `${normalization.outcome}: ${normalization.diagnostics
                    .map(d => d.message)
                    .join('; ')}`,
              );
            } else {
              logger.warn(
                `Extracted skill image ${imgConfig.imageRef} but normalization ` +
                  `${normalization.outcome}: ${normalization.diagnostics
                    .map(d => d.message)
                    .join('; ')}`,
              );
            }
          }
        } catch (error) {
          if (!signal.aborted) {
            if (error instanceof NonSkillImageError) {
              nonSkillRefs.add(imgConfig.imageRef);
              // Confirmed non-skills: skipped, no failed key, no impact on completeness
              logger.debug(
                `Image ${imgConfig.imageRef} is not a skill image: ${error.message}`,
              );
            } else if (error instanceof AmbiguousSkillFilesError) {
              failedImageRefs.push(imgConfig.imageRef);
              tryAddFailedKey(imgConfig.imageRef, failedKeys);
              discoveryComplete = false;
              logger.error(
                `Ambiguous skill image ${imgConfig.imageRef}: ${error.message}`,
              );
            } else if (error instanceof ExtractionBoundsError) {
              failedImageRefs.push(imgConfig.imageRef);
              tryAddFailedKey(imgConfig.imageRef, failedKeys);
              discoveryComplete = false;
              logger.error(
                `Extraction bounds exceeded for ${imgConfig.imageRef}: ${error.message}`,
              );
            } else {
              failedImageRefs.push(imgConfig.imageRef);
              tryAddFailedKey(imgConfig.imageRef, failedKeys);
              discoveryComplete = false;
              logImageProcessingFailure(
                logger,
                imgConfig.imageRef,
                error,
                imgConfig.logNotFoundAsError ?? true,
              );
            }
          }
        }
      }
    };

    await Promise.all(
      Array.from(
        {
          length: Math.min(
            MAX_CONCURRENT_IMAGE_FETCHES,
            allImageConfigs.length,
          ),
        },
        processNextImage,
      ),
    );

    // If the signal was aborted (deadline or cancellation), discovery is incomplete
    if (signal.aborted || nextImageIndex < allImageConfigs.length) {
      discoveryComplete = false;
      // The selected tag identities are known even when cancellation or a
      // shared work bound prevents their acquisition from completing.
      for (const image of allImageConfigs) {
        if (
          !extractions.has(image.imageRef) &&
          !nonSkillRefs.has(image.imageRef) &&
          !failedImageRefs.includes(image.imageRef)
        ) {
          failedImageRefs.push(image.imageRef);
          tryAddFailedKey(image.imageRef, failedKeys);
        }
      }
    }
  } finally {
    clearTimeout(deadlineTimer);
    parentSignal.removeEventListener('abort', onAbort);
  }

  return {
    extractions,
    records,
    failedKeys,
    failedImageRefs,
    discoveryComplete,
    discoveryUsable,
  };
}

/**
 * Builds a SkillSnapshot from refresh results.
 * @internal Exported for testing.
 */
export function buildSnapshotFromRefresh(
  snapshotSource: SnapshotSource,
  result: SourceRefreshResult,
  hasConfiguredSources: boolean,
): SkillSnapshot {
  const allFailed =
    hasConfiguredSources &&
    !result.discoveryUsable &&
    !result.discoveryComplete;

  if (allFailed) {
    const sortedFailedKeys = [...result.failedKeys].sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
    return {
      schemaVersion: '1' as const,
      source: snapshotSource,
      status: 'failed' as const,
      observedAt: new Date().toISOString(),
      skills: [],
      failedSkillKeys: sortedFailedKeys,
    };
  }

  return boundSnapshot({
    source: snapshotSource,
    records: result.records,
    failedSkillKeys: result.failedKeys,
    discoveryComplete: result.discoveryComplete,
    observedAt: new Date().toISOString(),
  });
}

/**
 * Validates a source's configuration before scheduling.
 */
function validateSourceConfig(
  source: SourceConfig,
  options: SkillImageOptions,
  logger: LoggerService,
): void {
  const hasConfiguredSources =
    source.images.length > 0 || source.quayDiscovery !== undefined;

  if (hasConfiguredSources && source.allowedRegistries.length === 0) {
    throw new InputError(
      `Source '${source.id}': allowedRegistries must list at least one ` +
        'registry when images or quayDiscovery are configured',
    );
  }
  if (source.images.length > options.maxImages) {
    throw new InputError(
      `Source '${source.id}': images may contain at most ` +
        `${options.maxImages} entries (skillImageConnector.maxImages)`,
    );
  }
  if (
    source.quayDiscovery &&
    !source.allowedRegistries.includes(
      source.quayDiscovery.registry.toLowerCase(),
    )
  ) {
    throw new InputError(
      `Source '${source.id}': registry ${source.quayDiscovery.registry} ` +
        'for quayDiscovery is not in allowedRegistries',
    );
  }
  for (const imageConfig of source.images) {
    const parsed = parseImageRef(imageConfig.imageRef);
    const registry = parsed.registry.toLowerCase();
    if (!source.allowedRegistries.includes(registry)) {
      throw new InputError(
        `Source '${source.id}': registry ${registry} for ` +
          `${imageConfig.imageRef} is not in allowedRegistries`,
      );
    }
    if (!parsed.digest) {
      logger.warn(
        `Image ${imageConfig.imageRef} uses a mutable tag. ` +
          'Use a digest reference (e.g. @sha256:...) in production ' +
          'to ensure reproducible content and prevent tag mutation attacks.',
      );
    }
  }
}

/**
 * skillImageConnectorPlugin backend plugin
 *
 * Fetches OCI skill images configured in app-config, validates they
 * conform to the skillimage format, extracts and normalizes them,
 * and serves source-scoped SkillSnapshots via GET /skills/:sourceId.
 *
 * @public
 */
export const skillImageConnectorPlugin = createBackendPlugin({
  pluginId: 'skill-image-connector',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        lifecycle: coreServices.lifecycle,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        scheduler: coreServices.scheduler,
      },
      async init({ logger, httpRouter, lifecycle, config, scheduler }) {
        const pluginLogger = logger.child({
          source: 'skillImageConnectorPlugin',
        });

        const options = readSkillImageOptions(config);
        const pluginConfig = config.getOptionalConfig('skillImageConnector');
        const hasSources = pluginConfig?.has('sources') ?? false;

        // Build source configurations
        let sources: SourceConfig[];
        if (hasSources) {
          // New source-scoped config
          const rawSources = readSourceConfigs(config, pluginLogger);
          const sourcesConfig = pluginConfig!.getConfigArray('sources');
          sources = rawSources.map((raw, index) => {
            const sourceEntry = sourcesConfig[index];
            const images = readSourceImageConfigs(sourceEntry, pluginLogger);
            const discoveryEntry =
              sourceEntry.getOptionalConfig('quayDiscovery');
            const quayDiscovery = discoveryEntry
              ? parseQuayDiscoveryConfig(discoveryEntry, pluginLogger)
              : undefined;
            return { ...raw, images, quayDiscovery };
          });
        } else {
          // Backward compatibility: derive single "default" source
          const rawSources = readSourceConfigs(config, pluginLogger);
          if (rawSources.length > 0) {
            const imageConfigs = readSkillImageConfigs(config, pluginLogger);
            const quayDiscovery = readQuayDiscoveryConfig(config, pluginLogger);
            sources = [
              {
                ...rawSources[0],
                images: imageConfigs,
                quayDiscovery,
              },
            ];
          } else {
            sources = [];
          }
        }

        // Validate all sources
        for (const source of sources) {
          validateSourceConfig(source, options, pluginLogger);
        }

        const workDir = safeGetOptionalString(
          config,
          'backend.workingDirectory',
        );

        // Clean up stale extraction directories from previous abnormal terminations
        await cleanupStaleExtractionDirs(workDir, pluginLogger);

        // Global extraction map for /images backward compatibility
        const globalExtractions = new Map<string, SkillImageExtraction>();
        const globalFailedImages = new Set<string>();

        // Per-source snapshot storage — atomic publication
        const snapshots = new Map<string, SkillSnapshot>();
        const rawStatuses = new Map<string, SkillImageProcessingStatus>();

        // Derive aggregate processing status for /images backward compat
        const getProcessingStatus = (): SkillImageProcessingStatus => {
          if (sources.length === 0) return 'ready';
          const statuses = sources.map(s => rawStatuses.get(s.id));
          if (statuses.some(s => s === 'loading' || s === undefined)) {
            return 'loading';
          }
          // Raw extraction can succeed even when its metadata cannot be
          // normalized. Keep /images usable independently of /skills status.
          if (globalExtractions.size > 0) return 'ready';
          if (statuses.every(s => s === 'failed')) return 'failed';
          return 'ready';
        };

        // Initialize each source with loading snapshot
        for (const source of sources) {
          const snapshotSource: SnapshotSource = {
            id: source.id,
            type: 'oci',
          };
          snapshots.set(source.id, createLoadingSnapshot(snapshotSource));
          rawStatuses.set(source.id, 'loading');
        }

        httpRouter.use(
          await createRouter(
            pluginLogger,
            globalExtractions,
            getProcessingStatus,
            () => Array.from(globalFailedImages),
            snapshots,
          ),
        );
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });

        // Retain every source's acquisitions, including entries hidden by the
        // deduplicated /images view. Only the owner may release these files.
        const sourceExtractions = new Map<
          string,
          Map<string, SkillImageExtraction>
        >();
        const sourceFailedImages = new Map<string, readonly string[]>();
        const rebuildRawInventory = () => {
          globalExtractions.clear();
          globalFailedImages.clear();
          for (const configuredSource of sources) {
            for (const [ref, extraction] of sourceExtractions.get(
              configuredSource.id,
            ) ?? []) {
              if (!globalExtractions.has(ref))
                globalExtractions.set(ref, extraction);
            }
            for (const ref of sourceFailedImages.get(configuredSource.id) ??
              []) {
              globalFailedImages.add(ref);
            }
          }
          for (const ref of globalExtractions.keys())
            globalFailedImages.delete(ref);
        };

        for (const source of sources) {
          const snapshotSource: SnapshotSource = {
            id: source.id,
            type: 'oci',
          };
          const hasConfiguredSources =
            source.images.length > 0 || source.quayDiscovery !== undefined;

          const discoveryNote = source.quayDiscovery
            ? ` and Quay discovery for ${source.quayDiscovery.organization}`
            : '';
          pluginLogger.info(
            `Source '${source.id}': ${source.images.length} skill image ` +
              `configuration(s)${discoveryNote}, schedule: ${JSON.stringify(
                source.schedule,
              )}`,
          );

          sourceExtractions.set(source.id, new Map());
          sourceFailedImages.set(source.id, []);

          await scheduler.scheduleTask({
            id: `skill-image-refresh-${source.id}`,
            ...source.schedule,
            fn: async (abortSignal: AbortSignal) => {
              pluginLogger.info(`Starting refresh for source '${source.id}'`);

              const result = await performSourceRefresh(
                source,
                options,
                pluginLogger,
                workDir,
                abortSignal,
              );

              const previousExtractions = sourceExtractions.get(source.id)!;

              // Build and atomically publish the snapshot
              const snapshot = buildSnapshotFromRefresh(
                snapshotSource,
                result,
                hasConfiguredSources,
              );
              // Publish synchronously before awaiting cleanup, so callers see
              // a complete inventory and another source never loses ownership.
              sourceExtractions.set(source.id, result.extractions);
              sourceFailedImages.set(source.id, result.failedImageRefs);
              rebuildRawInventory();
              snapshots.set(source.id, snapshot);
              rawStatuses.set(
                source.id,
                result.extractions.size === 0 &&
                  (result.failedImageRefs.length > 0 ||
                    (!result.discoveryUsable && !result.discoveryComplete))
                  ? 'failed'
                  : 'ready',
              );

              await Promise.all(
                Array.from(previousExtractions.values()).map(extraction =>
                  cleanupSkillImageExtraction(extraction, pluginLogger),
                ),
              );

              pluginLogger.info(
                `Refresh complete for source '${source.id}': ` +
                  `status=${snapshot.status}, records=${snapshot.skills.length}, ` +
                  `failedKeys=${snapshot.failedSkillKeys.length}`,
              );
            },
          });
        }

        lifecycle.addShutdownHook(async () => {
          // The scheduler handles task cancellation via its own lifecycle.
          // Clean up all retained extractions.
          await Promise.all(
            Array.from(sourceExtractions.values()).flatMap(extractions =>
              Array.from(extractions.values()).map(extraction =>
                cleanupSkillImageExtraction(extraction, pluginLogger),
              ),
            ),
          );
        });
      },
    });
  },
});
