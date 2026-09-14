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
import type { Config } from '@backstage/config';
import { createRouter } from './router';
import { fetchAndExtractSkillImage } from './services/SkillImageService';
import type { SkillImageConfig, SkillImageExtraction } from './services/types';

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
export function readSkillImageConfigs(config: Config): SkillImageConfig[] {
  const pluginConfig = config.getOptionalConfig('skillImageConnector');
  if (!pluginConfig) {
    return [];
  }

  const imagesConfig = pluginConfig.getOptionalConfigArray('images');
  if (!imagesConfig) {
    return [];
  }

  const results: SkillImageConfig[] = [];
  for (let i = 0; i < imagesConfig.length; i++) {
    const entry = imagesConfig[i];
    const imageRef = safeGetOptionalString(entry, 'imageRef');
    if (!imageRef) {
      continue;
    }
    results.push({
      id: `image-${i}`,
      imageRef,
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
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ logger, httpRouter, config }) {
        const pluginLogger = logger.child({
          source: 'skillImageConnectorPlugin',
        });

        const imageConfigs = readSkillImageConfigs(config);
        pluginLogger.info(
          `Found ${imageConfigs.length} skill image configuration(s)`,
        );

        const workDir =
          safeGetOptionalString(config, 'backend.workingDirectory') ??
          undefined;

        // Store extraction results so they can be exposed via the API
        const extractions = new Map<string, SkillImageExtraction>();

        // Process configured images at startup
        for (const imgConfig of imageConfigs) {
          try {
            const result = await fetchAndExtractSkillImage(
              imgConfig.imageRef,
              workDir,
              pluginLogger,
            );
            extractions.set(imgConfig.imageRef, result);
            pluginLogger.info(
              `Successfully extracted skill image ${imgConfig.imageRef}: ` +
                `skillimage.yaml=${result.skillImageYamlPath}, ` +
                `SKILLS.md=${result.skillsMdPath}`,
            );
          } catch (error) {
            pluginLogger.error(
              `Failed to process skill image ${imgConfig.imageRef}`,
              error as Error,
            );
          }
        }

        httpRouter.use(await createRouter(pluginLogger, extractions));
      },
    });
  },
});
