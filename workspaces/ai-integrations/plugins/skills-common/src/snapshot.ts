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

import type {
  NpxSkillRecord,
  OciSkillRecord,
  SkillSnapshot,
  SnapshotSource,
  SnapshotStatus,
} from './types';
import { MAX_SNAPSHOT_BYTES, MAX_SNAPSHOT_RECORDS } from './validation';

/**
 * Sorts skill records by stable `key` in ascending Unicode code-point order.
 *
 * This is the deterministic ordering required by design D2: before applying
 * count or serialized-size limits, connectors sort records by stable `key`
 * and include the longest prefix that fits.
 *
 * @public
 */
export function sortRecordsByKey<T extends OciSkillRecord | NpxSkillRecord>(
  records: T[],
): T[] {
  return [...records].sort((a, b) => {
    if (a.key < b.key) return -1;
    if (a.key > b.key) return 1;
    return 0;
  });
}

/**
 * Options for creating a bounded snapshot.
 *
 * @public
 */
export interface BoundSnapshotOptions {
  /** Source identity. */
  source: SnapshotSource;
  /** All successfully normalized records (will be sorted and bounded). */
  records: Array<OciSkillRecord | NpxSkillRecord>;
  /** Stable keys of skills that failed processing. */
  failedSkillKeys: string[];
  /**
   * Whether discovery completed without failures or limits.
   * When `true` and no failed keys, status is `ready`.
   * When `false`, status is `partial`.
   */
  discoveryComplete: boolean;
  /** UTC observation time. */
  observedAt: string;
}

/**
 * Creates a bounded v1 skill snapshot with deterministic ordering.
 *
 * Sorts records by stable key in ascending Unicode code-point order,
 * then selects the longest prefix that fits within:
 * - {@link MAX_SNAPSHOT_RECORDS} (1,000) records
 * - {@link MAX_SNAPSHOT_BYTES} (5 MiB) serialized JSON
 *
 * If bounding removes records, the status becomes `partial` — a
 * truncated `ready` response is never produced per design D2.
 *
 * Failed keys are sorted in the same ascending order.
 *
 * @public
 */
export function boundSnapshot(options: BoundSnapshotOptions): SkillSnapshot {
  const { source, records, failedSkillKeys, discoveryComplete, observedAt } =
    options;

  // Sort records and failed keys by stable key
  const sortedRecords = sortRecordsByKey(records);
  const sortedFailedKeys = [...failedSkillKeys].sort((a, b) =>
    a.localeCompare(b),
  );

  // Determine initial status
  let bounded = false;

  // Apply count bound
  let boundedRecords = sortedRecords;
  if (boundedRecords.length > MAX_SNAPSHOT_RECORDS) {
    boundedRecords = boundedRecords.slice(0, MAX_SNAPSHOT_RECORDS);
    bounded = true;
  }

  // Apply size bound by finding the longest prefix that fits
  boundedRecords = applyByteLimit(
    boundedRecords,
    source,
    sortedFailedKeys,
    observedAt,
  );
  if (boundedRecords.length < sortedRecords.length) {
    bounded = true;
  }

  // Determine final status per design D6
  let status: SnapshotStatus;
  if (bounded || !discoveryComplete) {
    status = 'partial';
  } else if (sortedFailedKeys.length > 0) {
    status = 'partial';
  } else {
    status = 'ready';
  }

  return {
    schemaVersion: '1',
    source,
    status,
    observedAt,
    skills: boundedRecords,
    failedSkillKeys: sortedFailedKeys,
  };
}

/**
 * Finds the longest prefix of sorted records whose snapshot serialization
 * fits within MAX_SNAPSHOT_BYTES.
 */
function applyByteLimit(
  sortedRecords: Array<OciSkillRecord | NpxSkillRecord>,
  source: SnapshotSource,
  failedSkillKeys: string[],
  observedAt: string,
): Array<OciSkillRecord | NpxSkillRecord> {
  // First check if all records fit
  const fullSnapshot: SkillSnapshot = {
    schemaVersion: '1',
    source,
    status: 'partial', // worst-case placeholder — 'partial' is the longest status value
    observedAt,
    skills: sortedRecords,
    failedSkillKeys,
  };
  const fullSize = byteLength(JSON.stringify(fullSnapshot));
  if (fullSize <= MAX_SNAPSHOT_BYTES) {
    return sortedRecords;
  }

  // Binary search for the longest prefix that fits
  let lo = 0;
  let hi = sortedRecords.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate: SkillSnapshot = {
      schemaVersion: '1',
      source,
      status: 'partial',
      observedAt,
      skills: sortedRecords.slice(0, mid),
      failedSkillKeys,
    };
    const size = byteLength(JSON.stringify(candidate));
    if (size <= MAX_SNAPSHOT_BYTES) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return sortedRecords.slice(0, lo);
}

/**
 * Returns the UTF-8 byte length of a string.
 */
function byteLength(str: string): number {
  return Buffer.byteLength(str, 'utf8');
}

/**
 * Creates a `loading` snapshot for a source that has not yet completed
 * its first acquisition.
 *
 * @public
 */
export function createLoadingSnapshot(source: SnapshotSource): SkillSnapshot {
  return {
    schemaVersion: '1',
    source,
    status: 'loading',
    observedAt: null,
    skills: [],
    failedSkillKeys: [],
  };
}

/**
 * Creates a `failed` snapshot when no usable discovery result could
 * be obtained.
 *
 * @public
 */
export function createFailedSnapshot(
  source: SnapshotSource,
  observedAt: string,
): SkillSnapshot {
  return {
    schemaVersion: '1',
    source,
    status: 'failed',
    observedAt,
    skills: [],
    failedSkillKeys: [],
  };
}
