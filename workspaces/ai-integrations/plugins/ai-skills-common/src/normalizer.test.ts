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
  npxNativeInputConflictingVersion,
  npxNativeInputFull,
  npxNativeInputMinimal,
  npxSource,
  npxTrustedInput,
  ociNativeInputConflictingVersion,
  ociNativeInputFull,
  ociNativeInputMinimal,
  ociSource,
  ociTrustedInput,
} from './fixtures';
import { normalizeNpxMetadata, normalizeOciMetadata } from './normalizer';
import type {
  NpxNativeInput,
  OciNativeInput,
  TrustedSourceInput,
} from './normalizer';
import type { SkillSnapshot } from './types';
import { validateSnapshot } from './validation';

// Helper: wrap a record in a snapshot to validate with the shared validator
function wrapOciSnapshot(record: unknown): SkillSnapshot {
  return {
    schemaVersion: '1',
    source: ociSource,
    status: 'ready',
    observedAt: '2026-10-01T12:00:00Z',
    skills: [record as SkillSnapshot['skills'][number]],
    failedSkillKeys: [],
  };
}

function wrapNpxSnapshot(record: unknown): SkillSnapshot {
  return {
    schemaVersion: '1',
    source: npxSource,
    status: 'ready',
    observedAt: '2026-10-01T12:00:00Z',
    skills: [record as SkillSnapshot['skills'][number]],
    failedSkillKeys: [],
  };
}

describe('normalizeOciMetadata', () => {
  describe('D3 precedence — name', () => {
    it('selects metadata.display-name over metadata.name and frontmatter name', () => {
      const result = normalizeOciMetadata(ociNativeInputFull, ociTrustedInput);
      expect(result.record).not.toBeNull();
      // ociSkillCardFull.metadata.display-name = 'Hello World Skill'
      expect(result.record!.name).toBe('Hello World Skill');
    });

    it('falls back to metadata.name when display-name is absent', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: { name: 'Fallback Name' },
        },
        frontmatter: { name: 'Frontmatter Name' },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.name).toBe('Fallback Name');
    });

    it('falls back to frontmatter name when SkillCard names are absent', () => {
      const native: OciNativeInput = {
        skillCard: { metadata: {} },
        frontmatter: { name: 'Frontmatter Name' },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.name).toBe('Frontmatter Name');
    });

    it('returns null when no name is available', () => {
      const native: OciNativeInput = {
        skillCard: { metadata: {} },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record).toBeNull();
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({ field: 'name' }),
      );
    });
  });

  describe('D3 precedence — version (conflicting versions)', () => {
    it('selects SkillCard metadata.version over frontmatter versions', () => {
      const result = normalizeOciMetadata(
        ociNativeInputConflictingVersion,
        ociTrustedInput,
      );
      expect(result.record).not.toBeNull();
      // ociSkillCardConflictingVersion.metadata.version = '1.0.0'
      // frontmatter metadata.version = '1.0', frontmatter version = '0.9.0'
      expect(result.record!.version).toBe('1.0.0');
    });

    it('falls back to frontmatter metadata.version when SkillCard version is absent', () => {
      const native: OciNativeInput = {
        skillCard: { metadata: { name: 'Test' } },
        frontmatter: {
          metadata: { version: '1.0' },
          version: '0.9.0',
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.version).toBe('1.0');
    });

    it('falls back to frontmatter version when both higher-priority versions are absent', () => {
      const native: OciNativeInput = {
        skillCard: { metadata: { name: 'Test' } },
        frontmatter: { version: '0.9.0' },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.version).toBe('0.9.0');
    });

    it('retains invalid first-choice version for D5 fallback instead of selecting lower-priority', () => {
      // An "invalid" version (not valid SemVer) is still retained as a string
      // because the normalizer selects the first non-empty correctly typed
      // value. D5 fallback happens at the catalog provider level.
      const native: OciNativeInput = {
        skillCard: { metadata: { name: 'Test', version: 'not-semver' } },
        frontmatter: { metadata: { version: '1.0.0' } },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.version).toBe('not-semver');
    });
  });

  describe('full metadata normalization', () => {
    it('normalizes all fields from full OCI native input', () => {
      const result = normalizeOciMetadata(ociNativeInputFull, ociTrustedInput);
      expect(result.record).not.toBeNull();
      const r = result.record!;

      // Trusted fields
      expect(r.key).toBe(ociTrustedInput.key);
      expect(r.sourceUri).toBe(ociTrustedInput.sourceUri);
      expect(r.digest).toBe(ociTrustedInput.digest);

      // D3 precedence: SkillCard wins for most fields
      expect(r.name).toBe('Hello World Skill');
      expect(r.description).toBe('A demo OCI skill image');
      expect(r.version).toBe('1.0.0');
      expect(r.license).toBe('Apache-2.0');
      expect(r.compatibility).toBe('rhdh-2.2');

      // Authors from SkillCard
      expect(r.authors).toEqual([
        { name: 'OCTO Team', email: 'octo@example.com' },
      ]);

      // Tags from SkillCard, normalized (lowercased)
      expect(r.tags).toEqual(['demo', 'hello-world']);

      // Owner and lifecycle from frontmatter only
      expect(r.owner).toBe('team-octo');
      expect(r.lifecycle).toBe('production');

      // Extensions
      expect(r.extensions).toEqual({
        oci: {
          namespace: 'octo-skills',
          prompt: 'You are a helpful assistant.',
        },
      });
    });

    it('produces a record that passes the shared snapshot validator', () => {
      const result = normalizeOciMetadata(ociNativeInputFull, ociTrustedInput);
      expect(result.record).not.toBeNull();
      const snapshot = wrapOciSnapshot(result.record);
      const validation = validateSnapshot(snapshot);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
  });

  describe('missing optional metadata', () => {
    it('produces a valid record with only required fields', () => {
      const result = normalizeOciMetadata(
        ociNativeInputMinimal,
        ociTrustedInput,
      );
      expect(result.record).not.toBeNull();
      const r = result.record!;

      expect(r.key).toBe(ociTrustedInput.key);
      expect(r.name).toBe('Minimal Skill');
      expect(r.sourceUri).toBe(ociTrustedInput.sourceUri);
      expect(r.digest).toBe(ociTrustedInput.digest);

      // Optional fields omitted
      expect(r.description).toBeUndefined();
      expect(r.version).toBeUndefined();
      expect(r.license).toBeUndefined();
      expect(r.authors).toBeUndefined();
      expect(r.tags).toBeUndefined();
      expect(r.compatibility).toBeUndefined();
      expect(r.owner).toBeUndefined();
      expect(r.lifecycle).toBeUndefined();
      expect(r.extensions).toBeUndefined();
    });

    it('minimal record passes the shared snapshot validator', () => {
      const result = normalizeOciMetadata(
        ociNativeInputMinimal,
        ociTrustedInput,
      );
      expect(result.record).not.toBeNull();
      const snapshot = wrapOciSnapshot(result.record);
      expect(validateSnapshot(snapshot).valid).toBe(true);
    });
  });

  describe('extension allowlisting', () => {
    it('preserves only namespace and prompt in extensions.oci', () => {
      const result = normalizeOciMetadata(ociNativeInputFull, ociTrustedInput);
      expect(result.record).not.toBeNull();
      expect(result.record!.extensions).toEqual({
        oci: {
          namespace: 'octo-skills',
          prompt: 'You are a helpful assistant.',
        },
      });
    });

    it('omits extensions when namespace and prompt are absent', () => {
      const native: OciNativeInput = {
        skillCard: { metadata: { name: 'No Ext' } },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.extensions).toBeUndefined();
    });

    it('SkillCard namespace stays in extensions, never overrides catalog namespace', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: { name: 'Test', namespace: 'custom-ns' },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.extensions).toEqual({
        oci: { namespace: 'custom-ns' },
      });
      // No catalog namespace field exists on SkillRecord
    });
  });

  describe('author normalization', () => {
    it('accepts SkillCard authors array with name and email', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: {
            name: 'Test',
            authors: [{ name: 'Alice', email: 'alice@example.com' }],
          },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.authors).toEqual([
        { name: 'Alice', email: 'alice@example.com' },
      ]);
    });

    it('normalizes frontmatter author string to author object', () => {
      const native: OciNativeInput = {
        skillCard: { metadata: { name: 'Test' } },
        frontmatter: {
          metadata: { author: 'John Doe' },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.authors).toEqual([{ name: 'John Doe' }]);
    });

    it('authors never imply catalog ownership', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: {
            name: 'Test',
            authors: [{ name: 'Owner Team' }],
          },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      // Authors are set but owner is not inferred
      expect(result.record!.authors).toEqual([{ name: 'Owner Team' }]);
      expect(result.record!.owner).toBeUndefined();
    });

    it('omits invalid author entries with diagnostics', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: {
            name: 'Test',
            authors: [{ name: 'Valid Author' }, { name: '' }, 'not-an-object'],
          },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.authors).toEqual([{ name: 'Valid Author' }]);
      expect(
        result.diagnostics.filter(d => d.field === 'authors'),
      ).toHaveLength(2);
    });

    it('falls back to frontmatter author when all SkillCard authors are invalid', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: {
            name: 'Test',
            authors: [{ name: '' }],
          },
        },
        frontmatter: {
          metadata: { author: 'Fallback Author' },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.authors).toEqual([{ name: 'Fallback Author' }]);
    });
  });

  describe('tag normalization', () => {
    it('trims and lowercases tags', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: {
            name: 'Test',
            tags: ['  Demo  ', 'HELLO-World'],
          },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.tags).toEqual(['demo', 'hello-world']);
    });

    it('accepts dots, underscores, and consecutive hyphens in catalog tags', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: {
            name: 'Test',
            tags: ['rhdh:2.2', 'has_underscore', 'in--valid'],
          },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.tags).toEqual([
        'rhdh:2.2',
        'has_underscore',
        'in--valid',
      ]);
      expect(result.diagnostics).toHaveLength(0);
    });

    it('deduplicates tags after normalization', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: {
            name: 'Test',
            tags: ['demo', 'Demo', 'DEMO'],
          },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.tags).toEqual(['demo']);
    });

    it('omits invalid tags with diagnostics', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: {
            name: 'Test',
            tags: ['valid-tag', 'INVALID TAG WITH SPACES', 'ok'],
          },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.tags).toEqual(['valid-tag', 'ok']);
      expect(
        result.diagnostics.some(
          d => d.field === 'tags' && d.message.includes('invalid tag'),
        ),
      ).toBe(true);
    });

    it('reports whitespace-only tags as empty after trimming', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: { name: 'Test', tags: ['   '] },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.tags).toBeUndefined();
      expect(result.diagnostics).toEqual([
        { field: 'tags', message: 'tags[0]: empty after trim, omitted' },
      ]);
    });

    it('omits overlength tags with diagnostics', () => {
      const longTag = 'a'.repeat(64);
      const native: OciNativeInput = {
        skillCard: {
          metadata: {
            name: 'Test',
            tags: ['valid', longTag],
          },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.tags).toEqual(['valid']);
      expect(
        result.diagnostics.some(
          d => d.field === 'tags' && d.message.includes('overlength'),
        ),
      ).toBe(true);
    });

    it('omits non-string tag values with diagnostics', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: {
            name: 'Test',
            tags: ['valid', 42, true],
          },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.tags).toEqual(['valid']);
      expect(
        result.diagnostics.filter(
          d => d.field === 'tags' && d.message.includes('non-string'),
        ),
      ).toHaveLength(2);
    });

    it('falls back from SkillCard metadata.tags to frontmatter metadata.tags', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: { name: 'Test' },
        },
        frontmatter: {
          metadata: { tags: ['frontmatter-tag'] },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.tags).toEqual(['frontmatter-tag']);
    });

    it('emits diagnostic for non-array tag candidate', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: {
            name: 'Test',
            tags: 'single-tag' as unknown,
          },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.tags).toBeUndefined();
      expect(
        result.diagnostics.some(
          d =>
            d.field === 'tags' &&
            d.message.includes("unsupported type 'string'"),
        ),
      ).toBe(true);
    });
  });

  describe('invalid optional values yield diagnostics', () => {
    it('omits non-string description with diagnostic', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: { name: 'Test', description: 42 },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record).not.toBeNull();
      expect(result.record!.description).toBeUndefined();
      expect(result.diagnostics.some(d => d.field === 'description')).toBe(
        true,
      );
    });

    it('omits non-string version with diagnostic', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: { name: 'Test', version: 123 },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.version).toBeUndefined();
      expect(result.diagnostics.some(d => d.field === 'version')).toBe(true);
    });

    it('emits diagnostic for non-string higher-priority candidate even when lower-priority provides valid string', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: { name: 'Test', description: 42 },
        },
        frontmatter: {
          description: 'valid fallback description',
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record).not.toBeNull();
      // The valid lower-priority string is selected
      expect(result.record!.description).toBe('valid fallback description');
      // A diagnostic is still emitted for the non-string higher-priority candidate
      expect(
        result.diagnostics.some(
          d =>
            d.field === 'description' &&
            d.message.includes("unsupported type 'number'"),
        ),
      ).toBe(true);
    });

    it('emits diagnostic for non-string owner', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: { name: 'Test' },
        },
        frontmatter: {
          metadata: { owner: 42 as unknown },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record).not.toBeNull();
      expect(result.record!.owner).toBeUndefined();
      expect(
        result.diagnostics.some(
          d =>
            d.field === 'owner' &&
            d.message.includes("unsupported type 'number'"),
        ),
      ).toBe(true);
    });

    it('emits diagnostic for non-string lifecycle', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: { name: 'Test' },
        },
        frontmatter: {
          metadata: { lifecycle: ['production'] as unknown },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record).not.toBeNull();
      expect(result.record!.lifecycle).toBeUndefined();
      expect(
        result.diagnostics.some(
          d =>
            d.field === 'lifecycle' &&
            d.message.includes("unsupported type 'object'"),
        ),
      ).toBe(true);
    });

    it('malformed optional values do not make otherwise valid records fail', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: {
            name: 'Valid Name',
            description: { nested: true },
            version: [1, 0, 0],
            license: false,
            compatibility: 42,
            authors: 'not-an-array-or-string-object',
          },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record).not.toBeNull();
      expect(result.record!.name).toBe('Valid Name');
      expect(result.diagnostics.length).toBeGreaterThan(0);
    });
  });

  describe('scalar string trimming', () => {
    it('trims whitespace from scalar string fields', () => {
      const native: OciNativeInput = {
        skillCard: {
          metadata: {
            'display-name': '  Trimmed Name  ',
            description: '  Trimmed description  ',
            version: '  1.0.0  ',
            license: '  MIT  ',
            compatibility: '  rhdh-2.2  ',
            namespace: '  ns  ',
          },
          spec: { prompt: '  prompt  ' },
        },
        frontmatter: {
          metadata: {
            owner: '  owner  ',
            lifecycle: '  production  ',
          },
        },
      };
      const result = normalizeOciMetadata(native, ociTrustedInput);
      expect(result.record!.name).toBe('Trimmed Name');
      expect(result.record!.description).toBe('Trimmed description');
      expect(result.record!.version).toBe('1.0.0');
      expect(result.record!.license).toBe('MIT');
      expect(result.record!.compatibility).toBe('rhdh-2.2');
      expect(result.record!.owner).toBe('owner');
      expect(result.record!.lifecycle).toBe('production');
      expect(result.record!.extensions!.oci!.namespace).toBe('ns');
      expect(result.record!.extensions!.oci!.prompt).toBe('prompt');
    });
  });
});

describe('normalizeNpxMetadata', () => {
  describe('D3 precedence — name', () => {
    it('selects frontmatter name over discovery entry name', () => {
      const result = normalizeNpxMetadata(npxNativeInputFull, npxTrustedInput);
      expect(result.record).not.toBeNull();
      // npxFrontmatterFull.name = 'Summarize Text'
      expect(result.record!.name).toBe('Summarize Text');
    });

    it('falls back to discovery entry name when frontmatter name is absent', () => {
      const native: NpxNativeInput = {
        entry: { name: 'entry-name' },
        frontmatter: {},
      };
      const result = normalizeNpxMetadata(native, npxTrustedInput);
      expect(result.record!.name).toBe('entry-name');
    });

    it('returns null when no name is available', () => {
      const native: NpxNativeInput = {
        entry: {},
        frontmatter: {},
      };
      const result = normalizeNpxMetadata(native, npxTrustedInput);
      expect(result.record).toBeNull();
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({ field: 'name' }),
      );
    });
  });

  describe('D3 precedence — version (conflicting versions)', () => {
    it('selects frontmatter metadata.version over frontmatter version', () => {
      const result = normalizeNpxMetadata(
        npxNativeInputConflictingVersion,
        npxTrustedInput,
      );
      expect(result.record).not.toBeNull();
      // npxFrontmatterConflictingVersion.metadata.version = '2.0.0'
      // npxFrontmatterConflictingVersion.version = '1.5.0'
      expect(result.record!.version).toBe('2.0.0');
    });

    it('falls back to frontmatter version when metadata.version is absent', () => {
      const native: NpxNativeInput = {
        entry: { name: 'test' },
        frontmatter: { version: '1.5.0' },
      };
      const result = normalizeNpxMetadata(native, npxTrustedInput);
      expect(result.record!.version).toBe('1.5.0');
    });
  });

  describe('full metadata normalization', () => {
    it('normalizes all fields from full npx native input', () => {
      const result = normalizeNpxMetadata(npxNativeInputFull, npxTrustedInput);
      expect(result.record).not.toBeNull();
      const r = result.record!;

      // Trusted fields
      expect(r.key).toBe(npxTrustedInput.key);
      expect(r.sourceUri).toBe(npxTrustedInput.sourceUri);
      expect(r.digest).toBe(npxTrustedInput.digest);

      // D3 precedence: frontmatter wins for name/description
      expect(r.name).toBe('Summarize Text');
      expect(r.description).toBe('A skill for summarizing text content');
      expect(r.version).toBe('0.2.0');
      expect(r.license).toBe('MIT');
      expect(r.compatibility).toBe('agent-skills-v0.2');

      // Authors from frontmatter (string normalized to object)
      expect(r.authors).toEqual([{ name: 'Agent Team' }]);

      // Tags from frontmatter
      expect(r.tags).toEqual(['summarization', 'text']);

      // Owner and lifecycle
      expect(r.owner).toBe('team-agents');
      expect(r.lifecycle).toBe('experimental');

      // npx extension
      expect(r.extensions).toEqual({
        npx: { type: 'skill-md' },
      });
    });

    it('produces a record that passes the shared snapshot validator', () => {
      const result = normalizeNpxMetadata(npxNativeInputFull, npxTrustedInput);
      expect(result.record).not.toBeNull();
      const snapshot = wrapNpxSnapshot(result.record);
      const validation = validateSnapshot(snapshot);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
  });

  describe('missing optional metadata', () => {
    it('produces a valid record with only required fields', () => {
      const trusted: TrustedSourceInput = {
        key: 'basic-skill',
        sourceUri: 'https://registry.example.com/skills/basic-skill/SKILL.md',
        digest:
          'sha256:3333333333333333333333333333333333333333333333333333333333333333',
      };
      const result = normalizeNpxMetadata(npxNativeInputMinimal, trusted);
      expect(result.record).not.toBeNull();
      const r = result.record!;

      expect(r.name).toBe('basic-skill');
      expect(r.description).toBeUndefined();
      expect(r.version).toBeUndefined();
      expect(r.license).toBeUndefined();
      expect(r.authors).toBeUndefined();
      expect(r.tags).toBeUndefined();
      expect(r.compatibility).toBeUndefined();
      expect(r.owner).toBeUndefined();
      expect(r.lifecycle).toBeUndefined();
      expect(r.extensions).toBeUndefined();
    });

    it('minimal record passes the shared snapshot validator', () => {
      const trusted: TrustedSourceInput = {
        key: 'basic-skill',
        sourceUri: 'https://registry.example.com/skills/basic-skill/SKILL.md',
        digest:
          'sha256:3333333333333333333333333333333333333333333333333333333333333333',
      };
      const result = normalizeNpxMetadata(npxNativeInputMinimal, trusted);
      expect(result.record).not.toBeNull();
      const snapshot = wrapNpxSnapshot(result.record);
      expect(validateSnapshot(snapshot).valid).toBe(true);
    });
  });

  describe('extension allowlisting', () => {
    it('preserves npx.type when entry type is skill-md', () => {
      const native: NpxNativeInput = {
        entry: { name: 'test', type: 'skill-md' },
      };
      const result = normalizeNpxMetadata(native, npxTrustedInput);
      expect(result.record!.extensions).toEqual({
        npx: { type: 'skill-md' },
      });
    });

    it('omits extensions when entry type is absent', () => {
      const native: NpxNativeInput = {
        entry: { name: 'test' },
      };
      const result = normalizeNpxMetadata(native, npxTrustedInput);
      expect(result.record!.extensions).toBeUndefined();
    });

    it('omits unsupported entry type with diagnostic', () => {
      const native: NpxNativeInput = {
        entry: { name: 'test', type: 'unknown-format' },
      };
      const result = normalizeNpxMetadata(native, npxTrustedInput);
      expect(result.record!.extensions).toBeUndefined();
      expect(
        result.diagnostics.some(d => d.field === 'extensions.npx.type'),
      ).toBe(true);
    });
  });

  describe('invalid optional values yield diagnostics', () => {
    it('emits diagnostic for non-string owner in npx', () => {
      const native: NpxNativeInput = {
        entry: { name: 'test' },
        frontmatter: {
          metadata: { owner: true as unknown },
        },
      };
      const result = normalizeNpxMetadata(native, npxTrustedInput);
      expect(result.record).not.toBeNull();
      expect(result.record!.owner).toBeUndefined();
      expect(
        result.diagnostics.some(
          d =>
            d.field === 'owner' &&
            d.message.includes("unsupported type 'boolean'"),
        ),
      ).toBe(true);
    });

    it('emits diagnostic for non-string lifecycle in npx', () => {
      const native: NpxNativeInput = {
        entry: { name: 'test' },
        frontmatter: {
          metadata: { lifecycle: { phase: 'production' } as unknown },
        },
      };
      const result = normalizeNpxMetadata(native, npxTrustedInput);
      expect(result.record).not.toBeNull();
      expect(result.record!.lifecycle).toBeUndefined();
      expect(
        result.diagnostics.some(
          d =>
            d.field === 'lifecycle' &&
            d.message.includes("unsupported type 'object'"),
        ),
      ).toBe(true);
    });
  });

  describe('author/namespace isolation', () => {
    it('authors never become owner in npx records', () => {
      const native: NpxNativeInput = {
        entry: { name: 'test' },
        frontmatter: {
          metadata: { author: 'Some Author' },
        },
      };
      const result = normalizeNpxMetadata(native, npxTrustedInput);
      expect(result.record!.authors).toEqual([{ name: 'Some Author' }]);
      expect(result.record!.owner).toBeUndefined();
    });
  });
});

describe('cross-source consistency', () => {
  it('both OCI and npx full records pass snapshot validation', () => {
    const ociResult = normalizeOciMetadata(ociNativeInputFull, ociTrustedInput);
    const npxResult = normalizeNpxMetadata(npxNativeInputFull, npxTrustedInput);

    expect(ociResult.record).not.toBeNull();
    expect(npxResult.record).not.toBeNull();

    const ociSnapshot = wrapOciSnapshot(ociResult.record);
    const npxSnapshot = wrapNpxSnapshot(npxResult.record);

    expect(validateSnapshot(ociSnapshot).valid).toBe(true);
    expect(validateSnapshot(npxSnapshot).valid).toBe(true);
  });

  it('conflicting-version fixtures produce valid records for both sources', () => {
    const ociResult = normalizeOciMetadata(
      ociNativeInputConflictingVersion,
      ociTrustedInput,
    );
    const npxResult = normalizeNpxMetadata(
      npxNativeInputConflictingVersion,
      npxTrustedInput,
    );

    expect(ociResult.record).not.toBeNull();
    expect(npxResult.record).not.toBeNull();

    const ociSnapshot = wrapOciSnapshot(ociResult.record);
    const npxSnapshot = wrapNpxSnapshot(npxResult.record);

    expect(validateSnapshot(ociSnapshot).valid).toBe(true);
    expect(validateSnapshot(npxSnapshot).valid).toBe(true);
  });
});
