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
 * Agent Skills v0.2 index discovery for the npx connector.
 *
 * Fetches and validates public discovery indexes, follows pagination
 * with D7 page/candidate budgets, processes only `skill-md` entries,
 * and detects duplicate names and pagination cycles.
 *
 * @packageDocumentation
 */

import type { LoggerService } from '@backstage/backend-plugin-api';
import { fetchSourceBuffer, validateRequestUrl } from './fetchSource';
import type { NpxSourceConfig } from './types';

/** Maximum number of discovery pages per refresh (design D7). */
const MAX_PAGES = 100;

/** Maximum number of candidates per refresh (design D7). */
const MAX_CANDIDATES = 1_000;

/** Total discovery deadline in milliseconds (design D7: five minutes). */
const DISCOVERY_DEADLINE_MS = 5 * 60 * 1_000;

/**
 * A raw entry from the Agent Skills v0.2 discovery index.
 *
 * Each entry declares a skill artifact by name, type, artifact URL,
 * and SHA-256 digest. Only `skill-md` entries are supported; `archive`
 * entries are skipped with a diagnostic.
 */
export interface RawIndexEntry {
  /** Stable identity within this index. */
  name?: unknown;
  /** Entry description. */
  description?: unknown;
  /** Artifact format type (`skill-md` or `archive`). */
  type?: unknown;
  /** Absolute HTTPS URL of the skill artifact. */
  url?: unknown;
  /** SHA-256 digest of the artifact bytes (`sha256:<64 hex>`). */
  digest?: unknown;
}

/**
 * A validated, processable skill-md discovery entry.
 */
export interface DiscoveredEntry {
  /** Stable identity key (the entry `name`). */
  name: string;
  /** Optional description from the discovery entry. */
  description?: string;
  /** Artifact type — always `'skill-md'` for processed entries. */
  type: 'skill-md';
  /** Absolute HTTPS artifact URL. */
  url: string;
  /** SHA-256 digest from the index. */
  digest: string;
}

/**
 * Result of an index discovery operation.
 */
export interface DiscoveryResult {
  /** Successfully discovered skill-md entries with unique names. */
  entries: DiscoveredEntry[];
  /** Stable keys of entries that failed processing (duplicates, etc.). */
  failedKeys: string[];
  /** Whether discovery completed without failures, limits, or cycles. */
  complete: boolean;
}

/**
 * Parsed Agent Skills v0.2 index page.
 */
interface IndexPage {
  /** Array of index entries. */
  entries: RawIndexEntry[];
  /** Absolute URL of the next page, or absent for the last page. */
  next?: string;
}

/**
 * Validates that an artifact URL is a valid HTTPS URL without
 * credentials or fragments. Returns the serialized URL on success.
 */
function validateArtifactUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  try {
    validateRequestUrl(parsed);
  } catch {
    return null;
  }
  return parsed.toString();
}

/**
 * Validates a SHA-256 digest string from the index.
 */
function isValidIndexDigest(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^sha256:[0-9a-f]{64}$/.test(value);
}

/**
 * Parses an index page from a JSON buffer.
 *
 * Returns the parsed page or throws on invalid JSON or structure.
 */
function parseIndexPage(buffer: Buffer): IndexPage {
  let parsed: unknown;
  try {
    parsed = JSON.parse(buffer.toString('utf-8'));
  } catch {
    throw new Error('Index page is not valid JSON');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Index page must be a JSON object');
  }

  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.entries)) {
    throw new Error('Index page must contain an entries array');
  }

  const page: IndexPage = {
    entries: obj.entries as RawIndexEntry[],
  };

  if (typeof obj.next === 'string' && obj.next.trim().length > 0) {
    page.next = obj.next.trim();
  }

  return page;
}

/**
 * Discovers skill-md entries from an Agent Skills v0.2 index.
 *
 * Follows pagination, enforces D7 budgets (page count, candidate count,
 * and five-minute deadline), detects pagination cycles, and handles
 * duplicate entry names.
 *
 * Archive entries are skipped with a logged diagnostic and do not make
 * the snapshot incomplete. Malformed supported entries are counted toward
 * the candidate budget but excluded from results with failed keys.
 */
export async function discoverIndex(
  source: NpxSourceConfig,
  logger: LoggerService,
  parentSignal?: AbortSignal,
): Promise<DiscoveryResult> {
  const deadlineSignal = AbortSignal.timeout(DISCOVERY_DEADLINE_MS);
  const signal = parentSignal
    ? AbortSignal.any([parentSignal, deadlineSignal])
    : deadlineSignal;

  // Track all entries by name for duplicate detection
  const entriesByName = new Map<string, DiscoveredEntry>();
  const duplicateNames = new Set<string>();
  const failedKeys = new Set<string>();
  let complete = true;
  let candidateCount = 0;

  // Track visited page URLs for cycle detection
  const visitedUrls = new Set<string>();
  let nextUrl: string | undefined = source.indexUrl;
  let pageCount = 0;

  while (nextUrl) {
    // Check for pagination cycle
    if (visitedUrls.has(nextUrl)) {
      logger.warn(
        `Pagination cycle detected for source '${source.id}': repeated URL`,
      );
      complete = false;
      break;
    }
    visitedUrls.add(nextUrl);

    // Check page budget
    if (pageCount >= MAX_PAGES) {
      logger.warn(
        `Page budget exhausted for source '${source.id}': reached ${MAX_PAGES} pages`,
      );
      complete = false;
      break;
    }

    // Check deadline
    if (signal.aborted) {
      logger.warn(`Discovery deadline reached for source '${source.id}'`);
      complete = false;
      break;
    }

    let page: IndexPage;
    try {
      const buffer = await fetchSourceBuffer(nextUrl, source, 'index', signal);
      page = parseIndexPage(buffer);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        `Failed to fetch index page ${pageCount + 1} for source '${
          source.id
        }': ${detail}`,
      );
      complete = false;
      break;
    }

    pageCount++;

    // Process entries on this page
    for (const rawEntry of page.entries) {
      // Check candidate budget — skipped and failed count too
      if (candidateCount >= MAX_CANDIDATES) {
        logger.warn(
          `Candidate budget exhausted for source '${source.id}': reached ${MAX_CANDIDATES} candidates`,
        );
        complete = false;
        break;
      }
      candidateCount++;

      // Validate entry name
      const name =
        typeof rawEntry.name === 'string' ? rawEntry.name.trim() : '';
      if (!name) {
        logger.warn(
          `Skipping index entry with missing or empty name in source '${source.id}'`,
        );
        complete = false;
        continue;
      }

      // Check entry type
      const entryType =
        typeof rawEntry.type === 'string' ? rawEntry.type.trim() : '';

      // Archive entries are skipped — does NOT make snapshot incomplete
      if (entryType === 'archive') {
        logger.info(
          `Skipping archive entry '${name}' in source '${source.id}': archive ingestion is out of scope`,
        );
        continue;
      }

      // Non-skill-md, non-archive entries with a type are malformed supported entries
      if (entryType && entryType !== 'skill-md') {
        logger.warn(
          `Skipping entry '${name}' with unsupported type '${entryType}' in source '${source.id}'`,
        );
        failedKeys.add(name);
        complete = false;
        continue;
      }

      // Validate artifact URL
      const artifactUrl = validateArtifactUrl(rawEntry.url);
      if (!artifactUrl) {
        logger.warn(
          `Skipping entry '${name}' in source '${source.id}': invalid or missing artifact URL`,
        );
        failedKeys.add(name);
        complete = false;
        continue;
      }

      // Validate digest
      if (!isValidIndexDigest(rawEntry.digest)) {
        logger.warn(
          `Skipping entry '${name}' in source '${source.id}': invalid or missing digest`,
        );
        failedKeys.add(name);
        complete = false;
        continue;
      }

      const entry: DiscoveredEntry = {
        name,
        type: 'skill-md',
        url: artifactUrl,
        digest: rawEntry.digest as string,
      };

      if (
        typeof rawEntry.description === 'string' &&
        rawEntry.description.trim().length > 0
      ) {
        entry.description = rawEntry.description.trim();
      }

      // Handle duplicate names: exclude both and report as failed
      if (duplicateNames.has(name)) {
        // Already known duplicate — this additional occurrence is also excluded
        failedKeys.add(name);
        continue;
      }

      if (entriesByName.has(name)) {
        // First duplicate detected — remove the original and mark both
        duplicateNames.add(name);
        entriesByName.delete(name);
        failedKeys.add(name);
        complete = false;
        logger.warn(
          `Duplicate entry name '${name}' in source '${source.id}': both entries excluded`,
        );
        continue;
      }

      entriesByName.set(name, entry);
    }

    // If candidate budget was exhausted inside the loop, stop paging
    if (candidateCount >= MAX_CANDIDATES && !complete) {
      break;
    }

    // Check deadline before fetching the next page
    if (signal.aborted) {
      logger.warn(
        `Discovery deadline reached for source '${source.id}' after page ${pageCount}`,
      );
      complete = false;
      break;
    }

    nextUrl = page.next;
  }

  // Build deterministic result sorted by key (name)
  const entries = [...entriesByName.values()].sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });

  const sortedFailedKeys = [...failedKeys].sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  return {
    entries,
    failedKeys: sortedFailedKeys,
    complete,
  };
}
