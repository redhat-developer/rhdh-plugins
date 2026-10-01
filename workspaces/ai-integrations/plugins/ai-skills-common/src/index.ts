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
 * Shared v1 skill record and snapshot contract for skill connectors
 * and the common catalog provider.
 *
 * This library owns schemas, validation, and pure helpers. It performs
 * no network, scheduler, database, or catalog operations.
 *
 * @packageDocumentation
 */

export type {
  NpxExtensions,
  NpxSkillRecord,
  OciExtensions,
  OciSkillRecord,
  SkillAuthor,
  SkillRecord,
  SkillSnapshot,
  SkillSnapshotV1,
  SkillSourceType,
  SnapshotSource,
  SnapshotStatus,
} from './types';

export type { ValidationResult } from './validation';

export {
  isNpxSkillRecord,
  isOciSkillRecord,
  isValidDigest,
  isValidUtcTimestamp,
  MAX_SNAPSHOT_BYTES,
  MAX_SNAPSHOT_RECORDS,
  SUPPORTED_SCHEMA_VERSION,
  validateSnapshot,
  validateSnapshotSize,
} from './validation';

export type { BoundSnapshotOptions } from './snapshot';

export {
  boundSnapshot,
  createFailedSnapshot,
  createLoadingSnapshot,
  sortRecordsByKey,
} from './snapshot';

export { MAX_RESPONSE_BYTES, SKILLS_ENDPOINT_BASE } from './rest-contract';

export type {
  NormalizationDiagnostic,
  NormalizationResult,
  NpxDiscoveryEntry,
  NpxFrontmatter,
  NpxNativeInput,
  OciMarkdownFrontmatter,
  OciNativeInput,
  OciSkillCard,
  OciSkillCardMetadata,
  OciSkillCardSpec,
  TrustedSourceInput,
} from './normalizer';

export { normalizeNpxMetadata, normalizeOciMetadata } from './normalizer';

export {
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
  npxDiscoveryEntryFull,
  npxDiscoveryEntryMinimal,
  npxFrontmatterConflictingVersion,
  npxFrontmatterFull,
  npxNativeInputConflictingVersion,
  npxNativeInputFull,
  npxNativeInputMinimal,
  npxSource,
  npxTrustedInput,
  ociMarkdownFrontmatterConflictingVersion,
  ociMarkdownFrontmatterFull,
  ociNativeInputConflictingVersion,
  ociNativeInputFull,
  ociNativeInputMinimal,
  ociSkillCardConflictingVersion,
  ociSkillCardFull,
  ociSkillCardMinimal,
  ociSource,
  ociTrustedInput,
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
