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

import { ociTrustedInput } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type { AcquisitionMetadata, SkillImageExtraction } from './types';
import {
  parseSkillCardYaml,
  parseMarkdownFrontmatter,
  normalizeSkillImageExtraction,
} from './normalizeExtraction';

// ─── Fixtures ──────────────────────────────────────────────────────

const testAcquisition: AcquisitionMetadata = {
  key: ociTrustedInput.key,
  digest: ociTrustedInput.digest,
  sourceUri: ociTrustedInput.sourceUri,
};

function makeExtraction(
  overrides: Partial<SkillImageExtraction> = {},
): SkillImageExtraction {
  return {
    skillImageYamlPath: '/tmp/skill-image-xx/skillimage.yaml',
    skillsMdPath: '/tmp/skill-image-xx/SKILLS.md',
    skillImageYaml: `metadata:
  display-name: Hello World Skill
  name: hello-world-skill
  description: A demo OCI skill image
  version: "1.0.0"
  license: Apache-2.0
  authors:
    - name: OCTO Team
      email: octo@example.com
  tags:
    - Demo
    - hello-world
  compatibility: rhdh-2.2
  namespace: octo-skills
spec:
  prompt: You are a helpful assistant.`,
    skillsMd: `---
name: Hello World (Markdown)
description: A demo OCI skill from Markdown
version: "0.9.0"
license: MIT
compatibility: rhdh-2.1
metadata:
  version: "1.0"
  author: Markdown Author
  tags:
    - markdown-tag
  owner: team-octo
  lifecycle: production
---

# Hello World Skill

This is a demo skill.`,
    acquisition: testAcquisition,
    ...overrides,
  };
}

// ─── parseSkillCardYaml ────────────────────────────────────────────

describe('parseSkillCardYaml', () => {
  it('parses a valid SkillCard YAML document', () => {
    const raw = `metadata:
  display-name: Test Skill
  name: test-skill
  version: "1.0.0"
spec:
  prompt: Hello`;
    const result = parseSkillCardYaml(raw);
    expect(result).toBeDefined();
    expect(result!.metadata?.['display-name']).toBe('Test Skill');
    expect(result!.metadata?.name).toBe('test-skill');
    expect(result!.metadata?.version).toBe('1.0.0');
    expect(result!.spec?.prompt).toBe('Hello');
  });

  it('parses a minimal SkillCard with only metadata.name', () => {
    const raw = 'metadata:\n  name: Minimal Skill';
    const result = parseSkillCardYaml(raw);
    expect(result).toBeDefined();
    expect(result!.metadata?.name).toBe('Minimal Skill');
  });

  it('returns undefined for invalid YAML', () => {
    const raw = ':\n  - valid\n bad indent';
    expect(parseSkillCardYaml(raw)).toBeUndefined();
  });

  it('returns undefined for a YAML scalar', () => {
    expect(parseSkillCardYaml('just a string')).toBeUndefined();
  });

  it('returns undefined for null YAML document', () => {
    expect(parseSkillCardYaml('')).toBeUndefined();
  });

  it('returns undefined for an array YAML document', () => {
    expect(parseSkillCardYaml('- item1\n- item2')).toBeUndefined();
  });
});

// ─── parseMarkdownFrontmatter ──────────────────────────────────────

describe('parseMarkdownFrontmatter', () => {
  it('parses valid YAML frontmatter', () => {
    const raw = `---
name: Test Skill
version: "1.0.0"
metadata:
  owner: team-test
---

# Test Skill

Content here.`;
    const result = parseMarkdownFrontmatter(raw);
    expect(result).toBeDefined();
    expect(result!.name).toBe('Test Skill');
    expect(result!.version).toBe('1.0.0');
    expect(result!.metadata?.owner).toBe('team-test');
  });

  it('returns undefined when no frontmatter exists', () => {
    const raw = '# Just a Markdown file\n\nNo frontmatter here.';
    expect(parseMarkdownFrontmatter(raw)).toBeUndefined();
  });

  it('throws when closing delimiter is missing', () => {
    const raw = '---\nname: test\n# No closing delimiter';
    expect(() => parseMarkdownFrontmatter(raw)).toThrow();
  });

  it('throws for invalid YAML within frontmatter', () => {
    const raw = '---\n:\n  - valid\n bad indent\n---\n\nContent.';
    expect(() => parseMarkdownFrontmatter(raw)).toThrow();
  });

  it('throws for scalar YAML frontmatter', () => {
    const raw = '---\njust a string\n---\n\nContent.';
    expect(() => parseMarkdownFrontmatter(raw)).toThrow();
  });

  it('handles leading whitespace before frontmatter', () => {
    const raw = '  ---\nname: Test\n---\n\nContent.';
    const result = parseMarkdownFrontmatter(raw);
    expect(result).toBeDefined();
    expect(result!.name).toBe('Test');
  });

  it('handles empty frontmatter', () => {
    const raw = '---\n\n---\n\nContent.';
    expect(parseMarkdownFrontmatter(raw)).toEqual({});
  });

  it('parses frontmatter with all supported fields', () => {
    const raw = `---
name: Full Skill
description: A test skill
version: "2.0.0"
license: MIT
compatibility: rhdh-2.2
metadata:
  version: "2.0.0"
  author: Author Name
  tags:
    - test
    - demo
  owner: team-test
  lifecycle: production
---

# Full Skill`;
    const result = parseMarkdownFrontmatter(raw);
    expect(result).toBeDefined();
    expect(result!.name).toBe('Full Skill');
    expect(result!.description).toBe('A test skill');
    expect(result!.license).toBe('MIT');
    expect(result!.compatibility).toBe('rhdh-2.2');
    expect(result!.metadata?.version).toBe('2.0.0');
    expect(result!.metadata?.author).toBe('Author Name');
    expect(result!.metadata?.tags).toEqual(['test', 'demo']);
    expect(result!.metadata?.owner).toBe('team-test');
    expect(result!.metadata?.lifecycle).toBe('production');
  });
});

// ─── normalizeSkillImageExtraction ─────────────────────────────────

describe('normalizeSkillImageExtraction', () => {
  it('normalizes a full skill image extraction', () => {
    const extraction = makeExtraction();
    const result = normalizeSkillImageExtraction(extraction);

    expect(result.outcome).toBe('normalized');
    expect(result.record).not.toBeNull();

    // Trusted fields come from acquisition metadata
    expect(result.record!.key).toBe(testAcquisition.key);
    expect(result.record!.digest).toBe(testAcquisition.digest);
    expect(result.record!.sourceUri).toBe(testAcquisition.sourceUri);

    // D3 precedence: SkillCard display-name wins
    expect(result.record!.name).toBe('Hello World Skill');
    expect(result.record!.description).toBe('A demo OCI skill image');
    // SkillCard version 1.0.0 wins over frontmatter 1.0 and 0.9.0
    expect(result.record!.version).toBe('1.0.0');
    expect(result.record!.license).toBe('Apache-2.0');
    expect(result.record!.compatibility).toBe('rhdh-2.2');
    expect(result.record!.owner).toBe('team-octo');
    expect(result.record!.lifecycle).toBe('production');
    expect(result.record!.tags).toEqual(['demo', 'hello-world']);
    expect(result.record!.authors).toEqual([
      { name: 'OCTO Team', email: 'octo@example.com' },
    ]);
    expect(result.record!.extensions?.oci?.namespace).toBe('octo-skills');
    expect(result.record!.extensions?.oci?.prompt).toBe(
      'You are a helpful assistant.',
    );
  });

  it('normalizes with minimal SkillCard (no frontmatter)', () => {
    const extraction = makeExtraction({
      skillImageYaml: 'metadata:\n  name: Minimal Skill',
      skillsMd: '# Minimal Skill\n\nContent without frontmatter.',
    });
    const result = normalizeSkillImageExtraction(extraction);

    expect(result.outcome).toBe('normalized');
    expect(result.record!.name).toBe('Minimal Skill');
    expect(result.record!.description).toBeUndefined();
    expect(result.record!.version).toBeUndefined();
    expect(result.record!.extensions).toBeUndefined();
  });

  it('falls back to frontmatter name when SkillCard has no name', () => {
    const extraction = makeExtraction({
      skillImageYaml: 'metadata:\n  description: No name here',
      skillsMd: '---\nname: Frontmatter Name\n---\n\n# Skill',
    });
    const result = normalizeSkillImageExtraction(extraction);

    expect(result.outcome).toBe('normalized');
    expect(result.record!.name).toBe('Frontmatter Name');
  });

  it('SkillCard version 1.0.0 wins over frontmatter version 1.0', () => {
    const extraction = makeExtraction({
      skillImageYaml: 'metadata:\n  name: version-test\n  version: "1.0.0"',
      skillsMd:
        '---\nname: Version Test\nmetadata:\n  version: "1.0"\nversion: "0.9.0"\n---\n\n# Test',
    });
    const result = normalizeSkillImageExtraction(extraction);

    expect(result.outcome).toBe('normalized');
    expect(result.record!.version).toBe('1.0.0');
  });

  it('returns malformed when SkillCard YAML cannot be parsed', () => {
    const extraction = makeExtraction({
      skillImageYaml: ':\n  - valid\n bad indent',
    });
    const result = normalizeSkillImageExtraction(extraction);

    expect(result.outcome).toBe('malformed');
    expect(result.record).toBeNull();
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ field: 'skillCard' }),
    );
  });

  it('returns malformed when no name is found anywhere', () => {
    const extraction = makeExtraction({
      skillImageYaml: 'metadata:\n  description: No name',
      skillsMd: '# Test\n\nNo frontmatter.',
    });
    const result = normalizeSkillImageExtraction(extraction);

    expect(result.outcome).toBe('malformed');
    expect(result.record).toBeNull();
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ field: 'name' }),
    );
  });

  it('returns malformed when no acquisition metadata', () => {
    const extraction = makeExtraction({ acquisition: undefined });
    const result = normalizeSkillImageExtraction(extraction);

    expect(result.outcome).toBe('malformed');
    expect(result.record).toBeNull();
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ field: 'key' }),
    );
  });

  it('handles optional frontmatter being absent', () => {
    const extraction = makeExtraction({
      skillImageYaml:
        'metadata:\n  name: Skill Without Frontmatter\n  version: "1.0.0"',
      skillsMd: '# Skill\n\nNo frontmatter at all.',
    });
    const result = normalizeSkillImageExtraction(extraction);

    expect(result.outcome).toBe('normalized');
    expect(result.record!.name).toBe('Skill Without Frontmatter');
    expect(result.record!.version).toBe('1.0.0');
    expect(result.record!.owner).toBeUndefined();
    expect(result.record!.lifecycle).toBeUndefined();
  });

  it('reports diagnostics for invalid optional fields', () => {
    const extraction = makeExtraction({
      skillImageYaml:
        'metadata:\n  name: Diagnostic Test\n  description: 42\n  version: true',
      skillsMd: '# Test',
    });
    const result = normalizeSkillImageExtraction(extraction);

    expect(result.outcome).toBe('normalized');
    expect(result.record!.name).toBe('Diagnostic Test');
    // Invalid values are omitted with diagnostics
    expect(result.record!.description).toBeUndefined();
    expect(result.record!.version).toBeUndefined();
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it('trusted metadata cannot be overridden by native content', () => {
    const extraction = makeExtraction({
      skillImageYaml: 'metadata:\n  name: Override Test',
      skillsMd:
        '---\nname: Override Test\nmetadata:\n  owner: team-test\n---\n\n# Test',
    });
    const result = normalizeSkillImageExtraction(extraction);

    expect(result.outcome).toBe('normalized');
    expect(result.record!.key).toBe(testAcquisition.key);
    expect(result.record!.digest).toBe(testAcquisition.digest);
    expect(result.record!.sourceUri).toBe(testAcquisition.sourceUri);
  });

  it('normalizes tags with case normalization and dedup', () => {
    const extraction = makeExtraction({
      skillImageYaml:
        'metadata:\n  name: Tag Test\n  tags:\n    - Demo\n    - DEMO\n    - test',
      skillsMd: '# Test',
    });
    const result = normalizeSkillImageExtraction(extraction);

    expect(result.outcome).toBe('normalized');
    expect(result.record!.tags).toEqual(['demo', 'test']);
  });

  it('normalizes string author to array', () => {
    const extraction = makeExtraction({
      skillImageYaml: 'metadata:\n  name: Author Test',
      skillsMd:
        '---\nname: Author Test\nmetadata:\n  author: Jane Doe\n---\n\n# Test',
    });
    const result = normalizeSkillImageExtraction(extraction);

    expect(result.outcome).toBe('normalized');
    expect(result.record!.authors).toEqual([{ name: 'Jane Doe' }]);
  });

  it('same-digest tags produce distinct keys with identical digest/sourceUri', () => {
    const acq1: AcquisitionMetadata = {
      key: 'quay.io/org/skill:latest',
      digest: testAcquisition.digest,
      sourceUri: testAcquisition.sourceUri,
    };
    const acq2: AcquisitionMetadata = {
      key: 'quay.io/org/skill:v1',
      digest: testAcquisition.digest,
      sourceUri: testAcquisition.sourceUri,
    };

    const ext1 = makeExtraction({ acquisition: acq1 });
    const ext2 = makeExtraction({ acquisition: acq2 });

    const r1 = normalizeSkillImageExtraction(ext1);
    const r2 = normalizeSkillImageExtraction(ext2);

    expect(r1.outcome).toBe('normalized');
    expect(r2.outcome).toBe('normalized');
    expect(r1.record!.key).toBe('quay.io/org/skill:latest');
    expect(r2.record!.key).toBe('quay.io/org/skill:v1');
    expect(r1.record!.digest).toBe(r2.record!.digest);
    expect(r1.record!.sourceUri).toBe(r2.record!.sourceUri);
  });
});

// A usable SkillCard must not hide malformed Markdown frontmatter.
describe('malformed frontmatter classification', () => {
  it.each([
    '---\nname: test',
    '---\nname: [unclosed\n---\nBody',
    '---\nscalar\n---\nBody',
    '---\n- item\n---\nBody',
    '---\nname: test\n---not-a-delimiter\nBody',
  ])('rejects malformed frontmatter %p despite a valid SkillCard', skillsMd => {
    const result = normalizeSkillImageExtraction(makeExtraction({ skillsMd }));
    expect(result.outcome).toBe('malformed');
    expect(result.record).toBeNull();
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ field: 'frontmatter' }),
    ]);
  });
});

describe('frontmatter delimiter boundaries', () => {
  it('accepts CRLF delimiters and an empty frontmatter object', () => {
    expect(parseMarkdownFrontmatter('---\r\nname: Windows\r\n---')).toEqual({
      name: 'Windows',
    });
    expect(
      normalizeSkillImageExtraction(
        makeExtraction({ skillsMd: '---\n---\nBody' }),
      ).outcome,
    ).toBe('normalized');
  });
  it('does not treat a prose prefix as an opening delimiter', () => {
    expect(
      parseMarkdownFrontmatter('---example\nnot frontmatter'),
    ).toBeUndefined();
  });
});

describe('frontmatter error details', () => {
  it.each([
    ['---\nname: Test', 'no closing delimiter'],
    ['---\nscalar\n---', 'must be a YAML object'],
    ['---\n- item\n---', 'must be a YAML object'],
  ])('reports the validation reason for %p', (skillsMd, reason) => {
    const result = normalizeSkillImageExtraction(makeExtraction({ skillsMd }));
    expect(result.outcome).toBe('malformed');
    expect(result.diagnostics[0].message).toContain(reason);
  });
  it('reports YAML syntax code and position without source content', () => {
    const result = normalizeSkillImageExtraction(
      makeExtraction({
        skillsMd: '---\nname: [sensitive-source-marker\n---',
      }),
    );
    expect(result.outcome).toBe('malformed');
    expect(result.diagnostics[0].message).toMatch(
      /YAML [A-Z_]+ at line \d+, column \d+/,
    );
    expect(result.diagnostics[0].message).not.toContain(
      'sensitive-source-marker',
    );
  });
});
