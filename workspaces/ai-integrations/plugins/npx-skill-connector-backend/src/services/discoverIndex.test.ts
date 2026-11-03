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

import type { LoggerService } from '@backstage/backend-plugin-api';
import { discoverIndex } from './discoverIndex';
import type { NpxSourceConfig } from './types';

/** Minimal mock logger. */
function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } as unknown as LoggerService;
}

/** Default source config for tests. */
const source: NpxSourceConfig = {
  id: 'test-source',
  indexUrl: 'https://skills.example.com/index.json',
  schedule: {
    frequency: { minutes: 10 },
    timeout: { minutes: 10 },
    initialDelay: { seconds: 0 },
    scope: 'local',
  },
};

/** Helper to build a JSON response for an index page. */
function indexPage(
  entries: Array<Record<string, unknown>>,
  next?: string,
): Response {
  const body = JSON.stringify({ entries, ...(next ? { next } : {}) });
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

/** A valid SHA-256 digest. */
const digest =
  'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';

describe('discoverIndex', () => {
  let fetchMock: jest.SpyInstance;
  let logger: LoggerService;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
    logger = createMockLogger();
  });

  afterEach(() => jest.restoreAllMocks());

  // ─── RHESS-compatible and multi-page fixtures ──────────────────────

  it('discovers skill-md entries from a single-page index', async () => {
    fetchMock.mockResolvedValue(
      indexPage([
        {
          name: 'skill-a',
          description: 'Skill A',
          type: 'skill-md',
          url: 'https://skills.example.com/skill-a/SKILL.md',
          digest,
        },
        {
          name: 'skill-b',
          type: 'skill-md',
          url: 'https://skills.example.com/skill-b/SKILL.md',
          digest,
        },
      ]),
    );

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(true);
    expect(result.failedKeys).toEqual([]);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].name).toBe('skill-a');
    expect(result.entries[0].description).toBe('Skill A');
    expect(result.entries[0].type).toBe('skill-md');
    expect(result.entries[1].name).toBe('skill-b');
    expect(result.entries[1].description).toBeUndefined();
  });

  it('follows pagination across multiple pages', async () => {
    fetchMock
      .mockResolvedValueOnce(
        indexPage(
          [
            {
              name: 'page1-skill',
              type: 'skill-md',
              url: 'https://skills.example.com/s1/SKILL.md',
              digest,
            },
          ],
          'https://skills.example.com/index.json?page=2',
        ),
      )
      .mockResolvedValueOnce(
        indexPage([
          {
            name: 'page2-skill',
            type: 'skill-md',
            url: 'https://skills.example.com/s2/SKILL.md',
            digest,
          },
        ]),
      );

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(true);
    expect(result.entries).toHaveLength(2);
    expect(result.entries.map(e => e.name)).toEqual([
      'page1-skill',
      'page2-skill',
    ]);
  });

  it('returns entries sorted by name for deterministic ordering', async () => {
    fetchMock.mockResolvedValue(
      indexPage([
        {
          name: 'zebra',
          type: 'skill-md',
          url: 'https://skills.example.com/z/SKILL.md',
          digest,
        },
        {
          name: 'alpha',
          type: 'skill-md',
          url: 'https://skills.example.com/a/SKILL.md',
          digest,
        },
        {
          name: 'middle',
          type: 'skill-md',
          url: 'https://skills.example.com/m/SKILL.md',
          digest,
        },
      ]),
    );

    const result = await discoverIndex(source, logger);

    expect(result.entries.map(e => e.name)).toEqual([
      'alpha',
      'middle',
      'zebra',
    ]);
  });

  // ─── Archive entry handling ────────────────────────────────────────

  it('skips archive entries without making the snapshot incomplete', async () => {
    fetchMock.mockResolvedValue(
      indexPage([
        {
          name: 'archive-skill',
          type: 'archive',
          url: 'https://skills.example.com/archive.tar.gz',
          digest,
        },
        {
          name: 'valid-skill',
          type: 'skill-md',
          url: 'https://skills.example.com/valid/SKILL.md',
          digest,
        },
      ]),
    );

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(true);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].name).toBe('valid-skill');
    expect(result.failedKeys).toEqual([]);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('archive ingestion is out of scope'),
    );
  });

  it('archive-only discovery is complete with empty results', async () => {
    fetchMock.mockResolvedValue(
      indexPage([
        {
          name: 'archive-only',
          type: 'archive',
          url: 'https://skills.example.com/archive.tar.gz',
          digest,
        },
      ]),
    );

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(true);
    expect(result.entries).toEqual([]);
    expect(result.failedKeys).toEqual([]);
  });

  // ─── Duplicate name handling ───────────────────────────────────────

  it('excludes both entries and reports key as failed on duplicate names', async () => {
    fetchMock.mockResolvedValue(
      indexPage([
        {
          name: 'dupe-skill',
          type: 'skill-md',
          url: 'https://skills.example.com/dupe1/SKILL.md',
          digest,
        },
        {
          name: 'unique-skill',
          type: 'skill-md',
          url: 'https://skills.example.com/unique/SKILL.md',
          digest,
        },
        {
          name: 'dupe-skill',
          type: 'skill-md',
          url: 'https://skills.example.com/dupe2/SKILL.md',
          digest,
        },
      ]),
    );

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(false);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].name).toBe('unique-skill');
    expect(result.failedKeys).toEqual(['dupe-skill']);
  });

  it('handles three entries with the same name', async () => {
    fetchMock.mockResolvedValue(
      indexPage([
        {
          name: 'triple',
          type: 'skill-md',
          url: 'https://skills.example.com/t1/SKILL.md',
          digest,
        },
        {
          name: 'triple',
          type: 'skill-md',
          url: 'https://skills.example.com/t2/SKILL.md',
          digest,
        },
        {
          name: 'triple',
          type: 'skill-md',
          url: 'https://skills.example.com/t3/SKILL.md',
          digest,
        },
      ]),
    );

    const result = await discoverIndex(source, logger);

    expect(result.entries).toEqual([]);
    expect(result.failedKeys).toEqual(['triple']);
    expect(result.complete).toBe(false);
  });

  // ─── Malformed entry handling ──────────────────────────────────────

  it('rejects entries with missing name', async () => {
    fetchMock.mockResolvedValue(
      indexPage([
        {
          type: 'skill-md',
          url: 'https://skills.example.com/no-name/SKILL.md',
          digest,
        },
      ]),
    );

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(false);
    expect(result.entries).toEqual([]);
  });

  it('rejects entries with invalid artifact URL', async () => {
    fetchMock.mockResolvedValue(
      indexPage([
        {
          name: 'bad-url',
          type: 'skill-md',
          url: 'http://insecure.example.com/SKILL.md',
          digest,
        },
      ]),
    );

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(false);
    expect(result.entries).toEqual([]);
    expect(result.failedKeys).toEqual(['bad-url']);
  });

  it('rejects entries with invalid digest', async () => {
    fetchMock.mockResolvedValue(
      indexPage([
        {
          name: 'bad-digest',
          type: 'skill-md',
          url: 'https://skills.example.com/bad/SKILL.md',
          digest: 'sha256:SHORT',
        },
      ]),
    );

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(false);
    expect(result.entries).toEqual([]);
    expect(result.failedKeys).toEqual(['bad-digest']);
  });

  it('rejects entries with unsupported type', async () => {
    fetchMock.mockResolvedValue(
      indexPage([
        {
          name: 'unknown-type',
          type: 'container-image',
          url: 'https://skills.example.com/unknown/SKILL.md',
          digest,
        },
      ]),
    );

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(false);
    expect(result.entries).toEqual([]);
    expect(result.failedKeys).toEqual(['unknown-type']);
  });

  // ─── Page failure handling ─────────────────────────────────────────

  it('preserves candidates from completed pages when a later page fails', async () => {
    fetchMock
      .mockResolvedValueOnce(
        indexPage(
          [
            {
              name: 'ok-skill',
              type: 'skill-md',
              url: 'https://skills.example.com/ok/SKILL.md',
              digest,
            },
          ],
          'https://skills.example.com/index.json?page=2',
        ),
      )
      .mockRejectedValueOnce(new Error('Network error'));

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(false);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].name).toBe('ok-skill');
  });

  // ─── Pagination cycle detection ────────────────────────────────────

  it('detects pagination cycle from repeated URL', async () => {
    const selfUrl = 'https://skills.example.com/index.json';
    fetchMock.mockResolvedValue(
      indexPage(
        [
          {
            name: 'cycle-skill',
            type: 'skill-md',
            url: 'https://skills.example.com/cycle/SKILL.md',
            digest,
          },
        ],
        selfUrl, // next points back to the same URL
      ),
    );

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(false);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].name).toBe('cycle-skill');
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Pagination cycle detected'),
    );
  });

  // ─── Discovery budget exhaustion ───────────────────────────────────

  it('stops when page budget is exhausted', async () => {
    // Create responses for 101 pages
    for (let i = 0; i < 101; i++) {
      const nextUrl =
        i < 100
          ? `https://skills.example.com/index.json?page=${i + 2}`
          : undefined;
      fetchMock.mockResolvedValueOnce(
        indexPage(
          [
            {
              name: `skill-p${i}`,
              type: 'skill-md',
              url: `https://skills.example.com/s${i}/SKILL.md`,
              digest,
            },
          ],
          nextUrl,
        ),
      );
    }

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(false);
    // Should have fetched exactly 100 pages
    expect(result.entries.length).toBe(100);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Page budget exhausted'),
    );
  });

  it('stops when candidate budget is exhausted', async () => {
    // Build a single page with 1001 entries
    const entries = Array.from({ length: 1001 }, (_, i) => ({
      name: `skill-${String(i).padStart(4, '0')}`,
      type: 'skill-md',
      url: `https://skills.example.com/s${i}/SKILL.md`,
      digest,
    }));

    fetchMock.mockResolvedValue(indexPage(entries));

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(false);
    expect(result.entries.length).toBe(1000);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Candidate budget exhausted'),
    );
  });

  // ─── Valid empty discovery ─────────────────────────────────────────

  it('returns complete with empty arrays on successful empty discovery', async () => {
    fetchMock.mockResolvedValue(indexPage([]));

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(true);
    expect(result.entries).toEqual([]);
    expect(result.failedKeys).toEqual([]);
  });

  // ─── Total failure ─────────────────────────────────────────────────

  it('reports incomplete when the first page fails to fetch', async () => {
    fetchMock.mockRejectedValue(new Error('Connection refused'));

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(false);
    expect(result.entries).toEqual([]);
    expect(result.failedKeys).toEqual([]);
  });

  it('reports incomplete on invalid JSON', async () => {
    fetchMock.mockResolvedValue(new Response('not json'));

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(false);
    expect(result.entries).toEqual([]);
  });

  it('reports incomplete when index page has no entries array', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [] })));

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(false);
    expect(result.entries).toEqual([]);
  });

  // ─── Caller cancellation ───────────────────────────────────────────

  it('honors caller cancellation', async () => {
    const controller = new AbortController();
    controller.abort(new Error('cancelled'));

    const result = await discoverIndex(source, logger, controller.signal);

    expect(result.complete).toBe(false);
    expect(result.entries).toEqual([]);
  });

  // ─── Deterministic failed key ordering ────────────────────────────

  it('returns failed keys in sorted order', async () => {
    fetchMock.mockResolvedValue(
      indexPage([
        {
          name: 'z-bad',
          type: 'skill-md',
          url: 'not-a-url',
          digest,
        },
        {
          name: 'a-bad',
          type: 'skill-md',
          url: 'http://insecure.example.com/SKILL.md',
          digest,
        },
        {
          name: 'm-bad',
          type: 'skill-md',
          url: 'https://skills.example.com/m/SKILL.md',
          digest: 'invalid',
        },
      ]),
    );

    const result = await discoverIndex(source, logger);

    expect(result.failedKeys).toEqual(['a-bad', 'm-bad', 'z-bad']);
  });

  // ─── Mixed valid and invalid entries ──────────────────────────────

  it('processes mixed valid, invalid, and archive entries correctly', async () => {
    fetchMock.mockResolvedValue(
      indexPage([
        {
          name: 'valid-skill',
          type: 'skill-md',
          url: 'https://skills.example.com/valid/SKILL.md',
          digest,
        },
        {
          name: 'archive-skill',
          type: 'archive',
          url: 'https://skills.example.com/archive.tar.gz',
          digest,
        },
        {
          name: 'bad-url-skill',
          type: 'skill-md',
          url: 'ftp://bad-protocol.example.com/SKILL.md',
          digest,
        },
        {
          name: 'another-valid',
          type: 'skill-md',
          url: 'https://skills.example.com/another/SKILL.md',
          digest,
        },
      ]),
    );

    const result = await discoverIndex(source, logger);

    expect(result.complete).toBe(false); // bad-url-skill makes it incomplete
    expect(result.entries.map(e => e.name)).toEqual([
      'another-valid',
      'valid-skill',
    ]);
    expect(result.failedKeys).toEqual(['bad-url-skill']);
  });

  // ─── Entries without explicit type ─────────────────────────────────

  it('treats entries without a type field as skill-md candidates', async () => {
    fetchMock.mockResolvedValue(
      indexPage([
        {
          name: 'typeless-skill',
          url: 'https://skills.example.com/typeless/SKILL.md',
          digest,
        },
      ]),
    );

    const result = await discoverIndex(source, logger);

    // An entry without a type should still have a valid URL and digest
    // but the type field being empty means it's neither archive nor
    // explicitly skill-md. The code treats empty type as not 'archive'
    // and not an explicitly unsupported type, so it proceeds with
    // URL/digest validation.
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].name).toBe('typeless-skill');
    expect(result.entries[0].type).toBe('skill-md');
  });

  // ─── Duplicates across pages ──────────────────────────────────────

  it('detects duplicates across multiple pages', async () => {
    fetchMock
      .mockResolvedValueOnce(
        indexPage(
          [
            {
              name: 'cross-page-dupe',
              type: 'skill-md',
              url: 'https://skills.example.com/d1/SKILL.md',
              digest,
            },
          ],
          'https://skills.example.com/index.json?page=2',
        ),
      )
      .mockResolvedValueOnce(
        indexPage([
          {
            name: 'cross-page-dupe',
            type: 'skill-md',
            url: 'https://skills.example.com/d2/SKILL.md',
            digest,
          },
          {
            name: 'unique-on-page2',
            type: 'skill-md',
            url: 'https://skills.example.com/u/SKILL.md',
            digest,
          },
        ]),
      );

    const result = await discoverIndex(source, logger);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].name).toBe('unique-on-page2');
    expect(result.failedKeys).toEqual(['cross-page-dupe']);
    expect(result.complete).toBe(false);
  });
});
