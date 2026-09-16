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
import { gunzipSync } from 'node:zlib';
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

/**
 * Expected files in a valid skill image.
 *
 * The skillctl CLI produces `skill.yaml` and `SKILL.md` inside a
 * tar+gzip layer.  Earlier drafts of this plugin expected per-layer
 * annotations named `skillimage.yaml` and `SKILLS.md`.  Both naming
 * conventions are accepted so the plugin works with the real acceptance
 * image as well as annotation-based images.
 */
const YAML_NAMES = ['skillimage.yaml', 'skill.yaml'];
const MD_NAMES = ['SKILLS.md', 'SKILL.md'];

/** Canonical output filenames written to the extraction directory. */
const OUT_YAML = 'skillimage.yaml';
const OUT_MD = 'SKILLS.md';

/**
 * Media types that indicate a tar (optionally gzip-compressed) layer.
 */
const TAR_MEDIA_TYPES = new Set([
  'application/vnd.oci.image.layer.v1.tar',
  'application/vnd.oci.image.layer.v1.tar+gzip',
]);

/** Maximum number of tar entries inspected per layer to avoid DoS. */
const MAX_TAR_ENTRIES = 200;

// ── Tar extraction helpers ──────────────────────────────────────────

interface TarEntry {
  name: string;
  data: Buffer;
}

/**
 * Decompresses a buffer if it starts with the gzip magic bytes (0x1f 0x8b),
 * otherwise returns it unchanged.
 */
function maybeDecompress(buf: Buffer): Buffer {
  if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
    return gunzipSync(buf);
  }
  return buf;
}

/**
 * Parses a UStar/POSIX tar archive and returns entries for regular files.
 *
 * Only inspects up to `MAX_TAR_ENTRIES` entries to bound CPU time on
 * maliciously crafted archives.
 */
export function parseTarEntries(tarBuffer: Buffer): TarEntry[] {
  const entries: TarEntry[] = [];
  let offset = 0;

  while (offset + 512 <= tarBuffer.length && entries.length < MAX_TAR_ENTRIES) {
    const header = tarBuffer.subarray(offset, offset + 512);

    // End-of-archive: two consecutive 512-byte zero blocks
    if (header.every(b => b === 0)) {
      break;
    }

    // Filename: bytes 0–99, null-terminated
    let nameEnd = header.indexOf(0, 0);
    if (nameEnd === -1 || nameEnd > 100) {
      nameEnd = 100;
    }
    const name = header.subarray(0, nameEnd).toString('utf-8');

    // File size: bytes 124–135, octal ASCII
    const sizeStr = header.subarray(124, 136).toString('utf-8').trim();
    const size = parseInt(sizeStr, 8);
    if (Number.isNaN(size) || size < 0) {
      break; // Malformed header — stop parsing
    }

    // Type flag: byte 156. '0' (0x30) or '\0' (0x00) = regular file.
    const typeFlag = header[156];

    offset += 512; // past header

    if ((typeFlag === 0 || typeFlag === 0x30) && name.length > 0 && size > 0) {
      if (offset + size > tarBuffer.length) {
        break; // Truncated archive
      }
      entries.push({
        name: name.replace(/^\.\//, ''), // strip leading ./
        data: tarBuffer.subarray(offset, offset + size),
      });
    }

    // Advance to the next 512-byte boundary
    offset += Math.ceil(size / 512) * 512;
  }

  return entries;
}

// ── Manifest analysis ───────────────────────────────────────────────

/**
 * Finds a layer whose title annotation matches one of the given names.
 */
export function findLayerByTitle(
  layers: OciDescriptor[],
  title: string,
): OciDescriptor | undefined {
  for (const layer of layers) {
    if (layer.annotations?.[TITLE_ANNOTATION] === title) {
      return layer;
    }
  }
  return undefined;
}

/**
 * Finds a layer whose title annotation matches any of the given names.
 */
function findLayerByTitles(
  layers: OciDescriptor[],
  titles: string[],
): OciDescriptor | undefined {
  for (const title of titles) {
    const layer = findLayerByTitle(layers, title);
    if (layer) {
      return layer;
    }
  }
  return undefined;
}

/** The strategy the extraction code should follow for a given manifest. */
export type ExtractionStrategy =
  | {
      mode: 'annotated';
      skillImageYamlLayer: OciDescriptor;
      skillsMdLayer: OciDescriptor;
    }
  | { mode: 'tar'; layers: OciDescriptor[] };

/**
 * Validates an OCI manifest and determines the extraction strategy.
 *
 * Two strategies are supported:
 *
 * 1. **annotated** — The manifest has two individual layers annotated
 *    with `org.opencontainers.image.title` set to one of the accepted
 *    YAML/MD names.  Each blob is a raw file.
 *
 * 2. **tar** — The manifest has one or more `tar` or `tar+gzip` layers
 *    that may contain the expected files as tar entries.  This matches
 *    the format produced by `skillctl`.
 *
 * Throws a descriptive error if neither strategy can be applied.
 */
export function validateSkillImageManifest(
  manifest: OciManifest,
): ExtractionStrategy {
  if (!Array.isArray(manifest.layers)) {
    throw new TypeError(
      'Image manifest does not contain a layers array. ' +
        'This may indicate a manifest list, an unsupported manifest format, ' +
        'or a malformed registry response.',
    );
  }

  const hasMalformedLayer = manifest.layers.some(
    layer =>
      !layer ||
      typeof layer.digest !== 'string' ||
      !layer.digest ||
      !Number.isSafeInteger(layer.size) ||
      layer.size < 0,
  );
  if (hasMalformedLayer) {
    throw new TypeError(
      'Image manifest contains a layer with an invalid digest or size',
    );
  }

  // Strategy 1: individually annotated layers
  const skillImageYamlLayer = findLayerByTitles(manifest.layers, YAML_NAMES);
  const skillsMdLayer = findLayerByTitles(manifest.layers, MD_NAMES);

  if (skillImageYamlLayer && skillsMdLayer) {
    return { mode: 'annotated', skillImageYamlLayer, skillsMdLayer };
  }

  // Strategy 2: tar (optionally gzip) layers — produced by skillctl
  const tarLayers = manifest.layers.filter(l =>
    TAR_MEDIA_TYPES.has(l.mediaType),
  );

  if (tarLayers.length > 0) {
    return { mode: 'tar', layers: tarLayers };
  }

  // Neither strategy matched — report what is missing
  const missing: string[] = [];
  if (!skillImageYamlLayer) {
    missing.push(YAML_NAMES.join(' or '));
  }
  if (!skillsMdLayer) {
    missing.push(MD_NAMES.join(' or '));
  }

  throw new Error(
    `Image does not conform to the skillimage format: ` +
      `no individually annotated layers for ${missing.join(', ')} ` +
      `and no tar/tar+gzip layers found. ` +
      `Expected either per-layer "${TITLE_ANNOTATION}" annotations ` +
      `or tar+gzip layers containing the skill files.`,
  );
}

// ── Extraction ──────────────────────────────────────────────────────

/**
 * Searches tar entries for a file matching one of the accepted names.
 * Returns the file content or undefined.
 */
function findTarFile(entries: TarEntry[], names: string[]): Buffer | undefined {
  for (const name of names) {
    const entry = entries.find(
      e => e.name === name || e.name.endsWith(`/${name}`),
    );
    if (entry) {
      return entry.data;
    }
  }
  return undefined;
}

/**
 * Fetches an OCI skill image, validates its format, and extracts
 * skillimage.yaml and SKILLS.md onto local storage.
 *
 * Supports two OCI layer layouts:
 * - Per-layer annotated blobs (each file in its own layer)
 * - tar+gzip archives containing the skill files (produced by skillctl)
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
  signal?: AbortSignal,
): Promise<SkillImageExtraction> {
  const baseDir = workDir ?? os.tmpdir();
  const imageRef = parseImageRef(imageRefStr);

  logger.info(`Processing skill image ${imageRefStr}`);

  // 1. Fetch the manifest
  const manifest = await fetchManifest(imageRef, logger, credentials, signal);

  // 2. Determine extraction strategy
  const strategy = validateSkillImageManifest(manifest);

  // 3. Fetch and decode content, cancelling siblings on first failure
  let skillImageYamlContent: string;
  let skillsMdContent: string;

  // Shared abort controller so that if one blob fetch fails the sibling
  // is cancelled promptly instead of running to completion.
  const blobController = new AbortController();
  const blobSignal = signal
    ? AbortSignal.any([signal, blobController.signal])
    : blobController.signal;

  const cancelSiblings = <T>(p: Promise<T>): Promise<T> =>
    p.catch(err => {
      blobController.abort();
      throw err;
    });

  if (strategy.mode === 'annotated') {
    const [yamlBuf, mdBuf] = await Promise.all([
      cancelSiblings(
        fetchBlob(
          imageRef,
          strategy.skillImageYamlLayer.digest,
          strategy.skillImageYamlLayer.size,
          logger,
          credentials,
          blobSignal,
        ),
      ),
      cancelSiblings(
        fetchBlob(
          imageRef,
          strategy.skillsMdLayer.digest,
          strategy.skillsMdLayer.size,
          logger,
          credentials,
          blobSignal,
        ),
      ),
    ]);

    skillImageYamlContent = yamlBuf.toString('utf-8');
    skillsMdContent = mdBuf.toString('utf-8');
  } else {
    // tar extraction: fetch each tar layer and search for target files
    let yamlBuf: Buffer | undefined;
    let mdBuf: Buffer | undefined;

    for (const layer of strategy.layers) {
      if (yamlBuf && mdBuf) {
        break;
      }
      const blob = await fetchBlob(
        imageRef,
        layer.digest,
        layer.size,
        logger,
        credentials,
        blobSignal,
      );
      const tarData = maybeDecompress(blob);
      const entries = parseTarEntries(tarData);

      if (!yamlBuf) {
        yamlBuf = findTarFile(entries, YAML_NAMES);
      }
      if (!mdBuf) {
        mdBuf = findTarFile(entries, MD_NAMES);
      }
    }

    if (!yamlBuf || !mdBuf) {
      const missing: string[] = [];
      if (!yamlBuf) {
        missing.push(YAML_NAMES.join('/'));
      }
      if (!mdBuf) {
        missing.push(MD_NAMES.join('/'));
      }
      throw new Error(
        `Tar layers did not contain the required skill files: ${missing.join(
          ', ',
        )}`,
      );
    }

    skillImageYamlContent = yamlBuf.toString('utf-8');
    skillsMdContent = mdBuf.toString('utf-8');
  }

  // 4. Write to local storage following the pattern from
  // catalog-techdoc-url-reader-backend (mkdtemp + writeFile)
  const extractDir = await fs.promises.mkdtemp(
    platformPath.join(baseDir, 'skill-image-'),
  );

  try {
    const skillImageYamlPath = platformPath.join(extractDir, OUT_YAML);
    const skillsMdPath = platformPath.join(extractDir, OUT_MD);

    await Promise.all([
      fs.promises.writeFile(
        skillImageYamlPath,
        Buffer.from(skillImageYamlContent, 'utf-8'),
        { mode: 0o600 },
      ),
      fs.promises.writeFile(
        skillsMdPath,
        Buffer.from(skillsMdContent, 'utf-8'),
        { mode: 0o600 },
      ),
    ]);

    logger.info(`Extracted skill image files to ${extractDir}`);

    return {
      skillImageYamlPath,
      skillsMdPath,
      skillImageYaml: skillImageYamlContent,
      skillsMd: skillsMdContent,
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

/**
 * Removes stale `skill-image-*` temporary directories that may have been
 * left behind by a previous process that crashed, was OOM-killed, or
 * otherwise terminated abnormally before cleanup could run.
 */
export async function cleanupStaleExtractionDirs(
  workDir: string | undefined,
  logger: LoggerService,
): Promise<void> {
  const baseDir = workDir ?? os.tmpdir();
  try {
    const entries = await fs.promises.readdir(baseDir, {
      withFileTypes: true,
    });
    const staleDirs = entries.filter(
      e => e.isDirectory() && e.name.startsWith('skill-image-'),
    );
    for (const dir of staleDirs) {
      const dirPath = platformPath.join(baseDir, dir.name);
      try {
        await fs.promises.rm(dirPath, { recursive: true, force: true });
        logger.info(`Cleaned up stale extraction directory ${dirPath}`);
      } catch (cleanupError) {
        logger.warn(
          `Failed to clean up stale directory ${dirPath}`,
          cleanupError as Error,
        );
      }
    }
  } catch (error) {
    logger.debug(
      `Could not scan for stale extraction directories in ${baseDir}`,
      error as Error,
    );
  }
}
