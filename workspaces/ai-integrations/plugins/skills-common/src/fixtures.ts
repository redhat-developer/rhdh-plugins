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
 * Reusable OCI and npx contract fixtures for connector and provider tests.
 *
 * @packageDocumentation
 */

import type {
  NpxSkillRecord,
  OciSkillRecord,
  SkillSnapshot,
  SnapshotSource,
} from './types';

// ─── Sources ──────────────────────────────────────────────────────────

/** @public */
export const ociSource: SnapshotSource = {
  id: 'quay-public',
  type: 'oci',
};

/** @public */
export const npxSource: SnapshotSource = {
  id: 'rhess-index',
  type: 'npx',
};

// ─── Valid OCI records ────────────────────────────────────────────────

/** A valid OCI skill record with full metadata. @public */
export const validOciRecordFull: OciSkillRecord = {
  key: 'quay.io/octo/hello-world-skill',
  name: 'Hello World Skill',
  description: 'A demo OCI skill image',
  version: '1.0.0',
  license: 'Apache-2.0',
  authors: [{ name: 'OCTO Team', email: 'octo@example.com' }],
  tags: ['demo', 'hello-world'],
  compatibility: 'rhdh-2.2',
  owner: 'team-octo',
  lifecycle: 'production',
  sourceUri:
    'oci://quay.io/octo/hello-world-skill@sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
  digest:
    'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
  extensions: {
    oci: {
      namespace: 'octo-skills',
      prompt: 'You are a helpful assistant.',
    },
  },
};

/** A valid OCI record with only required fields. @public */
export const validOciRecordMinimal: OciSkillRecord = {
  key: 'quay.io/octo/minimal-skill',
  name: 'Minimal Skill',
  sourceUri:
    'oci://quay.io/octo/minimal-skill@sha256:1111111111111111111111111111111111111111111111111111111111111111',
  digest:
    'sha256:1111111111111111111111111111111111111111111111111111111111111111',
};

/** A valid OCI record with empty extensions object. @public */
export const validOciRecordEmptyExtensions: OciSkillRecord = {
  key: 'quay.io/octo/no-ext-skill',
  name: 'No Extensions Skill',
  sourceUri:
    'oci://quay.io/octo/no-ext-skill@sha256:2222222222222222222222222222222222222222222222222222222222222222',
  digest:
    'sha256:2222222222222222222222222222222222222222222222222222222222222222',
  extensions: {},
};

// ─── Valid npx records ────────────────────────────────────────────────

/** A valid npx skill record with full metadata. @public */
export const validNpxRecordFull: NpxSkillRecord = {
  key: 'summarize-text',
  name: 'Summarize Text',
  description: 'Summarizes input text using an LLM',
  version: '0.2.0',
  license: 'MIT',
  authors: [{ name: 'Agent Team' }],
  tags: ['summarization', 'text'],
  compatibility: 'agent-skills-v0.2',
  sourceUri: 'https://registry.example.com/skills/summarize-text/SKILL.md',
  digest:
    'sha256:fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
  extensions: {
    npx: {
      type: 'skill-md',
    },
  },
};

/** A valid npx record with only required fields. @public */
export const validNpxRecordMinimal: NpxSkillRecord = {
  key: 'basic-skill',
  name: 'Basic Skill',
  sourceUri: 'https://registry.example.com/skills/basic-skill/SKILL.md',
  digest:
    'sha256:3333333333333333333333333333333333333333333333333333333333333333',
};

/** A valid npx record with a query-string-bearing source URI. @public */
export const validNpxRecordWithQuery: NpxSkillRecord = {
  key: 'query-skill',
  name: 'Query Skill',
  sourceUri:
    'https://registry.example.com/skills/query-skill/SKILL.md?version=2&format=raw',
  digest:
    'sha256:4444444444444444444444444444444444444444444444444444444444444444',
  extensions: {
    npx: {
      type: 'skill-md',
    },
  },
};

// ─── Valid snapshots ──────────────────────────────────────────────────

/** A valid ready OCI snapshot. @public */
export const validOciSnapshotReady: SkillSnapshot = {
  schemaVersion: '1',
  source: ociSource,
  status: 'ready',
  observedAt: '2026-09-01T12:00:00Z',
  skills: [validOciRecordMinimal, validOciRecordFull],
  failedSkillKeys: [],
};

/** A valid ready npx snapshot. @public */
export const validNpxSnapshotReady: SkillSnapshot = {
  schemaVersion: '1',
  source: npxSource,
  status: 'ready',
  observedAt: '2026-09-01T12:00:00Z',
  skills: [validNpxRecordMinimal, validNpxRecordFull],
  failedSkillKeys: [],
};

/** A valid loading snapshot. @public */
export const validLoadingSnapshot: SkillSnapshot = {
  schemaVersion: '1',
  source: ociSource,
  status: 'loading',
  observedAt: null,
  skills: [],
  failedSkillKeys: [],
};

/** A valid partial snapshot with failed keys. @public */
export const validPartialSnapshot: SkillSnapshot = {
  schemaVersion: '1',
  source: ociSource,
  status: 'partial',
  observedAt: '2026-09-01T12:05:00Z',
  skills: [validOciRecordMinimal],
  failedSkillKeys: ['quay.io/octo/broken-skill'],
};

/** A valid failed snapshot. @public */
export const validFailedSnapshot: SkillSnapshot = {
  schemaVersion: '1',
  source: ociSource,
  status: 'failed',
  observedAt: '2026-09-01T12:10:00Z',
  skills: [],
  failedSkillKeys: [],
};

/** A valid partial snapshot with no records and no failed keys. @public */
export const validPartialEmptySnapshot: SkillSnapshot = {
  schemaVersion: '1',
  source: npxSource,
  status: 'partial',
  observedAt: '2026-09-01T12:15:00Z',
  skills: [],
  failedSkillKeys: [],
};

/** A valid ready snapshot with zero records (successful empty discovery). @public */
export const validReadyEmptySnapshot: SkillSnapshot = {
  schemaVersion: '1',
  source: ociSource,
  status: 'ready',
  observedAt: '2026-09-01T12:20:00Z',
  skills: [],
  failedSkillKeys: [],
};

// ─── Invalid records ──────────────────────────────────────────────────

/** Record with empty key. @public */
export const invalidRecordEmptyKey: OciSkillRecord = {
  key: '',
  name: 'Bad Skill',
  sourceUri:
    'oci://quay.io/octo/bad@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  digest:
    'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
};

/** Record with malformed digest (uppercase). @public */
export const invalidRecordBadDigest: OciSkillRecord = {
  key: 'quay.io/octo/bad-digest',
  name: 'Bad Digest Skill',
  sourceUri:
    'oci://quay.io/octo/bad-digest@sha256:ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789',
  digest:
    'sha256:ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789',
};

/** Record with truncated digest. @public */
export const invalidRecordShortDigest: OciSkillRecord = {
  key: 'quay.io/octo/short-digest',
  name: 'Short Digest Skill',
  sourceUri: 'oci://quay.io/octo/short-digest@sha256:abcdef',
  digest: 'sha256:abcdef',
};

/** npx record with OCI extension (source mismatch). @public */
export const invalidNpxRecordWithOciExtension: NpxSkillRecord = {
  key: 'mismatched-skill',
  name: 'Mismatched Skill',
  sourceUri: 'https://registry.example.com/skills/mismatch/SKILL.md',
  digest:
    'sha256:5555555555555555555555555555555555555555555555555555555555555555',
  extensions: { oci: { namespace: 'bad' } } as unknown as {
    npx?: { type?: 'skill-md' };
  },
};

/** OCI record with npx extension (source mismatch). @public */
export const invalidOciRecordWithNpxExtension: OciSkillRecord = {
  key: 'quay.io/octo/npx-ext-mismatch',
  name: 'Mismatch Skill',
  sourceUri:
    'oci://quay.io/octo/mismatch@sha256:6666666666666666666666666666666666666666666666666666666666666666',
  digest:
    'sha256:6666666666666666666666666666666666666666666666666666666666666666',
  extensions: { npx: { type: 'skill-md' } } as unknown as {
    oci?: { namespace?: string; prompt?: string };
  },
};

/** OCI record with unknown extension key. @public */
export const invalidOciRecordUnknownExtKey: OciSkillRecord = {
  key: 'quay.io/octo/unknown-ext',
  name: 'Unknown Ext Skill',
  sourceUri:
    'oci://quay.io/octo/unknown-ext@sha256:7777777777777777777777777777777777777777777777777777777777777777',
  digest:
    'sha256:7777777777777777777777777777777777777777777777777777777777777777',
  extensions: {
    oci: { namespace: 'ok', secretKey: 'bad' } as unknown as {
      namespace?: string;
      prompt?: string;
    },
  },
};

// ─── Invalid snapshots ────────────────────────────────────────────────

/** Snapshot with unsupported schema version. @public */
export const invalidSnapshotBadVersion: unknown = {
  schemaVersion: '2',
  source: ociSource,
  status: 'ready',
  observedAt: '2026-09-01T12:00:00Z',
  skills: [],
  failedSkillKeys: [],
};

/** Snapshot claiming ready with failed keys. @public */
export const invalidSnapshotReadyWithFailedKeys: unknown = {
  schemaVersion: '1',
  source: ociSource,
  status: 'ready',
  observedAt: '2026-09-01T12:00:00Z',
  skills: [validOciRecordMinimal],
  failedSkillKeys: ['quay.io/octo/failed-one'],
};

/** Snapshot with duplicate skill keys. @public */
export const invalidSnapshotDuplicateKeys: unknown = {
  schemaVersion: '1',
  source: ociSource,
  status: 'ready',
  observedAt: '2026-09-01T12:00:00Z',
  skills: [validOciRecordMinimal, { ...validOciRecordMinimal }],
  failedSkillKeys: [],
};

/** Snapshot with overlapping skill and failed keys. @public */
export const invalidSnapshotOverlappingKeys: unknown = {
  schemaVersion: '1',
  source: ociSource,
  status: 'partial',
  observedAt: '2026-09-01T12:00:00Z',
  skills: [validOciRecordMinimal],
  failedSkillKeys: [validOciRecordMinimal.key],
};

/** Loading snapshot with non-null observedAt. @public */
export const invalidLoadingWithObservedAt: unknown = {
  schemaVersion: '1',
  source: ociSource,
  status: 'loading',
  observedAt: '2026-09-01T12:00:00Z',
  skills: [],
  failedSkillKeys: [],
};

/** Loading snapshot with skills. @public */
export const invalidLoadingWithSkills: unknown = {
  schemaVersion: '1',
  source: ociSource,
  status: 'loading',
  observedAt: null,
  skills: [validOciRecordMinimal],
  failedSkillKeys: [],
};

/** Failed snapshot with skills. @public */
export const invalidFailedWithSkills: unknown = {
  schemaVersion: '1',
  source: ociSource,
  status: 'failed',
  observedAt: '2026-09-01T12:00:00Z',
  skills: [validOciRecordMinimal],
  failedSkillKeys: [],
};

/** Snapshot with non-UTC timestamp. @public */
export const invalidSnapshotNonUtcTimestamp: unknown = {
  schemaVersion: '1',
  source: ociSource,
  status: 'ready',
  observedAt: '2026-09-01T12:00:00-05:00',
  skills: [],
  failedSkillKeys: [],
};
