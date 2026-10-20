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
import { DEFAULT_SKILL_IMAGE_OPTIONS, MAX_TAR_ENTRIES } from './types';
import type { SkillImageOptions } from './types';
import type {
  OciManifest,
  OciDescriptor,
  ImageRef,
  RegistryCredentials,
  SkillImageExtraction,
} from './types';

/**
 * Error thrown when an image contains multiple competing SkillCard or
 * Markdown files across supported layers per design D4.
 */
export class AmbiguousSkillFilesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AmbiguousSkillFilesError';
  }
}

/**
 * Error thrown when an image lacks the required SkillCard/Markdown pair,
 * confirming it is not a skill image.
 */
export class NonSkillImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonSkillImageError';
  }
}

/**
 * Error thrown when extraction safety bounds are violated:
 * tar entry limit, path traversal, unsafe entry types,
 * decompression limits, or per-image work budget exhaustion.
 */
export class ExtractionBoundsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExtractionBoundsError';
  }
}

/**
 * Tracks downloaded and decompressed bytes for a single image
 * acquisition. Enforces the per-image work budget (D7).
 */
class ImageWorkBudget {
  private consumed = 0;
  constructor(private readonly limit: number) {}
  /** Charge bytes and throw if the budget is exceeded. */
  charge(bytes: number): void {
    this.consumed += bytes;
    if (this.consumed > this.limit) {
      throw new ExtractionBoundsError(
        `Per-image work budget exceeded: ${this.consumed} bytes consumed, ` +
          `limit is ${this.limit} bytes`,
      );
    }
  }
}

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

// ── Tar extraction helpers ──────────────────────────────────────────

interface TarEntry {
  name: string;
  data: Buffer;
}

/**
 * Decompresses a buffer if it starts with the gzip magic bytes (0x1f 0x8b),
 * otherwise returns it unchanged. Enforces maxOutputLength to prevent
 * decompression bombs and charges the budget for decompressed bytes.
 */
function maybeDecompress(
  buf: Buffer,
  maxBlobSizeBytes: number,
  budget?: ImageWorkBudget,
): Buffer {
  if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
    let decompressed: Buffer;
    try {
      decompressed = gunzipSync(buf, {
        maxOutputLength: maxBlobSizeBytes,
      });
    } catch (error) {
      // Classify only zlib's output ceiling, preserving corrupt-data and
      // unrelated errors rather than treating every RangeError as a limit.
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ERR_BUFFER_TOO_LARGE'
      ) {
        throw new ExtractionBoundsError(
          `Decompressed layer exceeds maximum allowed size ${maxBlobSizeBytes} bytes`,
        );
      }
      throw error;
    }
    budget?.charge(decompressed.length);
    return decompressed;
  }
  return buf;
}

/**
 * Returns true if a tar entry path is unsafe — it escapes the
 * extraction root via absolute paths or parent directory traversal.
 */
export function isUnsafeTarPath(name: string): boolean {
  // Absolute paths
  if (name.startsWith('/')) return true;
  // Normalize by splitting on / and checking for ..
  const parts = name.split('/');
  let depth = 0;
  for (const part of parts) {
    if (part === '..') {
      depth--;
      if (depth < 0) return true;
    } else if (part !== '' && part !== '.') {
      depth++;
    }
  }
  return false;
}

/** Tar type flag constants (UStar/POSIX). */
const TAR_TYPE_REGULAR_FILE = 0x30; // '0'
const TAR_TYPE_REGULAR_NULL = 0x00; // '\0'
const TAR_TYPE_SYMLINK = 0x32; // '2'
const TAR_TYPE_HARDLINK = 0x31; // '1'
const TAR_TYPE_CHAR_DEVICE = 0x33; // '3'
const TAR_TYPE_BLOCK_DEVICE = 0x34; // '4'
// TAR_TYPE_DIRECTORY (0x35 / '5') is recognized but not stored;
// the constant is implicit in the condition below (not a regular file).

/**
 * Parses a UStar/POSIX tar archive and returns entries for regular files.
 *
 * Inspects up to `MAX_TAR_ENTRIES` headers (counting all types, including
 * ignored entries). Reaching the limit is an explicit failure per D7,
 * not silent truncation.
 *
 * Rejects:
 * - Symlinks, hardlinks, and device entries that could redirect or escape
 * - Absolute paths and parent directory traversal (../)
 * - Malformed sizes and arithmetic overflow
 * - Truncated or invalid archives
 *
 * Never executes file content or materializes unnecessary entries.
 */
export function parseTarEntries(tarBuffer: Buffer): TarEntry[] {
  const entries: TarEntry[] = [];
  let offset = 0;
  let headerCount = 0;

  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.subarray(offset, offset + 512);

    // End-of-archive: two consecutive 512-byte zero blocks
    if (header.every(b => b === 0)) {
      break;
    }

    // Count every inspected header against the entry limit
    headerCount++;
    if (headerCount > MAX_TAR_ENTRIES) {
      throw new ExtractionBoundsError(
        `Archive exceeds maximum inspected entry count (${MAX_TAR_ENTRIES})`,
      );
    }

    // Filename: bytes 0–99, null-terminated
    let nameEnd = header.indexOf(0, 0);
    if (nameEnd === -1 || nameEnd > 100) {
      nameEnd = 100;
    }
    const name = header.subarray(0, nameEnd).toString('utf-8');

    // File size: bytes 124–135, octal ASCII
    const sizeStr = header.subarray(124, 136).toString('utf-8').trim();
    const size = Number.parseInt(sizeStr, 8);
    if (Number.isNaN(size) || size < 0) {
      throw new ExtractionBoundsError(
        'Archive contains an entry with a malformed size field',
      );
    }

    // Guard against arithmetic overflow when computing the next offset
    if (size > Number.MAX_SAFE_INTEGER - 512) {
      throw new ExtractionBoundsError(
        'Archive contains an entry with an overflowing size field',
      );
    }

    // Type flag: byte 156
    const typeFlag = header[156];

    // Reject symlinks, hardlinks, and device entries that could
    // redirect selected content or escape extraction storage.
    if (typeFlag === TAR_TYPE_SYMLINK) {
      throw new ExtractionBoundsError(
        'Archive contains a symlink entry which could redirect content',
      );
    }
    if (typeFlag === TAR_TYPE_HARDLINK) {
      throw new ExtractionBoundsError(
        'Archive contains a hardlink entry which could redirect content',
      );
    }
    if (
      typeFlag === TAR_TYPE_CHAR_DEVICE ||
      typeFlag === TAR_TYPE_BLOCK_DEVICE
    ) {
      throw new ExtractionBoundsError(
        'Archive contains a device entry which is not permitted',
      );
    }

    offset += 512; // past header

    if (
      (typeFlag === TAR_TYPE_REGULAR_NULL ||
        typeFlag === TAR_TYPE_REGULAR_FILE) &&
      name.length > 0 &&
      size > 0
    ) {
      // Validate the path before accepting the entry
      const cleanName = name.replace(/^\.\//, '');
      if (isUnsafeTarPath(cleanName)) {
        throw new ExtractionBoundsError(
          `Archive entry has an unsafe path: ${cleanName}`,
        );
      }

      if (offset + size > tarBuffer.length) {
        throw new ExtractionBoundsError(
          'Archive is truncated — entry extends past end of buffer',
        );
      }
      entries.push({
        name: cleanName,
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

/** The strategy the extraction code should follow for a given manifest. */
export type ExtractionStrategy =
  | {
      mode: 'annotated';
      skillImageYamlLayer: OciDescriptor;
      skillsMdLayer: OciDescriptor;
      /** Tar layers present alongside annotated layers. */
      tarLayers: OciDescriptor[];
    }
  | {
      mode: 'tar';
      layers: OciDescriptor[];
      skillImageYamlLayer?: OciDescriptor;
      skillsMdLayer?: OciDescriptor;
    }
  | { mode: 'non-skill' }
  | { mode: 'ambiguous'; reason: string };

/**
 * Finds ALL layers whose title annotation matches any of the given names.
 */
function findAllLayersByTitles(
  layers: OciDescriptor[],
  titles: string[],
): OciDescriptor[] {
  return layers.filter(layer =>
    titles.some(title => layer.annotations?.[TITLE_ANNOTATION] === title),
  );
}

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
 * Returns `non-skill` when no matching layout is found.
 * Returns `ambiguous` when multiple matching files compete per D4.
 *
 * Throws only for structurally invalid manifests (missing layers array,
 * malformed layer descriptors).
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

  // Count ALL annotated layers that match skill file names
  const allYamlAnnotated = findAllLayersByTitles(manifest.layers, YAML_NAMES);
  const allMdAnnotated = findAllLayersByTitles(manifest.layers, MD_NAMES);

  // Strategy 2 candidates: tar (optionally gzip) layers
  const tarLayers = manifest.layers.filter(l =>
    TAR_MEDIA_TYPES.has(l.mediaType),
  );

  // Detect annotated-layer ambiguity
  if (allYamlAnnotated.length > 1) {
    return {
      mode: 'ambiguous',
      reason: `${
        allYamlAnnotated.length
      } competing SkillCard layers with annotations ${YAML_NAMES.join('/')}`,
    };
  }
  if (allMdAnnotated.length > 1) {
    return {
      mode: 'ambiguous',
      reason: `${
        allMdAnnotated.length
      } competing Markdown layers with annotations ${MD_NAMES.join('/')}`,
    };
  }

  // An annotated descriptor identifies a raw file, even if its media type
  // says tar. Exclude descriptors themselves, not unrelated same-digest layers.
  const annotatedLayers = new Set([...allYamlAnnotated, ...allMdAnnotated]);
  const nonAnnotatedTarLayers = tarLayers.filter(
    layer => !annotatedLayers.has(layer),
  );
  if (allYamlAnnotated.length === 1 && allMdAnnotated.length === 1) {
    return {
      mode: 'annotated',
      skillImageYamlLayer: allYamlAnnotated[0],
      skillsMdLayer: allMdAnnotated[0],
      tarLayers: nonAnnotatedTarLayers,
    };
  }

  if (nonAnnotatedTarLayers.length > 0) {
    return {
      mode: 'tar',
      layers: nonAnnotatedTarLayers,
      ...(allYamlAnnotated[0]
        ? { skillImageYamlLayer: allYamlAnnotated[0] }
        : {}),
      ...(allMdAnnotated[0] ? { skillsMdLayer: allMdAnnotated[0] } : {}),
    };
  }

  // Neither strategy matched — this is a non-skill
  return { mode: 'non-skill' };
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
  options: SkillImageOptions = DEFAULT_SKILL_IMAGE_OPTIONS,
): Promise<SkillImageExtraction> {
  const baseDir = workDir ?? os.tmpdir();
  const imageRef = parseImageRef(imageRefStr);

  logger.info(`Processing skill image ${imageRefStr}`);

  // 1. Fetch the manifest and compute/verify its digest
  const { manifest } = await fetchManifest(
    imageRef,
    logger,
    credentials,
    signal,
    options,
  );

  // 2. Determine extraction strategy
  const strategy = validateSkillImageManifest(manifest);

  if (strategy.mode === 'non-skill') {
    throw new NonSkillImageError(
      `Image does not conform to the skillimage format: ` +
        `no individually annotated layers for ${YAML_NAMES.join(
          ' or ',
        )}, ${MD_NAMES.join(' or ')} ` +
        `and no tar/tar+gzip layers found. ` +
        `Expected either per-layer "${TITLE_ANNOTATION}" annotations ` +
        `or tar+gzip layers containing the skill files.`,
    );
  }

  if (strategy.mode === 'ambiguous') {
    throw new AmbiguousSkillFilesError(strategy.reason);
  }

  // 3. Fetch and decode content, cancelling siblings on first failure
  // Shared abort controller so that if one blob fetch fails the sibling
  // is cancelled promptly instead of running to completion.
  const blobController = new AbortController();
  const blobSignal = signal
    ? AbortSignal.any([signal, blobController.signal])
    : blobController.signal;

  // Per-image work budget: tracks all downloaded and decompressed bytes
  // across inspected layers, not just the retained file pair (D7).
  const budget = new ImageWorkBudget(options.maxImageWorkBudgetBytes);

  let contents: ExtractedSkillContents;
  if (strategy.mode === 'annotated') {
    contents = await fetchAnnotatedContents(
      imageRef,
      strategy,
      logger,
      credentials,
      blobSignal,
      blobController,
      options,
      budget,
    );
    // Cross-strategy ambiguity: check tar layers for competing files
    if (strategy.tarLayers.length > 0) {
      await checkTarLayersForCompetingFiles(
        imageRef,
        strategy.tarLayers,
        logger,
        credentials,
        blobSignal,
        options,
        budget,
      );
    }
  } else {
    contents = await fetchTarContents(
      imageRef,
      strategy,
      logger,
      credentials,
      blobSignal,
      options,
      budget,
    );
  }

  // 4. Write to local storage following the pattern from
  // catalog-techdoc-url-reader-backend (mkdtemp + writeFile)
  const extractDir = await fs.promises.mkdtemp(
    platformPath.join(baseDir, 'skill-image-'),
  );

  // Write an owner lock file so stale-dir cleanup can distinguish
  // directories that are actively in use from genuinely stale ones.
  await fs.promises.writeFile(
    platformPath.join(extractDir, '.owner'),
    `${process.pid}`,
    { mode: 0o600 },
  );

  try {
    const skillImageYamlPath = platformPath.join(extractDir, OUT_YAML);
    const skillsMdPath = platformPath.join(extractDir, OUT_MD);

    await Promise.all([
      fs.promises.writeFile(
        skillImageYamlPath,
        Buffer.from(contents.skillImageYamlContent, 'utf-8'),
        { mode: 0o600 },
      ),
      fs.promises.writeFile(
        skillsMdPath,
        Buffer.from(contents.skillsMdContent, 'utf-8'),
        { mode: 0o600 },
      ),
    ]);

    logger.info(`Extracted skill image files to ${extractDir}`);

    return {
      skillImageYamlPath,
      skillsMdPath,
      skillImageYaml: contents.skillImageYamlContent,
      skillsMd: contents.skillsMdContent,
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

/**
 * Checks tar layers for skill files that would compete with annotated
 * layers. Called only when the annotated strategy was selected AND tar
 * layers also exist in the manifest.
 *
 * Throws AmbiguousSkillFilesError if any tar layer contains a
 * matching SkillCard or Markdown file, since the annotated layers
 * already provide one of each.
 */
async function checkTarLayersForCompetingFiles(
  imageRef: ImageRef,
  tarLayers: OciDescriptor[],
  logger: LoggerService,
  credentials: RegistryCredentials | undefined,
  blobSignal: AbortSignal,
  options: SkillImageOptions,
  budget: ImageWorkBudget,
): Promise<void> {
  for (const layer of tarLayers) {
    const blob = await fetchBlob(
      imageRef,
      layer.digest,
      layer.size,
      logger,
      credentials,
      blobSignal,
      options,
    );
    budget.charge(blob.length);
    const entries = parseTarEntries(
      maybeDecompress(blob, options.maxBlobSizeBytes, budget),
    );
    const yamlCount = countTarFileMatches(entries, YAML_NAMES);
    const mdCount = countTarFileMatches(entries, MD_NAMES);

    if (yamlCount > 0) {
      throw new AmbiguousSkillFilesError(
        `Competing SkillCard: annotated layer and tar entry both provide a SkillCard`,
      );
    }
    if (mdCount > 0) {
      throw new AmbiguousSkillFilesError(
        `Competing Markdown: annotated layer and tar entry both provide a Markdown document`,
      );
    }
  }
}

interface ExtractedSkillContents {
  skillImageYamlContent: string;
  skillsMdContent: string;
}

async function fetchAnnotatedContents(
  imageRef: ImageRef,
  strategy: Extract<ExtractionStrategy, { mode: 'annotated' }>,
  logger: LoggerService,
  credentials: RegistryCredentials | undefined,
  blobSignal: AbortSignal,
  blobController: AbortController,
  options: SkillImageOptions,
  budget: ImageWorkBudget,
): Promise<ExtractedSkillContents> {
  const cancelSiblings = <T>(promise: Promise<T>): Promise<T> =>
    promise.catch(error => {
      blobController.abort();
      throw error;
    });
  const [yamlBuf, mdBuf] = await Promise.all([
    cancelSiblings(
      fetchBlob(
        imageRef,
        strategy.skillImageYamlLayer.digest,
        strategy.skillImageYamlLayer.size,
        logger,
        credentials,
        blobSignal,
        options,
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
        options,
      ),
    ),
  ]);

  budget.charge(yamlBuf.length);
  budget.charge(mdBuf.length);

  return {
    skillImageYamlContent: yamlBuf.toString('utf-8'),
    skillsMdContent: mdBuf.toString('utf-8'),
  };
}

/**
 * Counts how many tar entries match the given names across all entries.
 */
function countTarFileMatches(entries: TarEntry[], names: string[]): number {
  let count = 0;
  for (const entry of entries) {
    for (const name of names) {
      if (entry.name === name || entry.name.endsWith(`/${name}`)) {
        count++;
        break; // Only count each entry once even if it matches multiple names
      }
    }
  }
  return count;
}

async function fetchTarContents(
  imageRef: ImageRef,
  strategy: Extract<ExtractionStrategy, { mode: 'tar' }>,
  logger: LoggerService,
  credentials: RegistryCredentials | undefined,
  blobSignal: AbortSignal,
  options: SkillImageOptions,
  budget: ImageWorkBudget,
): Promise<ExtractedSkillContents> {
  let yamlBuf: Buffer | undefined;
  let mdBuf: Buffer | undefined;
  const fetchAnnotated = async (layer: OciDescriptor) => {
    const buf = await fetchBlob(
      imageRef,
      layer.digest,
      layer.size,
      logger,
      credentials,
      blobSignal,
      options,
    );
    budget.charge(buf.length);
    return buf;
  };
  if (strategy.skillImageYamlLayer)
    yamlBuf = await fetchAnnotated(strategy.skillImageYamlLayer);
  if (strategy.skillsMdLayer)
    mdBuf = await fetchAnnotated(strategy.skillsMdLayer);
  let totalYamlCount = yamlBuf ? 1 : 0;
  let totalMdCount = mdBuf ? 1 : 0;

  for (const layer of strategy.layers) {
    const blob = await fetchBlob(
      imageRef,
      layer.digest,
      layer.size,
      logger,
      credentials,
      blobSignal,
      options,
    );
    budget.charge(blob.length);
    const entries = parseTarEntries(
      maybeDecompress(blob, options.maxBlobSizeBytes, budget),
    );

    // Count all matches for ambiguity detection
    totalYamlCount += countTarFileMatches(entries, YAML_NAMES);
    totalMdCount += countTarFileMatches(entries, MD_NAMES);

    yamlBuf ??= findTarFile(entries, YAML_NAMES);
    mdBuf ??= findTarFile(entries, MD_NAMES);
  }

  // Check for ambiguous competing files per D4
  if (totalYamlCount > 1) {
    throw new AmbiguousSkillFilesError(
      `${totalYamlCount} competing SkillCard files found across tar layers`,
    );
  }
  if (totalMdCount > 1) {
    throw new AmbiguousSkillFilesError(
      `${totalMdCount} competing Markdown files found across tar layers`,
    );
  }

  if (!yamlBuf || !mdBuf) {
    const missing = [
      yamlBuf ? undefined : YAML_NAMES.join('/'),
      mdBuf ? undefined : MD_NAMES.join('/'),
    ].filter((name): name is string => Boolean(name));
    throw new NonSkillImageError(
      `Tar layers did not contain the required skill files: ${missing.join(
        ', ',
      )}`,
    );
  }

  return {
    skillImageYamlContent: yamlBuf.toString('utf-8'),
    skillsMdContent: mdBuf.toString('utf-8'),
  };
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
 * Returns true if a process with the given PID is still running.
 * Uses signal 0 which validates the PID without sending a signal.
 */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error: unknown) {
    // EPERM: process exists but we lack permission to signal it
    if (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'EPERM'
    ) {
      return true;
    }
    // ESRCH or other: process does not exist
    return false;
  }
}

/**
 * Removes stale `skill-image-*` temporary directories that may have been
 * left behind by a previous process that crashed, was OOM-killed, or
 * otherwise terminated abnormally before cleanup could run.
 *
 * Directories with an `.owner` file referencing a still-running process
 * are preserved to prevent multi-instance race conditions where one
 * backend instance deletes another's active extraction directories.
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
      // Check for an .owner lock file — if the owning process is still
      // alive, skip this directory to avoid destroying another instance's
      // active extractions.
      try {
        const ownerContent = await fs.promises.readFile(
          platformPath.join(dirPath, '.owner'),
          'utf-8',
        );
        const ownerPid = Number.parseInt(ownerContent.trim(), 10);
        if (!Number.isNaN(ownerPid) && isProcessAlive(ownerPid)) {
          logger.debug(
            `Skipping extraction directory ${dirPath} owned by running process ${ownerPid}`,
          );
          continue;
        }
      } catch {
        // No .owner file or unreadable — treat as stale
      }
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
