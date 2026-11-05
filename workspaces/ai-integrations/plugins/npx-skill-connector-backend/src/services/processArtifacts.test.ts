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

import { createHash } from 'crypto';
import type { LoggerService } from '@backstage/backend-plugin-api';
import { createMockLogger, testSource as source } from '../testUtils';
import type { DiscoveredEntry } from './discoverIndex';
import { parseMarkdownFrontmatter, processArtifacts } from './processArtifacts';

/** Compute a valid sha256 digest for a buffer. */
function sha256(data: Buffer): string {
  return `sha256:${createHash('sha256').update(data).digest('hex')}`;
}

/** A skill Markdown document with full frontmatter. */
const fullFrontmatter = `---
name: Summarize Text
description: A skill for summarizing text content
version: '1.0.0'
license: MIT
compatibility: agent-skills-v0.2
metadata:
  version: '1.0.0'
  author: Agent Team
  tags:
    - summarization
    - text
  owner: team-agents
  lifecycle: experimental
---

# Summarize Text

This skill summarizes input text.
`;

/** A skill Markdown document with minimal frontmatter. */
const minimalFrontmatter = `---
name: Basic Skill
---

# Basic Skill

A basic skill document.
`;

/** A skill Markdown document with no frontmatter. */
const noFrontmatter = `# Just a Markdown file

No frontmatter here.
`;

/** Helper to create a response with correct content. */
function artifactResponse(content: string): Response {
  return new Response(content, {
    status: 200,
    headers: { 'content-type': 'text/markdown' },
  });
}

/** Helper to build a discovered entry with correct digest for content. */
function entryForContent(
  name: string,
  content: string,
  url = `https://skills.example.com/${name}/SKILL.md`,
): DiscoveredEntry {
  const buf = Buffer.from(content, 'utf-8');
  return {
    name,
    type: 'skill-md',
    url,
    digest: sha256(buf),
  };
}

describe('parseMarkdownFrontmatter', () => {
  it('parses valid YAML frontmatter', () => {
    const result = parseMarkdownFrontmatter(fullFrontmatter);
    expect(result).toBeDefined();
    expect(result!.name).toBe('Summarize Text');
    expect(result!.description).toBe('A skill for summarizing text content');
    expect(result!.metadata?.version).toBe('1.0.0');
    expect(result!.metadata?.author).toBe('Agent Team');
    expect(result!.metadata?.tags).toEqual(['summarization', 'text']);
  });

  it('returns undefined when no frontmatter exists', () => {
    expect(parseMarkdownFrontmatter(noFrontmatter)).toBeUndefined();
  });

  it('parses minimal frontmatter', () => {
    const result = parseMarkdownFrontmatter(minimalFrontmatter);
    expect(result).toBeDefined();
    expect(result!.name).toBe('Basic Skill');
  });

  it('returns empty object for empty frontmatter', () => {
    const raw = '---\n---\nContent';
    expect(parseMarkdownFrontmatter(raw)).toEqual({});
  });

  it('throws for unclosed frontmatter', () => {
    const raw = '---\nname: Test\nMore content without closing';
    expect(() => parseMarkdownFrontmatter(raw)).toThrow('no closing delimiter');
  });

  it('throws for scalar frontmatter', () => {
    const raw = '---\njust a string\n---\n';
    expect(() => parseMarkdownFrontmatter(raw)).toThrow(
      'Frontmatter must be a YAML object',
    );
  });
});

describe('processArtifacts', () => {
  let fetchMock: jest.SpyInstance;
  let logger: LoggerService;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
    logger = createMockLogger();
  });

  afterEach(() => jest.restoreAllMocks());

  it('produces a normalized record from a verified artifact', async () => {
    const content = fullFrontmatter;
    const entry = entryForContent('summarize-text', content);
    fetchMock.mockResolvedValue(artifactResponse(content));

    const result = await processArtifacts([entry], source, logger);

    expect(result.records).toHaveLength(1);
    expect(result.failedKeys).toEqual([]);

    const record = result.records[0];
    expect(record.key).toBe('summarize-text');
    expect(record.name).toBe('Summarize Text');
    expect(record.description).toBe('A skill for summarizing text content');
    expect(record.version).toBe('1.0.0');
    expect(record.sourceUri).toBe(entry.url);
    expect(record.digest).toBe(entry.digest);
    expect(record.extensions).toEqual({ npx: { type: 'skill-md' } });
  });

  it('sets record.key from entry.name', async () => {
    const content = minimalFrontmatter;
    const entry = entryForContent('my-skill-key', content);
    fetchMock.mockResolvedValue(artifactResponse(content));

    const result = await processArtifacts([entry], source, logger);

    expect(result.records[0].key).toBe('my-skill-key');
  });

  it('sets sourceUri from the validated discovery entry artifact URL', async () => {
    const content = minimalFrontmatter;
    const url = 'https://skills.example.com/custom/path/SKILL.md';
    const entry = entryForContent('custom-url', content, url);
    fetchMock.mockResolvedValue(artifactResponse(content));

    const result = await processArtifacts([entry], source, logger);

    expect(result.records[0].sourceUri).toBe(url);
  });

  it('sets digest from verified retrieval', async () => {
    const content = minimalFrontmatter;
    const entry = entryForContent('digest-check', content);
    fetchMock.mockResolvedValue(artifactResponse(content));

    const result = await processArtifacts([entry], source, logger);

    expect(result.records[0].digest).toBe(entry.digest);
  });

  it('sets extensions.npx.type from the entry type', async () => {
    const content = minimalFrontmatter;
    const entry = entryForContent('type-check', content);
    fetchMock.mockResolvedValue(artifactResponse(content));

    const result = await processArtifacts([entry], source, logger);

    expect(result.records[0].extensions).toEqual({
      npx: { type: 'skill-md' },
    });
  });

  it('reports digest mismatch as a failed key', async () => {
    const content = minimalFrontmatter;
    const entry: DiscoveredEntry = {
      name: 'bad-digest',
      type: 'skill-md',
      url: 'https://skills.example.com/bad/SKILL.md',
      digest:
        'sha256:0000000000000000000000000000000000000000000000000000000000000000',
    };
    fetchMock.mockResolvedValue(artifactResponse(content));

    const result = await processArtifacts([entry], source, logger);

    expect(result.records).toEqual([]);
    expect(result.failedKeys).toEqual(['bad-digest']);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Digest mismatch'),
    );
  });

  it('does not suppress valid entries when one fails', async () => {
    const goodContent = minimalFrontmatter;
    const badContent = 'different content';
    const goodEntry = entryForContent('good-skill', goodContent);
    const badEntry: DiscoveredEntry = {
      name: 'bad-skill',
      type: 'skill-md',
      url: 'https://skills.example.com/bad/SKILL.md',
      digest:
        'sha256:0000000000000000000000000000000000000000000000000000000000000000',
    };

    fetchMock
      .mockResolvedValueOnce(artifactResponse(goodContent))
      .mockResolvedValueOnce(artifactResponse(badContent));

    const result = await processArtifacts(
      [goodEntry, badEntry],
      source,
      logger,
    );

    expect(result.records).toHaveLength(1);
    expect(result.records[0].key).toBe('good-skill');
    expect(result.failedKeys).toEqual(['bad-skill']);
  });

  it('frontmatter cannot override sourceUri', async () => {
    const content = `---
name: Sneaky Skill
sourceUri: https://evil.example.com/SKILL.md
---

# Sneaky Skill
`;
    const entry = entryForContent('sneaky-skill', content);
    fetchMock.mockResolvedValue(artifactResponse(content));

    const result = await processArtifacts([entry], source, logger);

    expect(result.records).toHaveLength(1);
    // sourceUri must come from the entry, not frontmatter
    expect(result.records[0].sourceUri).toBe(entry.url);
  });

  it('frontmatter cannot override digest', async () => {
    const content = `---
name: Digest Override
digest: sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
---

# Digest Override
`;
    const entry = entryForContent('digest-override', content);
    fetchMock.mockResolvedValue(artifactResponse(content));

    const result = await processArtifacts([entry], source, logger);

    expect(result.records).toHaveLength(1);
    // digest must come from the entry, not frontmatter
    expect(result.records[0].digest).toBe(entry.digest);
  });

  it('handles fetch failure for an entry', async () => {
    const entry: DiscoveredEntry = {
      name: 'fetch-fail',
      type: 'skill-md',
      url: 'https://skills.example.com/fail/SKILL.md',
      digest:
        'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    };
    fetchMock.mockRejectedValue(new Error('Network error'));

    const result = await processArtifacts([entry], source, logger);

    expect(result.records).toEqual([]);
    expect(result.failedKeys).toEqual(['fetch-fail']);
  });

  it('handles malformed frontmatter gracefully', async () => {
    const content = '---\nname: Test\nMore content without closing';
    const entry = entryForContent('malformed-fm', content);
    fetchMock.mockResolvedValue(artifactResponse(content));

    const result = await processArtifacts([entry], source, logger);

    expect(result.records).toEqual([]);
    expect(result.failedKeys).toEqual(['malformed-fm']);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to parse frontmatter'),
    );
  });

  it('uses frontmatter name over entry name', async () => {
    const content = `---
name: Frontmatter Display Name
---

# Skill
`;
    const entry = entryForContent('entry-key', content);
    fetchMock.mockResolvedValue(artifactResponse(content));

    const result = await processArtifacts([entry], source, logger);

    expect(result.records).toHaveLength(1);
    // Frontmatter name takes precedence over entry name
    expect(result.records[0].name).toBe('Frontmatter Display Name');
    // But key always comes from entry.name
    expect(result.records[0].key).toBe('entry-key');
  });

  it('falls back to entry name when frontmatter has no name', async () => {
    const content = `---
description: A skill without a name in frontmatter
---

# Skill
`;
    const entry: DiscoveredEntry = {
      ...entryForContent('fallback-name', content),
      description: 'Entry description',
    };
    fetchMock.mockResolvedValue(artifactResponse(content));

    const result = await processArtifacts([entry], source, logger);

    expect(result.records).toHaveLength(1);
    // Falls back to entry name when frontmatter has no name
    expect(result.records[0].name).toBe('fallback-name');
  });

  it('handles document with no frontmatter using entry metadata', async () => {
    const content = noFrontmatter;
    const entry: DiscoveredEntry = {
      ...entryForContent('no-fm', content),
      description: 'From the index',
    };
    fetchMock.mockResolvedValue(artifactResponse(content));

    const result = await processArtifacts([entry], source, logger);

    expect(result.records).toHaveLength(1);
    expect(result.records[0].name).toBe('no-fm');
    expect(result.records[0].description).toBe('From the index');
  });

  it('frontmatter description takes precedence over entry description', async () => {
    const content = `---
name: Desc Test
description: Frontmatter description
---

# Desc Test
`;
    const entry: DiscoveredEntry = {
      ...entryForContent('desc-test', content),
      description: 'Index description',
    };
    fetchMock.mockResolvedValue(artifactResponse(content));

    const result = await processArtifacts([entry], source, logger);

    expect(result.records).toHaveLength(1);
    // Frontmatter description takes precedence over index description
    expect(result.records[0].description).toBe('Frontmatter description');
  });

  it('processes entries with bounded concurrency', async () => {
    // Create 6 entries to exercise batching (max concurrency = 4)
    // Track concurrent fetches to verify batching occurs, not serial
    let activeFetches = 0;
    let maxConcurrentFetches = 0;

    const entries: DiscoveredEntry[] = [];
    for (let i = 0; i < 6; i++) {
      const content = `---\nname: Skill ${i}\n---\n# Skill ${i}\n`;
      entries.push(entryForContent(`skill-${i}`, content));
    }

    fetchMock.mockImplementation(async (urlArg: URL | string) => {
      activeFetches++;
      maxConcurrentFetches = Math.max(maxConcurrentFetches, activeFetches);
      // Yield to let concurrent fetches in the same batch start
      await new Promise(resolve => setTimeout(resolve, 10));
      activeFetches--;
      // Return content matching the requested entry URL
      const urlStr = urlArg instanceof URL ? urlArg.href : String(urlArg);
      const match = urlStr.match(/skill-(\d+)/);
      const idx = match ? parseInt(match[1], 10) : 0;
      const content = `---\nname: Skill ${idx}\n---\n# Skill ${idx}\n`;
      return artifactResponse(content);
    });

    const result = await processArtifacts(entries, source, logger);

    expect(result.records).toHaveLength(6);
    expect(result.failedKeys).toEqual([]);
    // A serial implementation would have maxConcurrentFetches === 1;
    // verify that batching allows concurrent fetches
    expect(maxConcurrentFetches).toBeGreaterThan(1);
    // Verify concurrency is bounded at the maximum of 4
    expect(maxConcurrentFetches).toBeLessThanOrEqual(4);
  });

  it('handles version from frontmatter metadata.version', async () => {
    const content = `---
name: Versioned Skill
metadata:
  version: '2.0.0'
version: '1.0.0'
---

# Versioned Skill
`;
    const entry = entryForContent('versioned', content);
    fetchMock.mockResolvedValue(artifactResponse(content));

    const result = await processArtifacts([entry], source, logger);

    expect(result.records).toHaveLength(1);
    // metadata.version takes precedence over top-level version
    expect(result.records[0].version).toBe('2.0.0');
  });

  it('honors caller cancellation', async () => {
    const content = minimalFrontmatter;
    const entries = [
      entryForContent('skill-a', content),
      entryForContent('skill-b', content),
    ];
    const controller = new AbortController();
    controller.abort(new Error('cancelled'));

    const result = await processArtifacts(
      entries,
      source,
      logger,
      controller.signal,
    );

    expect(result.records).toEqual([]);
    expect(result.failedKeys).toEqual(['skill-a', 'skill-b']);
  });
});
