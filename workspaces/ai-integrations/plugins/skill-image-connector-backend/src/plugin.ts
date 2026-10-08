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
import { createRouter } from './router';
import {
  ManifestResponseError,
  OCI_REGISTRY_PATTERN,
  validateTag,
  parseImageRef,
  fetchManifest,
} from './services/OciClient';
import { discoverQuayRepositories } from './services/QuayDiscovery';
import {
  cleanupSkillImageExtraction,
  cleanupStaleExtractionDirs,
  fetchAndExtractSkillImage,
} from './services/SkillImageService';
import type {
  QuayDiscoveryConfig,
  RegistryCredentials,
  SkillImageConfig,
  SkillImageExtraction,
  SkillImageOptions,
} from './services/types';
import { MAX_CONCURRENT_IMAGE_FETCHES } from './services/types';
import { withRetry } from './services/Retry';
import { readSkillImageOptions } from './services/config';
import type { SkillImageProcessingStatus } from './router';

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

  const organization = safeGetOptionalString(
    discoveryConfig,
    'organization',
  )?.trim();
  if (!organization) {
    logger?.warn(
      'skillImageConnector.quayDiscovery.organization is missing; skipping Quay discovery',
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
  existingConfigs: SkillImageConfig[],
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
 * Returns `oci://<registry>/<repository>@<digest>`.
 *
 * @internal Exported for testing.
 */
export function buildSourceUri(
  registry: string,
  repository: string,
  digest: string,
): string {
  return `oci://${registry}/${repository}@${digest}`;
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
 * skillImageConnectorPlugin backend plugin
 *
 * Fetches OCI skill images configured in app-config, validates they
 * conform to the skillimage format, and extracts skillimage.yaml and
 * SKILLS.md to local storage.
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
      },
      async init({ logger, httpRouter, lifecycle, config }) {
        const pluginLogger = logger.child({
          source: 'skillImageConnectorPlugin',
        });

        const options = readSkillImageOptions(config);
        const imageConfigs = readSkillImageConfigs(config, pluginLogger);
        const quayDiscoveryConfig = readQuayDiscoveryConfig(
          config,
          pluginLogger,
        );
        const allowedRegistries = (
          config
            .getOptionalConfig('skillImageConnector')
            ?.getOptionalStringArray('allowedRegistries') ?? []
        )
          .map(registry => registry.trim().toLowerCase())
          .filter(Boolean);

        const hasConfiguredSources =
          imageConfigs.length > 0 || quayDiscoveryConfig !== undefined;

        if (hasConfiguredSources && allowedRegistries.length === 0) {
          throw new InputError(
            'skillImageConnector.allowedRegistries must list at least one registry when images or quayDiscovery are configured',
          );
        }
        if (imageConfigs.length > options.maxImages) {
          throw new InputError(
            `skillImageConnector.images may contain at most ${options.maxImages} entries (skillImageConnector.maxImages)`,
          );
        }
        if (
          quayDiscoveryConfig &&
          !allowedRegistries.includes(
            quayDiscoveryConfig.registry.toLowerCase(),
          )
        ) {
          throw new InputError(
            `Registry ${quayDiscoveryConfig.registry} for quayDiscovery is not in skillImageConnector.allowedRegistries`,
          );
        }
        for (const imageConfig of imageConfigs) {
          const parsed = parseImageRef(imageConfig.imageRef);
          const registry = parsed.registry.toLowerCase();
          if (!allowedRegistries.includes(registry)) {
            throw new InputError(
              `Registry ${registry} for ${imageConfig.imageRef} is not in skillImageConnector.allowedRegistries`,
            );
          }
          // Warn when a mutable tag is used instead of a digest reference
          if (!parsed.digest) {
            pluginLogger.warn(
              `Image ${imageConfig.imageRef} uses a mutable tag. ` +
                'Use a digest reference (e.g. @sha256:...) in production ' +
                'to ensure reproducible content and prevent tag mutation attacks.',
            );
          }
        }
        const discoveryNote = quayDiscoveryConfig
          ? ` and Quay discovery for ${quayDiscoveryConfig.organization}`
          : '';
        pluginLogger.info(
          `Found ${imageConfigs.length} skill image configuration(s)${discoveryNote}`,
        );

        const workDir = safeGetOptionalString(
          config,
          'backend.workingDirectory',
        );

        // Clean up stale extraction directories from previous abnormal
        // terminations (crash, OOM, forced kill) before starting new work.
        await cleanupStaleExtractionDirs(workDir, pluginLogger);

        // Store extraction results so they can be exposed via the API
        const extractions = new Map<string, SkillImageExtraction>();
        const failedImages = new Set<string>();
        let processingStatus: SkillImageProcessingStatus = hasConfiguredSources
          ? 'loading'
          : 'ready';

        httpRouter.use(
          await createRouter(
            pluginLogger,
            extractions,
            () => processingStatus,
            () => Array.from(failedImages),
          ),
        );
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });

        // Do not make an unavailable registry prevent the backend from starting.
        // Limit concurrent downloads so configured images cannot multiply the
        // per-blob memory ceiling into an avoidable startup spike.
        const processingAbortController = new AbortController();

        // Track aggregate content size to bound total in-memory retention.
        let aggregateContentSize = 0;

        const processing = (async () => {
          // Build the full image list: explicit configs + discovered repos
          let allImageConfigs: SkillImageConfig[] = [...imageConfigs];
          let discoveryFailed = false;

          // Run Quay organization discovery if configured
          if (quayDiscoveryConfig) {
            try {
              const discoveredRefs = await discoverQuayRepositories(
                quayDiscoveryConfig,
                pluginLogger,
                processingAbortController.signal,
                options,
              );

              // Merge discovered refs, skipping duplicates and enforcing cap
              const mergeResult = mergeDiscoveredRefs(
                imageConfigs,
                discoveredRefs,
                options.maxImages,
                pluginLogger,
              );
              allImageConfigs = mergeResult.merged;

              pluginLogger.info(
                `Quay discovery added ${mergeResult.added} new image(s) to process`,
              );

              // Discovered images always use mutable tags
              if (mergeResult.added > 0) {
                pluginLogger.warn(
                  `${mergeResult.added} discovered image(s) use mutable tags. ` +
                    'Use digest references in production to prevent tag mutation attacks.',
                );
              }
            } catch (error) {
              discoveryFailed = true;
              if (!processingAbortController.signal.aborted) {
                pluginLogger.error(
                  `Quay organization discovery failed for ${quayDiscoveryConfig.organization}`,
                  error as Error,
                );
              }
            }
          }

          let nextImageIndex = 0;
          const processNextImage = async () => {
            while (
              !processingAbortController.signal.aborted &&
              nextImageIndex < allImageConfigs.length
            ) {
              const imageIndex = nextImageIndex++;
              const imgConfig = allImageConfigs[imageIndex];
              try {
                const result = await fetchWithRetry(
                  imgConfig.imageRef,
                  workDir,
                  pluginLogger,
                  imgConfig.credentials,
                  processingAbortController.signal,
                  options,
                );

                // Keep the budget check, increment, and insertion synchronous:
                // an await between them would let concurrent results exceed it.
                const contentSize =
                  Buffer.byteLength(result.skillImageYaml, 'utf-8') +
                  Buffer.byteLength(result.skillsMd, 'utf-8');
                if (
                  aggregateContentSize + contentSize >
                  options.maxAggregateContentSizeBytes
                ) {
                  pluginLogger.error(
                    `Aggregate content budget exceeded after ${imgConfig.imageRef}; ` +
                      `${
                        aggregateContentSize + contentSize
                      } bytes would exceed ` +
                      `${options.maxAggregateContentSizeBytes} byte limit`,
                  );
                  await cleanupSkillImageExtraction(result, pluginLogger);
                  failedImages.add(imgConfig.imageRef);
                } else {
                  aggregateContentSize += contentSize;
                  extractions.set(imgConfig.imageRef, result);
                  pluginLogger.info(
                    `Successfully extracted skill image ${imgConfig.imageRef}`,
                  );
                }
              } catch (error) {
                if (!processingAbortController.signal.aborted) {
                  failedImages.add(imgConfig.imageRef);
                  logImageProcessingFailure(
                    pluginLogger,
                    imgConfig.imageRef,
                    error,
                    imgConfig.logNotFoundAsError ?? true,
                  );
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
          processingStatus =
            (allImageConfigs.length > 0 &&
              failedImages.size === allImageConfigs.length) ||
            (hasConfiguredSources &&
              allImageConfigs.length === 0 &&
              discoveryFailed)
              ? 'failed'
              : 'ready';
        })();

        lifecycle.addShutdownHook(async () => {
          processingAbortController.abort();
          await processing;
          await Promise.all(
            Array.from(extractions.values()).map(extraction =>
              cleanupSkillImageExtraction(extraction, pluginLogger),
            ),
          );
        });
      },
    });
  },
});
