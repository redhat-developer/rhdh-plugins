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

/**
 * Artifact retrieval, SHA-256 verification, and metadata normalization
 * for npx skill-md entries.
 *
 * Each discovered entry is fetched through the configured safe transport,
 * verified against its index digest, parsed for Markdown frontmatter,
 * and normalized using the shared normalizer. One bad entry never
 * suppresses valid records.
 *
 * @packageDocumentation
 */

import { createHash } from 'crypto';
import { parse as parseYaml } from 'yaml';
import type { LoggerService } from '@backstage/backend-plugin-api';
import {
  normalizeNpxMetadata,
  buildNpxRef,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type {
  NpxFrontmatter,
  NpxSkillRecord,
  TrustedSourceInput,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type { DiscoveredEntry } from './discoverIndex';
import { fetchSourceBuffer } from './fetchSource';
import type { NpxSourceConfig } from './types';

/** Maximum concurrent artifact operations per source. */
const MAX_CONCURRENCY = 4;

/**
 * Result of processing all discovered artifacts for a source.
 */
export interface ArtifactProcessingResult {
  /** Successfully normalized npx skill records. */
  records: NpxSkillRecord[];
  /** Stable keys of entries that failed retrieval or normalization. */
  failedKeys: string[];
}

/**
 * Extracts and parses YAML frontmatter from a skill Markdown document.
 *
 * Frontmatter is delimited by `---` at the start of the content.
 * Returns undefined when frontmatter is absent. Throws for malformed
 * or unclosed frontmatter.
 */
export function parseMarkdownFrontmatter(
  raw: string,
): NpxFrontmatter | undefined {
  const lines = raw.trimStart().split(/\r?\n/);
  if (!/^---[ \t]*$/.test(lines[0])) return undefined;
  const closing = lines.findIndex(
    (line, index) => index > 0 && /^---[ \t]*$/.test(line),
  );
  if (closing === -1)
    throw new TypeError('Frontmatter has no closing delimiter');
  const content = lines.slice(1, closing).join('\n');
  if (!content.trim()) return {};
  const doc: unknown = parseYaml(content, { maxAliasCount: 0, schema: 'core' });
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new TypeError('Frontmatter must be a YAML object');
  }
  return doc as NpxFrontmatter;
}

/**
 * Verifies the SHA-256 digest of raw artifact bytes against the
 * expected digest from the discovery index.
 *
 * @returns `true` when the computed digest matches the expected value.
 */
function verifyDigest(data: Buffer, expected: string): boolean {
  const hex = createHash('sha256').update(data).digest('hex');
  return `sha256:${hex}` === expected;
}

/**
 * Processes a single discovered entry: fetch, verify, parse, normalize.
 *
 * Returns the normalized record or `null` on any failure.
 */
async function processSingleEntry(
  entry: DiscoveredEntry,
  source: NpxSourceConfig,
  logger: LoggerService,
  parentSignal?: AbortSignal,
): Promise<NpxSkillRecord | null> {
  // Fetch the artifact bytes through the configured safe transport
  let buffer: Buffer;
  try {
    buffer = await fetchSourceBuffer(
      entry.url,
      source,
      'artifact',
      parentSignal,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    logger.warn(
      `Failed to fetch artifact for '${entry.name}' in source '${source.id}': ${detail}`,
    );
    return null;
  }

  // Verify SHA-256 over the original response bytes before decoding
  if (!verifyDigest(buffer, entry.digest)) {
    logger.warn(
      `Digest mismatch for '${entry.name}' in source '${source.id}': artifact bytes do not match index digest`,
    );
    return null;
  }

  // Decode and parse Markdown frontmatter
  let frontmatter: NpxFrontmatter | undefined;
  try {
    const text = buffer.toString('utf-8');
    frontmatter = parseMarkdownFrontmatter(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    logger.warn(
      `Failed to parse frontmatter for '${entry.name}' in source '${source.id}': ${detail}`,
    );
    return null;
  }

  // Build trusted source input — sourceUri and digest come from
  // verified retrieval, never from frontmatter
  let sourceUri: string;
  try {
    // Validate the URL through the shared reference policy;
    // buildNpxRef throws on credential-bearing or signed-token URLs.
    buildNpxRef(entry.url, entry.digest);
    sourceUri = entry.url;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    logger.warn(
      `Invalid source reference for '${entry.name}' in source '${source.id}': ${detail}`,
    );
    return null;
  }

  const trusted: TrustedSourceInput = {
    key: entry.name,
    sourceUri,
    digest: entry.digest,
  };

  // Normalize using the shared metadata normalizer
  const { record, diagnostics } = normalizeNpxMetadata(
    {
      entry: {
        name: entry.name,
        description: entry.description,
        type: entry.type,
      },
      ...(frontmatter !== undefined ? { frontmatter } : {}),
    },
    trusted,
  );

  for (const diag of diagnostics) {
    logger.debug(
      `Normalization diagnostic for '${entry.name}' in source '${source.id}': [${diag.field}] ${diag.message}`,
    );
  }

  if (!record) {
    logger.warn(
      `Normalization failed for '${entry.name}' in source '${source.id}': no valid record produced`,
    );
    return null;
  }

  return record;
}

/**
 * Processes all discovered entries with bounded concurrency.
 *
 * Each entry is fetched, verified, parsed, and normalized independently.
 * One bad entry never suppresses valid records.
 *
 * Concurrency is capped at four concurrent artifact operations per source.
 */
export async function processArtifacts(
  entries: DiscoveredEntry[],
  source: NpxSourceConfig,
  logger: LoggerService,
  parentSignal?: AbortSignal,
): Promise<ArtifactProcessingResult> {
  const records: NpxSkillRecord[] = [];
  const failedKeys: string[] = [];

  // Process in batches of MAX_CONCURRENCY
  for (let i = 0; i < entries.length; i += MAX_CONCURRENCY) {
    if (parentSignal?.aborted) {
      // Mark remaining entries as failed
      for (let j = i; j < entries.length; j++) {
        failedKeys.push(entries[j].name);
      }
      break;
    }

    const batch = entries.slice(i, i + MAX_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(entry =>
        processSingleEntry(entry, source, logger, parentSignal),
      ),
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const entry = batch[j];
      if (result.status === 'fulfilled' && result.value) {
        records.push(result.value);
      } else {
        failedKeys.push(entry.name);
        if (result.status === 'rejected') {
          const detail =
            result.reason instanceof Error
              ? result.reason.message
              : 'Unknown error';
          logger.warn(
            `Artifact processing rejected for '${entry.name}' in source '${source.id}': ${detail}`,
          );
        }
      }
    }
  }

  return { records, failedKeys };
}
