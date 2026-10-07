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
  invalidFailedWithSkills,
  invalidLoadingWithObservedAt,
  invalidLoadingWithSkills,
  invalidNpxRecordWithOciExtension,
  invalidOciRecordUnknownExtKey,
  invalidOciRecordWithNpxExtension,
  invalidRecordBadDigest,
  invalidRecordEmptyKey,
  invalidRecordShortDigest,
  invalidSnapshotBadVersion,
  invalidSnapshotDuplicateKeys,
  invalidSnapshotNonUtcTimestamp,
  invalidSnapshotOverlappingKeys,
  invalidSnapshotReadyWithFailedKeys,
  npxSource,
  ociSource,
  validFailedSnapshot,
  validLoadingSnapshot,
  validNpxRecordFull,
  validNpxRecordMinimal,
  validNpxRecordWithQuery,
  validNpxSnapshotReady,
  validOciRecordEmptyExtensions,
  validOciRecordFull,
  validOciRecordMinimal,
  validOciSnapshotReady,
  validPartialEmptySnapshot,
  validPartialSnapshot,
  validReadyEmptySnapshot,
} from './fixtures';
import type { SkillSnapshot } from './types';
import {
  isNpxSkillRecord,
  isOciSkillRecord,
  isValidDigest,
  isValidUtcTimestamp,
  validateSnapshot,
  validateSnapshotSize,
} from './validation';

describe('isValidDigest', () => {
  it('accepts a valid lowercase SHA-256 digest', () => {
    expect(
      isValidDigest(
        'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      ),
    ).toBe(true);
  });

  it('rejects uppercase hex digits', () => {
    expect(
      isValidDigest(
        'sha256:ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789',
      ),
    ).toBe(false);
  });

  it('rejects truncated digest', () => {
    expect(isValidDigest('sha256:abcdef')).toBe(false);
  });

  it('rejects missing prefix', () => {
    expect(
      isValidDigest(
        'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
      ),
    ).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidDigest('')).toBe(false);
  });
});

describe('isValidUtcTimestamp', () => {
  it('accepts ISO 8601 Z suffix', () => {
    expect(isValidUtcTimestamp('2026-09-01T12:00:00Z')).toBe(true);
  });

  it('accepts ISO 8601 +00:00 suffix', () => {
    expect(isValidUtcTimestamp('2026-09-01T12:00:00+00:00')).toBe(true);
  });

  it('rejects non-UTC offset', () => {
    expect(isValidUtcTimestamp('2026-09-01T12:00:00-05:00')).toBe(false);
  });

  it('rejects invalid date string', () => {
    expect(isValidUtcTimestamp('not-a-date-Z')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidUtcTimestamp('')).toBe(false);
  });
});

describe('validateSnapshot', () => {
  describe('valid snapshots', () => {
    it('accepts a valid ready OCI snapshot', () => {
      const result = validateSnapshot(validOciSnapshotReady);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts a valid ready npx snapshot', () => {
      const result = validateSnapshot(validNpxSnapshotReady);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts a loading snapshot', () => {
      const result = validateSnapshot(validLoadingSnapshot);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts a partial snapshot with failed keys', () => {
      const result = validateSnapshot(validPartialSnapshot);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts a failed snapshot', () => {
      const result = validateSnapshot(validFailedSnapshot);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts a partial snapshot with no records or failed keys', () => {
      const result = validateSnapshot(validPartialEmptySnapshot);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts a ready snapshot with zero records (empty discovery)', () => {
      const result = validateSnapshot(validReadyEmptySnapshot);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('accepts OCI record with full metadata', () => {
      const snapshot: SkillSnapshot = {
        schemaVersion: '1',
        source: ociSource,
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [validOciRecordFull],
        failedSkillKeys: [],
      };
      expect(validateSnapshot(snapshot).valid).toBe(true);
    });

    it('accepts OCI record with only required fields', () => {
      const snapshot: SkillSnapshot = {
        schemaVersion: '1',
        source: ociSource,
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [validOciRecordMinimal],
        failedSkillKeys: [],
      };
      expect(validateSnapshot(snapshot).valid).toBe(true);
    });

    it('accepts OCI record with empty extensions object', () => {
      const snapshot: SkillSnapshot = {
        schemaVersion: '1',
        source: ociSource,
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [validOciRecordEmptyExtensions],
        failedSkillKeys: [],
      };
      expect(validateSnapshot(snapshot).valid).toBe(true);
    });

    it('accepts npx record with query-string source URI', () => {
      const snapshot: SkillSnapshot = {
        schemaVersion: '1',
        source: npxSource,
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [validNpxRecordWithQuery],
        failedSkillKeys: [],
      };
      expect(validateSnapshot(snapshot).valid).toBe(true);
    });

    it('accepts observedAt with +00:00 suffix', () => {
      const snapshot: SkillSnapshot = {
        schemaVersion: '1',
        source: ociSource,
        status: 'ready',
        observedAt: '2026-09-01T12:00:00+00:00',
        skills: [],
        failedSkillKeys: [],
      };
      expect(validateSnapshot(snapshot).valid).toBe(true);
    });
  });

  describe('schema version', () => {
    it('rejects unsupported schema version', () => {
      const result = validateSnapshot(invalidSnapshotBadVersion);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('schemaVersion'),
      );
    });
  });

  describe('source validation', () => {
    it('rejects empty source ID', () => {
      const result = validateSnapshot({
        schemaVersion: '1',
        source: { id: '', type: 'oci' },
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [],
        failedSkillKeys: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('source.id'),
      );
    });

    it('rejects unknown source type', () => {
      const result = validateSnapshot({
        schemaVersion: '1',
        source: { id: 'src', type: 'mlflow' },
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [],
        failedSkillKeys: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('source.type'),
      );
    });
  });

  describe('status invariants', () => {
    it('rejects loading with non-null observedAt', () => {
      const result = validateSnapshot(invalidLoadingWithObservedAt);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('observedAt'),
      );
    });

    it('rejects loading with skills', () => {
      const result = validateSnapshot(invalidLoadingWithSkills);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('must be empty for loading'),
      );
    });

    it('rejects ready with failed keys', () => {
      const result = validateSnapshot(invalidSnapshotReadyWithFailedKeys);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('must be empty for ready'),
      );
    });

    it('rejects failed with skills', () => {
      const result = validateSnapshot(invalidFailedWithSkills);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('must be empty for failed'),
      );
    });

    it('rejects non-UTC timestamp', () => {
      const result = validateSnapshot(invalidSnapshotNonUtcTimestamp);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('UTC'));
    });

    it('rejects completed status with null observedAt', () => {
      const result = validateSnapshot({
        schemaVersion: '1',
        source: ociSource,
        status: 'ready',
        observedAt: null,
        skills: [],
        failedSkillKeys: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('observedAt'),
      );
    });
  });

  describe('record key uniqueness', () => {
    it('accepts distinct OCI tags sharing one manifest and keeps failures tag-specific', () => {
      const result = validateSnapshot({
        ...validOciSnapshotReady,
        status: 'partial',
        skills: ['latest', 'v1'].map(tag => ({
          ...validOciRecordFull,
          key: `quay.io/octo/hello-world-skill:${tag}`,
        })),
        failedSkillKeys: ['quay.io/octo/hello-world-skill:v2'],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('rejects duplicate skill keys', () => {
      const result = validateSnapshot(invalidSnapshotDuplicateKeys);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('duplicate key'),
      );
    });

    it('rejects overlapping skill and failed keys', () => {
      const result = validateSnapshot(invalidSnapshotOverlappingKeys);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('overlaps with skills'),
      );
    });

    it('rejects duplicate failed keys', () => {
      const result = validateSnapshot({
        schemaVersion: '1',
        source: ociSource,
        status: 'partial',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [],
        failedSkillKeys: ['key-a', 'key-a'],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('duplicate key'),
      );
    });
  });

  describe('record field validation', () => {
    it('rejects empty key', () => {
      const result = validateSnapshot({
        schemaVersion: '1',
        source: ociSource,
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [invalidRecordEmptyKey],
        failedSkillKeys: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('key'));
    });

    it('rejects uppercase digest', () => {
      const result = validateSnapshot({
        schemaVersion: '1',
        source: ociSource,
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [invalidRecordBadDigest],
        failedSkillKeys: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('digest'));
    });

    it('rejects truncated digest', () => {
      const result = validateSnapshot({
        schemaVersion: '1',
        source: ociSource,
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [invalidRecordShortDigest],
        failedSkillKeys: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('digest'));
    });

    it('rejects empty name', () => {
      const result = validateSnapshot({
        schemaVersion: '1',
        source: ociSource,
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [
          {
            key: 'some-key',
            name: '',
            sourceUri:
              'oci://quay.io/octo/test@sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
            digest:
              'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
          },
        ],
        failedSkillKeys: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining('name'));
    });

    it('rejects empty sourceUri', () => {
      const result = validateSnapshot({
        schemaVersion: '1',
        source: ociSource,
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [
          {
            key: 'some-key',
            name: 'Test',
            sourceUri: '',
            digest:
              'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
          },
        ],
        failedSkillKeys: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('sourceUri'),
      );
    });

    it('rejects non-string optional field', () => {
      const result = validateSnapshot({
        schemaVersion: '1',
        source: ociSource,
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [
          {
            ...validOciRecordMinimal,
            key: 'bad-desc',
            description: 42,
          } as unknown,
        ],
        failedSkillKeys: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('description'),
      );
    });
  });

  describe('source-discriminated extensions', () => {
    it('rejects npx record with OCI extension in npx snapshot', () => {
      const result = validateSnapshot({
        schemaVersion: '1',
        source: npxSource,
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [invalidNpxRecordWithOciExtension],
        failedSkillKeys: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("only 'npx' is allowed"),
      );
    });

    it('rejects OCI record with npx extension in OCI snapshot', () => {
      const result = validateSnapshot({
        schemaVersion: '1',
        source: ociSource,
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [invalidOciRecordWithNpxExtension],
        failedSkillKeys: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("only 'oci' is allowed"),
      );
    });

    it('rejects unknown extension key within OCI container', () => {
      const result = validateSnapshot({
        schemaVersion: '1',
        source: ociSource,
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [invalidOciRecordUnknownExtKey],
        failedSkillKeys: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('unknown key'),
      );
    });

    it('rejects unknown extension container', () => {
      const result = validateSnapshot({
        schemaVersion: '1',
        source: ociSource,
        status: 'ready',
        observedAt: '2026-09-01T12:00:00Z',
        skills: [
          {
            ...validOciRecordMinimal,
            key: 'unknown-container',
            extensions: { mlflow: {} },
          } as unknown,
        ],
        failedSkillKeys: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('unknown container'),
      );
    });
  });

  describe('count bounds', () => {
    it('rejects snapshot exceeding 1,000 records', () => {
      const records = Array.from({ length: 1001 }, (_, i) => ({
        key: `key-${String(i).padStart(4, '0')}`,
        name: `Skill ${i}`,
        sourceUri: `oci://quay.io/octo/skill-${i}@sha256:${'a'.repeat(64)}`,
        digest: `sha256:${'a'.repeat(64)}`,
      }));
      const result = validateSnapshot({
        schemaVersion: '1',
        source: ociSource,
        status: 'partial',
        observedAt: '2026-09-01T12:00:00Z',
        skills: records,
        failedSkillKeys: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('exceeds maximum'),
      );
    });
  });
});

describe('validateSnapshotSize', () => {
  it('accepts a small snapshot', () => {
    const result = validateSnapshotSize(validOciSnapshotReady);
    expect(result.valid).toBe(true);
  });

  it('rejects a snapshot exceeding MAX_SNAPSHOT_BYTES', () => {
    const largeDescription = 'x'.repeat(100_000);
    const records = Array.from({ length: 100 }, (_, i) => ({
      key: `quay.io/octo/large-${String(i).padStart(4, '0')}`,
      name: `Large Skill ${i}`,
      description: largeDescription,
      sourceUri: `oci://quay.io/octo/large-${i}@sha256:${'a'.repeat(64)}`,
      digest: `sha256:${'a'.repeat(64)}`,
    }));
    const oversized: SkillSnapshot = {
      schemaVersion: '1',
      source: ociSource,
      status: 'partial',
      observedAt: '2026-09-01T12:00:00Z',
      skills: records,
      failedSkillKeys: [],
    };
    const result = validateSnapshotSize(oversized);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('exceeds maximum'),
    );
  });
});

describe('type guards', () => {
  it('isOciSkillRecord for full OCI record', () => {
    expect(isOciSkillRecord(validOciRecordFull, 'oci')).toBe(true);
  });

  it('isOciSkillRecord for minimal record (no extensions)', () => {
    expect(isOciSkillRecord(validOciRecordMinimal, 'oci')).toBe(true);
  });

  it('isNpxSkillRecord for full npx record', () => {
    expect(isNpxSkillRecord(validNpxRecordFull, 'npx')).toBe(true);
  });

  it('isNpxSkillRecord for minimal record (no extensions)', () => {
    expect(isNpxSkillRecord(validNpxRecordMinimal, 'npx')).toBe(true);
  });

  it('isOciSkillRecord returns false for wrong source type', () => {
    expect(isOciSkillRecord(validOciRecordFull, 'npx')).toBe(false);
  });

  it('isNpxSkillRecord returns false for wrong source type', () => {
    expect(isNpxSkillRecord(validNpxRecordFull, 'oci')).toBe(false);
  });

  it('isOciSkillRecord returns false for npx record with npx extensions', () => {
    expect(isOciSkillRecord(validNpxRecordFull, 'oci')).toBe(false);
  });

  it('isNpxSkillRecord returns false for OCI record with OCI extensions', () => {
    expect(isNpxSkillRecord(validOciRecordFull, 'npx')).toBe(false);
  });

  it('minimal record without extensions is not ambiguous', () => {
    // A minimal record (no extensions) should only match its actual source type
    expect(isOciSkillRecord(validOciRecordMinimal, 'oci')).toBe(true);
    expect(isNpxSkillRecord(validOciRecordMinimal, 'npx')).toBe(true);
    // But not the opposite source type
    expect(isOciSkillRecord(validOciRecordMinimal, 'npx')).toBe(false);
    expect(isNpxSkillRecord(validOciRecordMinimal, 'oci')).toBe(false);
  });
});
