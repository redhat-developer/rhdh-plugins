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
import { parseImageRef } from './services/OciClient';
import {
  cleanupSkillImageExtraction,
  fetchAndExtractSkillImage,
} from './services/SkillImageService';
import type {
  RegistryCredentials,
  SkillImageConfig,
  SkillImageExtraction,
} from './services/types';
import type { SkillImageProcessingStatus } from './router';

const MAX_CONFIGURED_IMAGES = 25;
const MAX_CONCURRENT_IMAGE_FETCHES = 4;

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
  for (let i = 0; i < imagesConfig.length; i++) {
    const entry = imagesConfig[i];
    const imageRef = safeGetOptionalString(entry, 'imageRef')?.trim();
    if (!imageRef) {
      logger?.warn(
        `Skipping skill image configuration at index ${i}: imageRef is missing`,
      );
      continue;
    }

    if (seenImageRefs.has(imageRef)) {
      logger?.warn(
        `Skipping duplicate skill image configuration for ${imageRef}`,
      );
      continue;
    }

    seenImageRefs.add(imageRef);
    const credentialsConfig = entry.getOptionalConfig('credentials');
    const username = credentialsConfig
      ? safeGetOptionalString(credentialsConfig, 'username')
      : undefined;
    const password = credentialsConfig
      ? safeGetOptionalString(credentialsConfig, 'password')
      : undefined;
    const tokenRealm = credentialsConfig
      ? safeGetOptionalString(credentialsConfig, 'tokenRealm')
      : undefined;
    if (Boolean(username) !== Boolean(password) || (tokenRealm && !username)) {
      throw new InputError(
        `Invalid credentials for skill image ${imageRef}: username and password must be provided together; tokenRealm requires credentials`,
      );
    }
    if (tokenRealm) {
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

    const credentials: RegistryCredentials | undefined =
      username && password
        ? {
            username,
            password,
            ...(tokenRealm ? { tokenRealm } : {}),
          }
        : undefined;

    results.push({
      id: `image-${i}`,
      imageRef,
      ...(credentials ? { credentials } : {}),
    });
  }

  return results;
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

        const imageConfigs = readSkillImageConfigs(config, pluginLogger);
        const allowedRegistries = (
          config
            .getOptionalConfig('skillImageConnector')
            ?.getOptionalStringArray('allowedRegistries') ?? []
        )
          .map(registry => registry.trim().toLowerCase())
          .filter(Boolean);

        if (imageConfigs.length > 0 && allowedRegistries.length === 0) {
          throw new InputError(
            'skillImageConnector.allowedRegistries must list at least one registry when images are configured',
          );
        }
        if (imageConfigs.length > MAX_CONFIGURED_IMAGES) {
          throw new InputError(
            `skillImageConnector.images may contain at most ${MAX_CONFIGURED_IMAGES} entries`,
          );
        }
        for (const imageConfig of imageConfigs) {
          const registry = parseImageRef(
            imageConfig.imageRef,
          ).registry.toLowerCase();
          if (!allowedRegistries.includes(registry)) {
            throw new InputError(
              `Registry ${registry} for ${imageConfig.imageRef} is not in skillImageConnector.allowedRegistries`,
            );
          }
        }
        pluginLogger.info(
          `Found ${imageConfigs.length} skill image configuration(s)`,
        );

        const workDir =
          safeGetOptionalString(config, 'backend.workingDirectory') ??
          undefined;

        // Store extraction results so they can be exposed via the API
        const extractions = new Map<string, SkillImageExtraction>();
        const failedImages = new Set<string>();
        let processingStatus: SkillImageProcessingStatus =
          imageConfigs.length > 0 ? 'loading' : 'ready';

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
        const processing = (async () => {
          let nextImageIndex = 0;
          const processNextImage = async () => {
            while (
              !processingAbortController.signal.aborted &&
              nextImageIndex < imageConfigs.length
            ) {
              const imageIndex = nextImageIndex++;
              const imgConfig = imageConfigs[imageIndex];
              try {
                const result = await fetchAndExtractSkillImage(
                  imgConfig.imageRef,
                  workDir,
                  pluginLogger,
                  imgConfig.credentials,
                  processingAbortController.signal,
                );
                extractions.set(imgConfig.imageRef, result);
                pluginLogger.info(
                  `Successfully extracted skill image ${imgConfig.imageRef}`,
                );
              } catch (error) {
                if (!processingAbortController.signal.aborted) {
                  failedImages.add(imgConfig.imageRef);
                  pluginLogger.error(
                    `Failed to process skill image ${imgConfig.imageRef}`,
                    error as Error,
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
                  imageConfigs.length,
                ),
              },
              processNextImage,
            ),
          );
          processingStatus = 'ready';
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
