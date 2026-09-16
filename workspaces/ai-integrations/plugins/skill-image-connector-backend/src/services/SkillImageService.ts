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

import type { LoggerService } from '@backstage/backend-plugin-api';
import fs from 'node:fs';
import platformPath from 'node:path';
import os from 'node:os';
import { parseImageRef, fetchManifest, fetchBlob } from './OciClient';
import type {
  OciManifest,
  OciDescriptor,
  RegistryCredentials,
  SkillImageExtraction,
} from './types';

/**
 * The annotation key used by skillimage to identify the layer title.
 * See https://github.com/redhat-et/skillimage
 */
const TITLE_ANNOTATION = 'org.opencontainers.image.title';

/** Expected files in a valid skill image. */
const SKILLIMAGE_YAML = 'skillimage.yaml';
const SKILLS_MD = 'SKILLS.md';

/**
 * Finds a layer by its title annotation.
 */
export function findLayerByTitle(
  layers: OciDescriptor[],
  title: string,
): OciDescriptor | undefined {
  return layers.find(layer => layer.annotations?.[TITLE_ANNOTATION] === title);
}

/**
 * Validates that an OCI manifest contains the required skill image
 * layers: skillimage.yaml and SKILLS.md.
 *
 * Returns the descriptors for both layers or throws with a
 * descriptive error.
 */
export function validateSkillImageManifest(manifest: OciManifest): {
  skillImageYamlLayer: OciDescriptor;
  skillsMdLayer: OciDescriptor;
} {
  if (!Array.isArray(manifest.layers)) {
    throw new TypeError(
      'Image manifest does not contain a layers array. ' +
        'This may indicate a manifest list, an unsupported manifest format, ' +
        'or a malformed registry response.',
    );
  }

  const malformedLayer = manifest.layers.find(
    layer =>
      !layer ||
      typeof layer.digest !== 'string' ||
      !layer.digest ||
      !Number.isSafeInteger(layer.size) ||
      layer.size < 0,
  );
  if (malformedLayer) {
    throw new TypeError(
      'Image manifest contains a layer with an invalid digest or size',
    );
  }

  const skillImageYamlLayer = findLayerByTitle(
    manifest.layers,
    SKILLIMAGE_YAML,
  );
  const skillsMdLayer = findLayerByTitle(manifest.layers, SKILLS_MD);

  const missing: string[] = [];
  if (!skillImageYamlLayer) {
    missing.push(SKILLIMAGE_YAML);
  }
  if (!skillsMdLayer) {
    missing.push(SKILLS_MD);
  }

  if (missing.length > 0) {
    throw new Error(
      `Image does not conform to the skillimage format: missing layer(s) ${missing.join(
        ', ',
      )}. ` +
        `Expected layers with annotation "${TITLE_ANNOTATION}" set to "${SKILLIMAGE_YAML}" and "${SKILLS_MD}".`,
    );
  }

  return {
    skillImageYamlLayer: skillImageYamlLayer!,
    skillsMdLayer: skillsMdLayer!,
  };
}

/**
 * Fetches an OCI skill image, validates its format, and extracts
 * skillimage.yaml and SKILLS.md onto local storage.
 *
 * @param imageRefStr - Full image reference (e.g. "quay.io/gabemontero/hello-world-skill:1.0.0-draft")
 * @param workDir - Base directory for extracted files. Defaults to OS temp dir.
 * @param logger - Logger service instance.
 * @returns Paths and contents of extracted files.
 */
export async function fetchAndExtractSkillImage(
  imageRefStr: string,
  workDir: string | undefined,
  logger: LoggerService,
  credentials?: RegistryCredentials,
): Promise<SkillImageExtraction> {
  const baseDir = workDir ?? os.tmpdir();
  const imageRef = parseImageRef(imageRefStr);

  logger.info(`Processing skill image ${imageRefStr}`);

  // 1. Fetch the manifest
  const manifest = await fetchManifest(imageRef, logger, credentials);

  // 2. Validate the manifest has required layers
  const { skillImageYamlLayer, skillsMdLayer } =
    validateSkillImageManifest(manifest);

  // 3. Fetch the layer blobs
  const [skillImageYamlBuf, skillsMdBuf] = await Promise.all([
    fetchBlob(
      imageRef,
      skillImageYamlLayer.digest,
      skillImageYamlLayer.size,
      logger,
      credentials,
    ),
    fetchBlob(
      imageRef,
      skillsMdLayer.digest,
      skillsMdLayer.size,
      logger,
      credentials,
    ),
  ]);

  // 4. Write to local storage following the pattern from
  // catalog-techdoc-url-reader-backend (mkdtemp + writeFile)
  const extractDir = await fs.promises.mkdtemp(
    platformPath.join(baseDir, 'skill-image-'),
  );

  try {
    const skillImageYamlPath = platformPath.join(extractDir, SKILLIMAGE_YAML);
    const skillsMdPath = platformPath.join(extractDir, SKILLS_MD);

    await Promise.all([
      fs.promises.writeFile(skillImageYamlPath, skillImageYamlBuf, {
        mode: 0o600,
      }),
      fs.promises.writeFile(skillsMdPath, skillsMdBuf, { mode: 0o600 }),
    ]);

    const skillImageYaml = skillImageYamlBuf.toString('utf-8');
    const skillsMd = skillsMdBuf.toString('utf-8');

    logger.info(`Extracted skill image files to ${extractDir}`);

    return {
      skillImageYamlPath,
      skillsMdPath,
      skillImageYaml,
      skillsMd,
    };
  } catch (error) {
    // Clean up the temp directory on failure to prevent resource leaks
    try {
      await fs.promises.rm(extractDir, { recursive: true, force: true });
    } catch (cleanupError) {
      logger.warn(
        `Failed to clean up temp directory ${extractDir}`,
        cleanupError as Error,
      );
    }
    throw error;
  }
}

/** Removes files owned by a completed skill image extraction. */
export async function cleanupSkillImageExtraction(
  extraction: SkillImageExtraction,
  logger: LoggerService,
): Promise<void> {
  const extractDir = platformPath.dirname(extraction.skillImageYamlPath);
  try {
    await fs.promises.rm(extractDir, { recursive: true, force: true });
  } catch (error) {
    logger.warn(
      `Failed to clean up extracted skill image directory ${extractDir}`,
      error as Error,
    );
  }
}
