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
 * within bounded page and candidate budgets, processes only `skill-md`
 * entries, and detects duplicate names and pagination cycles.
 *
 * @packageDocumentation
 */

import type { LoggerService } from '@backstage/backend-plugin-api';
import { buildNpxRef } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import { fetchSourceBuffer, validateRequestUrl } from './fetchSource';
import type { NpxSourceConfig } from './types';

/** Maximum number of discovery pages to follow per refresh. */
const MAX_PAGES = 100;

/** Maximum number of skill candidates to process per refresh. */
const MAX_CANDIDATES = 1_000;

/** Keep untrusted keys and diagnostics within the snapshot response budget. */
const MAX_NAME_BYTES = 1_024;

const DISCOVERY_SCHEMA =
  'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

/** Total discovery deadline in milliseconds (five minutes). */
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
  /** Whether at least one index page was fetched and parsed successfully. */
  hasUsablePage: boolean;
  /** Whether discovery completed without failures, limits, or cycles. */
  complete: boolean;
}

/**
 * Parsed Agent Skills v0.2 index page.
 */
interface IndexPage {
  /** Array of index skills. */
  skills: unknown[];
  /** Absolute URL of the next page, or absent for the last page. */
  next?: string;
}

/**
 * Resolves an artifact URL against its index page and returns a safe,
 * serialized HTTPS URL without credentials or fragments.
 */
function validateArtifactUrl(
  raw: unknown,
  digest: string,
  indexUrl: string,
): string | null {
  if (typeof raw !== 'string') return null;
  let parsed: URL;
  try {
    parsed = new URL(raw, indexUrl);
  } catch {
    return null;
  }
  try {
    validateRequestUrl(parsed);
    // Use the shared reference policy before retaining an untrusted URL.
    buildNpxRef(parsed.toString(), digest);
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
function parseIndexPage(buffer: Buffer, indexUrl: string): IndexPage {
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

  if (obj.$schema !== DISCOVERY_SCHEMA) {
    throw new Error('Index page has an unsupported discovery schema');
  }

  if (!Array.isArray(obj.skills)) {
    throw new Error('Index page must contain a skills array');
  }

  const page: IndexPage = {
    skills: obj.skills,
  };

  if ('next' in obj) {
    if (typeof obj.next !== 'string' || obj.next.trim().length === 0) {
      throw new Error('Index page has an invalid next URL');
    }
    try {
      page.next = new URL(obj.next.trim(), indexUrl).toString();
    } catch {
      throw new Error('Index page has an invalid next URL');
    }
  }

  return page;
}

/**
 * Discovers skill-md entries from an Agent Skills v0.2 index.
 *
 * Follows pagination, enforces bounded budgets (page count, candidate
 * count, and five-minute deadline), detects pagination cycles, and
 * handles duplicate entry names.
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

  // Track names before validating fields so a malformed duplicate cannot
  // leave a successful entry with the same failed key.
  const entriesByName = new Map<string, DiscoveredEntry>();
  const seenNames = new Set<string>();
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
      page = parseIndexPage(buffer, nextUrl);
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

    // Process skills on this page
    for (const rawEntry of page.skills) {
      // Check candidate budget — skipped and failed count too
      if (candidateCount >= MAX_CANDIDATES) {
        logger.warn(
          `Candidate budget exhausted for source '${source.id}': reached ${MAX_CANDIDATES} candidates`,
        );
        complete = false;
        break;
      }
      candidateCount++;

      if (
        typeof rawEntry !== 'object' ||
        rawEntry === null ||
        Array.isArray(rawEntry)
      ) {
        logger.warn(`Skipping malformed index entry in source '${source.id}'`);
        complete = false;
        continue;
      }

      const entryData = rawEntry as RawIndexEntry;

      // Validate entry name
      const name = typeof entryData.name === 'string' ? entryData.name : '';
      if (!name) {
        logger.warn(
          `Skipping index entry with missing or empty name in source '${source.id}'`,
        );
        complete = false;
        continue;
      }

      if (Buffer.byteLength(name, 'utf8') > MAX_NAME_BYTES) {
        logger.warn(
          `Skipping index entry with oversized name in source '${source.id}'`,
        );
        complete = false;
        continue;
      }

      if (name.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
        logger.warn(
          `Skipping entry with invalid name in source '${source.id}'`,
        );
        failedKeys.add(name);
        complete = false;
        continue;
      }

      if (seenNames.has(name)) {
        entriesByName.delete(name);
        failedKeys.add(name);
        complete = false;
        logger.warn(
          `Duplicate entry name '${name}' in source '${source.id}': all occurrences excluded`,
        );
        continue;
      }
      seenNames.add(name);

      // Check entry type
      const entryType =
        typeof entryData.type === 'string' ? entryData.type.trim() : '';

      // Archive entries are skipped — does NOT make snapshot incomplete
      if (entryType === 'archive') {
        logger.info(
          `Skipping archive entry '${name}' in source '${source.id}': archive ingestion is out of scope`,
        );
        continue;
      }

      // Only explicitly declared skill-md entries can be processed.
      if (entryType !== 'skill-md') {
        logger.warn(
          `Skipping entry '${name}' with unsupported type in source '${source.id}'`,
        );
        failedKeys.add(name);
        complete = false;
        continue;
      }

      // Validate digest before passing it to the shared URL policy.
      if (!isValidIndexDigest(entryData.digest)) {
        logger.warn(
          `Skipping entry '${name}' in source '${source.id}': invalid or missing digest`,
        );
        failedKeys.add(name);
        complete = false;
        continue;
      }

      const artifactUrl = validateArtifactUrl(
        entryData.url,
        entryData.digest,
        nextUrl,
      );
      if (!artifactUrl) {
        logger.warn(
          `Skipping entry '${name}' in source '${source.id}': invalid or missing artifact URL`,
        );
        failedKeys.add(name);
        complete = false;
        continue;
      }

      if (
        typeof entryData.description === 'string' &&
        Array.from(entryData.description).length > 1_024
      ) {
        logger.warn(
          `Skipping entry '${name}' with oversized description in source '${source.id}'`,
        );
        failedKeys.add(name);
        complete = false;
        continue;
      }

      const entry: DiscoveredEntry = {
        name,
        type: 'skill-md',
        url: artifactUrl,
        digest: entryData.digest,
      };

      if (
        typeof entryData.description === 'string' &&
        entryData.description.trim().length > 0
      ) {
        entry.description = entryData.description.trim();
      }

      entriesByName.set(name, entry);
    }

    // A full page budget with another page still pending is incomplete.
    if (candidateCount >= MAX_CANDIDATES && page.next) {
      logger.warn(
        `Candidate budget exhausted for source '${source.id}': reached ${MAX_CANDIDATES} candidates`,
      );
      complete = false;
    }

    // If the candidate budget was exhausted, stop before another fetch.
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
    hasUsablePage: pageCount > 0,
    complete,
  };
}
