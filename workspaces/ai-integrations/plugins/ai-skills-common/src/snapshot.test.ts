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
  npxSource,
  ociSource,
  validNpxRecordFull,
  validNpxRecordMinimal,
  validOciRecordFull,
  validOciRecordMinimal,
} from './fixtures';
import {
  boundSnapshot,
  createFailedSnapshot,
  createLoadingSnapshot,
  sortRecordsByKey,
} from './snapshot';
import type { OciSkillRecord } from './types';
import {
  MAX_SNAPSHOT_BYTES,
  MAX_SNAPSHOT_RECORDS,
  validateSnapshot,
} from './validation';

describe('sortRecordsByKey', () => {
  it('sorts records by key in ascending order', () => {
    const sorted = sortRecordsByKey([
      validOciRecordFull,
      validOciRecordMinimal,
    ]);
    // validOciRecordFull.key < validOciRecordMinimal.key
    // 'quay.io/octo/hello-world-skill:1.0.0-draft' < 'quay.io/octo/minimal-skill:latest'
    expect(sorted[0].key).toBe('quay.io/octo/hello-world-skill:1.0.0-draft');
    expect(sorted[1].key).toBe('quay.io/octo/minimal-skill:latest');
  });

  it('does not mutate the input array', () => {
    const original = [validOciRecordMinimal, validOciRecordFull];
    sortRecordsByKey(original);
    expect(original[0].key).toBe(validOciRecordMinimal.key);
  });

  it('handles empty array', () => {
    expect(sortRecordsByKey([])).toEqual([]);
  });

  it('handles single record', () => {
    const result = sortRecordsByKey([validOciRecordFull]);
    expect(result).toHaveLength(1);
  });
});

describe('boundSnapshot', () => {
  it('creates a ready snapshot when discovery is complete and no failures', () => {
    const snapshot = boundSnapshot({
      source: ociSource,
      records: [validOciRecordFull, validOciRecordMinimal],
      failedSkillKeys: [],
      discoveryComplete: true,
      observedAt: '2026-09-01T12:00:00Z',
    });

    expect(snapshot.schemaVersion).toBe('1');
    expect(snapshot.status).toBe('ready');
    expect(snapshot.source).toEqual(ociSource);
    expect(snapshot.skills).toHaveLength(2);
    expect(snapshot.failedSkillKeys).toEqual([]);
    // Records should be sorted by key
    expect(snapshot.skills[0].key).toBe(
      'quay.io/octo/hello-world-skill:1.0.0-draft',
    );
    expect(snapshot.skills[1].key).toBe('quay.io/octo/minimal-skill:latest');
  });

  it('creates a partial snapshot when discovery is incomplete', () => {
    const snapshot = boundSnapshot({
      source: ociSource,
      records: [validOciRecordMinimal],
      failedSkillKeys: [],
      discoveryComplete: false,
      observedAt: '2026-09-01T12:00:00Z',
    });
    expect(snapshot.status).toBe('partial');
  });

  it('creates a partial snapshot when there are failed keys', () => {
    const snapshot = boundSnapshot({
      source: ociSource,
      records: [validOciRecordMinimal],
      failedSkillKeys: ['quay.io/octo/broken-skill:v1'],
      discoveryComplete: true,
      observedAt: '2026-09-01T12:00:00Z',
    });
    expect(snapshot.status).toBe('partial');
  });

  it('sorts failed keys in ascending order', () => {
    const snapshot = boundSnapshot({
      source: ociSource,
      records: [],
      failedSkillKeys: ['z-key', 'a-key', 'm-key'],
      discoveryComplete: false,
      observedAt: '2026-09-01T12:00:00Z',
    });
    expect(snapshot.failedSkillKeys).toEqual(['a-key', 'm-key', 'z-key']);
  });

  it('sorts failed keys using Unicode code-point order (same as records)', () => {
    // Verify non-ASCII keys are sorted by code-point, not locale
    const snapshot = boundSnapshot({
      source: ociSource,
      records: [],
      failedSkillKeys: ['ä-key', 'Z-key', 'a-key'],
      discoveryComplete: false,
      observedAt: '2026-09-01T12:00:00Z',
    });
    // Unicode code-point order: 'Z' (U+005A) < 'a' (U+0061) < 'ä' (U+00E4)
    expect(snapshot.failedSkillKeys).toEqual(['Z-key', 'a-key', 'ä-key']);
  });

  it('produces valid snapshot per validateSnapshot', () => {
    const snapshot = boundSnapshot({
      source: ociSource,
      records: [validOciRecordFull, validOciRecordMinimal],
      failedSkillKeys: [],
      discoveryComplete: true,
      observedAt: '2026-09-01T12:00:00Z',
    });
    expect(validateSnapshot(snapshot).valid).toBe(true);
  });

  it('works with npx records', () => {
    const snapshot = boundSnapshot({
      source: npxSource,
      records: [validNpxRecordFull, validNpxRecordMinimal],
      failedSkillKeys: [],
      discoveryComplete: true,
      observedAt: '2026-09-01T12:00:00Z',
    });
    expect(snapshot.status).toBe('ready');
    expect(validateSnapshot(snapshot).valid).toBe(true);
  });

  it('handles empty records with complete discovery (successful empty)', () => {
    const snapshot = boundSnapshot({
      source: ociSource,
      records: [],
      failedSkillKeys: [],
      discoveryComplete: true,
      observedAt: '2026-09-01T12:00:00Z',
    });
    expect(snapshot.status).toBe('ready');
    expect(snapshot.skills).toEqual([]);
    expect(validateSnapshot(snapshot).valid).toBe(true);
  });

  describe('count bound', () => {
    it('truncates to MAX_SNAPSHOT_RECORDS and sets partial', () => {
      const records: OciSkillRecord[] = Array.from(
        { length: MAX_SNAPSHOT_RECORDS + 50 },
        (_, i) => ({
          key: `quay.io/octo/skill-${String(i).padStart(5, '0')}`,
          name: `Skill ${i}`,
          sourceUri: `oci://quay.io/octo/skill-${i}@sha256:${'a'.repeat(64)}`,
          digest: `sha256:${'a'.repeat(64)}`,
        }),
      );

      const snapshot = boundSnapshot({
        source: ociSource,
        records,
        failedSkillKeys: [],
        discoveryComplete: true,
        observedAt: '2026-09-01T12:00:00Z',
      });

      expect(snapshot.status).toBe('partial');
      expect(snapshot.skills.length).toBeLessThanOrEqual(MAX_SNAPSHOT_RECORDS);
      // Should select the longest prefix by sorted key
      expect(snapshot.skills[0].key).toBe('quay.io/octo/skill-00000');
    });
  });

  describe('byte-size bound', () => {
    it('truncates to fit within MAX_SNAPSHOT_BYTES and sets partial', () => {
      // Create records with large descriptions to exceed byte limit
      const largeDescription = 'x'.repeat(10_000);
      const records: OciSkillRecord[] = Array.from({ length: 600 }, (_, i) => ({
        key: `quay.io/octo/large-${String(i).padStart(4, '0')}`,
        name: `Large Skill ${i}`,
        description: largeDescription,
        sourceUri: `oci://quay.io/octo/large-${i}@sha256:${'b'.repeat(64)}`,
        digest: `sha256:${'b'.repeat(64)}`,
      }));

      const snapshot = boundSnapshot({
        source: ociSource,
        records,
        failedSkillKeys: [],
        discoveryComplete: true,
        observedAt: '2026-09-01T12:00:00Z',
      });

      expect(snapshot.status).toBe('partial');
      expect(snapshot.skills.length).toBeLessThan(600);
      // Verify the resulting snapshot fits within the byte limit
      const serialized = JSON.stringify(snapshot);
      const byteLen = Buffer.byteLength(serialized, 'utf8');
      expect(byteLen).toBeLessThanOrEqual(MAX_SNAPSHOT_BYTES);
      // And that it's still a valid snapshot
      expect(validateSnapshot(snapshot).valid).toBe(true);
    });
  });
});

describe('createLoadingSnapshot', () => {
  it('creates a valid loading snapshot', () => {
    const snapshot = createLoadingSnapshot(ociSource);
    expect(snapshot.status).toBe('loading');
    expect(snapshot.observedAt).toBeNull();
    expect(snapshot.skills).toEqual([]);
    expect(snapshot.failedSkillKeys).toEqual([]);
    expect(validateSnapshot(snapshot).valid).toBe(true);
  });
});

describe('createFailedSnapshot', () => {
  it('creates a valid failed snapshot', () => {
    const snapshot = createFailedSnapshot(ociSource, '2026-09-01T12:00:00Z');
    expect(snapshot.status).toBe('failed');
    expect(snapshot.observedAt).toBe('2026-09-01T12:00:00Z');
    expect(snapshot.skills).toEqual([]);
    expect(validateSnapshot(snapshot).valid).toBe(true);
  });
});
