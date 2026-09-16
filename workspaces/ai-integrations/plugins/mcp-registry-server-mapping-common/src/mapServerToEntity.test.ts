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

/* eslint-disable no-script-url */

import {
  mapServerToEntity,
  validateRequiredFields,
  mapRemotes,
  buildLinks,
  trackConsumedRemotePaths,
} from './mapServerToEntity';
import type { McpServerDocument } from './types';

/** Minimal valid server.json document for reuse across tests. */
function makeMinimalDoc(
  overrides?: Partial<McpServerDocument>,
): McpServerDocument {
  return {
    name: 'weather',
    description: 'A weather server',
    version: '1.0.0',
    remotes: [{ type: 'streamable-http', url: 'https://example.com/mcp' }],
    ...overrides,
  };
}

describe('validateRequiredFields', () => {
  it('does not throw for a valid document', () => {
    expect(() => validateRequiredFields(makeMinimalDoc())).not.toThrow();
  });

  it('throws for missing name', () => {
    expect(() => validateRequiredFields(makeMinimalDoc({ name: '' }))).toThrow(
      /missing required field.*name/i,
    );
  });

  it('throws for missing description', () => {
    expect(() =>
      validateRequiredFields(makeMinimalDoc({ description: '' })),
    ).toThrow(/missing required field.*description/i);
  });

  it('throws for missing version', () => {
    expect(() =>
      validateRequiredFields(makeMinimalDoc({ version: '' })),
    ).toThrow(/missing required field.*version/i);
  });

  it('throws for multiple missing fields', () => {
    expect(() =>
      validateRequiredFields({
        name: '',
        description: '',
        version: '',
      } as McpServerDocument),
    ).toThrow(/name.*description.*version/);
  });

  it('error references the MCP server schema', () => {
    expect(() => validateRequiredFields(makeMinimalDoc({ name: '' }))).toThrow(
      /server\.schema\.json/,
    );
  });
});

describe('mapRemotes', () => {
  it('returns valid remotes in source order', () => {
    const result = mapRemotes(
      makeMinimalDoc({
        remotes: [
          { type: 'streamable-http', url: 'https://a.com/mcp' },
          { type: 'sse', url: 'https://b.com/mcp' },
        ],
      }),
    );
    expect(result).toEqual([
      { type: 'streamable-http', url: 'https://a.com/mcp' },
      { type: 'sse', url: 'https://b.com/mcp' },
    ]);
  });

  it('filters out remotes with refused URLs', () => {
    const result = mapRemotes(
      makeMinimalDoc({
        remotes: [
          { type: 'valid', url: 'https://good.com/mcp' },
          { type: 'bad', url: 'javascript:alert(1)' },
        ],
      }),
    );
    expect(result).toEqual([{ type: 'valid', url: 'https://good.com/mcp' }]);
  });

  it('returns D8 placeholder when no remotes declared', () => {
    const result = mapRemotes(
      makeMinimalDoc({
        remotes: undefined,
        websiteUrl: 'https://example.com',
      }),
    );
    expect(result).toEqual([{ type: 'undefined', url: 'https://example.com' }]);
  });

  it('returns D8 placeholder when remotes is empty', () => {
    const result = mapRemotes(
      makeMinimalDoc({
        remotes: [],
        websiteUrl: 'https://example.com',
      }),
    );
    expect(result).toEqual([{ type: 'undefined', url: 'https://example.com' }]);
  });

  it('throws when no remotes and websiteUrl absent', () => {
    expect(() =>
      mapRemotes(makeMinimalDoc({ remotes: undefined, websiteUrl: undefined })),
    ).toThrow(/no valid remotes.*websiteUrl/i);
  });

  it('skips remote entries with empty string type', () => {
    const result = mapRemotes(
      makeMinimalDoc({
        remotes: [
          { type: '', url: 'https://a.com/mcp' },
          { type: 'sse', url: 'https://b.com/mcp' },
        ],
        websiteUrl: 'https://example.com',
      }),
    );
    expect(result).toEqual([{ type: 'sse', url: 'https://b.com/mcp' }]);
  });
});

describe('buildLinks', () => {
  it('returns empty when no websiteUrl or repository', () => {
    const result = buildLinks(makeMinimalDoc());
    expect(result.links).toHaveLength(0);
    expect(result.consumedPaths).toHaveLength(0);
  });

  it('emits Website link when websiteUrl passes D11', () => {
    const result = buildLinks(
      makeMinimalDoc({ websiteUrl: 'https://weather.example.com' }),
    );
    expect(result.links).toContainEqual({
      url: 'https://weather.example.com',
      title: 'Website',
    });
    expect(result.consumedPaths).toContain('websiteUrl');
  });

  it('consumes websiteUrl even when refused by D11', () => {
    const result = buildLinks(
      makeMinimalDoc({ websiteUrl: 'javascript:alert(1)' }),
    );
    expect(result.links).toHaveLength(0);
    expect(result.consumedPaths).toContain('websiteUrl');
  });

  it('emits Source Code link and annotations for valid repository', () => {
    const result = buildLinks(
      makeMinimalDoc({
        repository: {
          url: 'https://github.com/org/repo',
          source: 'github',
          subfolder: 'src/server',
        },
      }),
    );
    expect(result.links).toContainEqual({
      url: 'https://github.com/org/repo/tree/HEAD/src/server',
      title: 'Source Code',
    });
    expect(result.annotations['backstage.io/source-location']).toBe(
      'url:https://github.com/org/repo/tree/HEAD/src/server',
    );
    expect(result.consumedPaths).toContain('repository.url');
    expect(result.reservedAnnotationKeys).toContain(
      'backstage.io/source-location',
    );
  });

  it('consumes repository.url even when refused by D11', () => {
    const result = buildLinks(
      makeMinimalDoc({
        repository: {
          url: 'data:text/html,<script>alert(1)</script>',
          source: 'github',
        },
      }),
    );
    expect(result.links).toHaveLength(0);
    expect(result.consumedPaths).toContain('repository.url');
    expect(result.reservedAnnotationKeys).not.toContain(
      'backstage.io/source-location',
    );
  });
});

describe('trackConsumedRemotePaths', () => {
  it('tracks type and url for all remotes', () => {
    const paths = trackConsumedRemotePaths(
      makeMinimalDoc({
        remotes: [
          { type: 'streamable-http', url: 'https://a.com/mcp' },
          { type: 'sse', url: 'https://b.com/mcp' },
        ],
      }),
    );
    expect(paths).toContain('remotes.0.type');
    expect(paths).toContain('remotes.0.url');
    expect(paths).toContain('remotes.1.type');
    expect(paths).toContain('remotes.1.url');
  });

  it('tracks refused remote URLs symmetrically', () => {
    const paths = trackConsumedRemotePaths(
      makeMinimalDoc({
        remotes: [
          { type: 'valid', url: 'https://good.com/mcp' },
          { type: 'bad', url: 'javascript:alert(1)' },
        ],
      }),
    );
    // Both remote URLs are consumed regardless of D11 outcome
    expect(paths).toContain('remotes.0.url');
    expect(paths).toContain('remotes.1.url');
    expect(paths).toContain('remotes.0.type');
    expect(paths).toContain('remotes.1.type');
  });

  it('returns empty when no remotes', () => {
    const paths = trackConsumedRemotePaths(
      makeMinimalDoc({ remotes: undefined }),
    );
    expect(paths).toHaveLength(0);
  });
});

describe('mapServerToEntity', () => {
  describe('entity shape', () => {
    it('produces a valid mcp-server API entity from minimal input', () => {
      const { entity } = mapServerToEntity(makeMinimalDoc());

      expect(entity.apiVersion).toBe('backstage.io/v1alpha1');
      expect(entity.kind).toBe('API');
      expect(entity.spec.type).toBe('mcp-server');
      expect(entity.spec.remotes).toHaveLength(1);
      expect(entity.spec.remotes[0]).toEqual({
        type: 'streamable-http',
        url: 'https://example.com/mcp',
      });
      expect(entity.spec).not.toHaveProperty('definition');
    });

    it('includes mcp and ai tags', () => {
      const { entity } = mapServerToEntity(makeMinimalDoc());
      expect(entity.metadata.tags).toEqual(['mcp', 'ai']);
    });

    it('sets metadata.description from doc.description', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({ description: 'My server description' }),
      );
      expect(entity.metadata.description).toBe('My server description');
    });

    it('sets metadata.title when doc.title is provided', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({ title: 'Weather Server' }),
      );
      expect(entity.metadata.title).toBe('Weather Server');
    });

    it('omits metadata.title when doc.title is absent', () => {
      const { entity } = mapServerToEntity(makeMinimalDoc());
      expect(entity.metadata.title).toBeUndefined();
    });
  });

  describe('identity (D4)', () => {
    it('derives metadata.name with default prefix and no hash for clean names', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({ name: 'weather', version: '1.0.2' }),
      );
      expect(entity.metadata.name).toBe('mcp.registry__weather__1.0.2');
    });

    it('derives metadata.name with hash for reverse-DNS names', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          name: 'io.github.user/weather',
          version: '1.0.2',
        }),
      );
      expect(entity.metadata.name).toMatch(
        /^mcp\.registry__io\.github\.user-weather__1\.0\.2-[0-9a-f]{8}$/,
      );
    });

    it('preserves canonical name in annotation', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({ name: 'io.github.user/weather' }),
      );
      expect(
        entity.metadata.annotations?.['modelcontextprotocol.io/name'],
      ).toBe('io.github.user/weather');
    });

    it('preserves version in annotation', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({ version: '2.0.0' }),
      );
      expect(
        entity.metadata.annotations?.['modelcontextprotocol.io/version'],
      ).toBe('2.0.0');
    });

    it('produces distinct entities for different versions', () => {
      const v1 = mapServerToEntity(
        makeMinimalDoc({
          name: 'io.github.user/weather',
          version: '1.0.0',
        }),
      );
      const v2 = mapServerToEntity(
        makeMinimalDoc({
          name: 'io.github.user/weather',
          version: '2.0.0',
        }),
      );
      expect(v1.entity.metadata.name).not.toBe(v2.entity.metadata.name);
      expect(
        v1.entity.metadata.annotations?.['modelcontextprotocol.io/name'],
      ).toBe('io.github.user/weather');
      expect(
        v2.entity.metadata.annotations?.['modelcontextprotocol.io/name'],
      ).toBe('io.github.user/weather');
    });

    it('applies caller prefix override', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          name: 'io.github.user/weather',
          version: '1.0.2',
        }),
        { prefix: 'com.example.registry' },
      );
      expect(entity.metadata.name).toMatch(/^com\.example\.registry__/);
    });

    it('falls back to default prefix when override is empty', () => {
      const { entity } = mapServerToEntity(makeMinimalDoc(), { prefix: '' });
      expect(entity.metadata.name).toContain('mcp.registry');
    });
  });

  describe('caller defaults (D5)', () => {
    it('defaults spec.owner to unknown', () => {
      const { entity } = mapServerToEntity(makeMinimalDoc());
      expect(entity.spec.owner).toBe('unknown');
    });

    it('defaults spec.lifecycle to production', () => {
      const { entity } = mapServerToEntity(makeMinimalDoc());
      expect(entity.spec.lifecycle).toBe('production');
    });

    it('applies caller owner override', () => {
      const { entity } = mapServerToEntity(makeMinimalDoc(), {
        owner: 'group:default/mcp-admins',
      });
      expect(entity.spec.owner).toBe('group:default/mcp-admins');
    });

    it('applies caller lifecycle override', () => {
      const { entity } = mapServerToEntity(makeMinimalDoc(), {
        lifecycle: 'experimental',
      });
      expect(entity.spec.lifecycle).toBe('experimental');
    });
  });

  describe('required field validation', () => {
    it('throws for missing name', () => {
      expect(() => mapServerToEntity(makeMinimalDoc({ name: '' }))).toThrow(
        /missing required field.*name/i,
      );
    });

    it('throws for missing description', () => {
      expect(() =>
        mapServerToEntity(makeMinimalDoc({ description: '' })),
      ).toThrow(/missing required field.*description/i);
    });

    it('throws for missing version', () => {
      expect(() => mapServerToEntity(makeMinimalDoc({ version: '' }))).toThrow(
        /missing required field.*version/i,
      );
    });

    it('throws for multiple missing fields', () => {
      expect(() =>
        mapServerToEntity({
          name: '',
          description: '',
          version: '',
        } as McpServerDocument),
      ).toThrow(/name.*description.*version/);
    });

    it('error references the MCP server schema', () => {
      expect(() => mapServerToEntity(makeMinimalDoc({ name: '' }))).toThrow(
        /server\.schema\.json/,
      );
    });
  });

  describe('remotes (D8)', () => {
    it('copies remotes in source order', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          remotes: [
            { type: 'streamable-http', url: 'https://a.com/mcp' },
            { type: 'sse', url: 'https://b.com/mcp' },
          ],
        }),
      );
      expect(entity.spec.remotes).toEqual([
        { type: 'streamable-http', url: 'https://a.com/mcp' },
        { type: 'sse', url: 'https://b.com/mcp' },
      ]);
    });

    it('omits remote with refused URL', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          remotes: [
            { type: 'valid', url: 'https://good.com/mcp' },
            { type: 'bad', url: 'javascript:alert(1)' },
          ],
        }),
      );
      expect(entity.spec.remotes).toEqual([
        { type: 'valid', url: 'https://good.com/mcp' },
      ]);
    });

    it('uses D8 placeholder when no remotes declared', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          remotes: undefined,
          websiteUrl: 'https://example.com',
        }),
      );
      expect(entity.spec.remotes).toEqual([
        { type: 'undefined', url: 'https://example.com' },
      ]);
    });

    it('uses D8 placeholder when remotes is empty', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          remotes: [],
          websiteUrl: 'https://example.com',
        }),
      );
      expect(entity.spec.remotes).toEqual([
        { type: 'undefined', url: 'https://example.com' },
      ]);
    });

    it('uses D8 placeholder when all remotes refused', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          remotes: [
            { type: 'bad1', url: 'javascript:alert(1)' },
            { type: 'bad2', url: 'data:text/html,x' },
          ],
          websiteUrl: 'https://example.com',
        }),
      );
      expect(entity.spec.remotes).toEqual([
        { type: 'undefined', url: 'https://example.com' },
      ]);
    });

    it('fails when no remotes and websiteUrl absent', () => {
      expect(() =>
        mapServerToEntity(
          makeMinimalDoc({ remotes: undefined, websiteUrl: undefined }),
        ),
      ).toThrow(/no valid remotes.*websiteUrl/i);
    });

    it('fails when no remotes and websiteUrl fails D11', () => {
      expect(() =>
        mapServerToEntity(
          makeMinimalDoc({
            remotes: undefined,
            websiteUrl: 'javascript:alert(1)',
          }),
        ),
      ).toThrow(/no valid remotes.*websiteUrl/i);
    });

    it('copies http://localhost remote (private-looking host)', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          remotes: [
            {
              type: 'streamable-http',
              url: 'http://localhost:7007/api/mcp/v1',
            },
          ],
        }),
      );
      expect(entity.spec.remotes[0]).toEqual({
        type: 'streamable-http',
        url: 'http://localhost:7007/api/mcp/v1',
      });
    });

    it('copies http://10.0.0.5 remote (private-looking IPv4)', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          remotes: [
            { type: 'streamable-http', url: 'http://10.0.0.5:8080/mcp' },
          ],
        }),
      );
      expect(entity.spec.remotes[0]).toEqual({
        type: 'streamable-http',
        url: 'http://10.0.0.5:8080/mcp',
      });
    });

    it('never emits spec.definition', () => {
      const { entity } = mapServerToEntity(makeMinimalDoc());
      expect(entity.spec).not.toHaveProperty('definition');
    });
  });

  describe('descriptive metadata (D10)', () => {
    it('emits Website link when websiteUrl passes D11', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({ websiteUrl: 'https://weather.example.com' }),
      );
      expect(entity.metadata.links).toContainEqual({
        url: 'https://weather.example.com',
        title: 'Website',
      });
    });

    it('omits Website link when websiteUrl fails D11', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({ websiteUrl: 'javascript:alert(1)' }),
      );
      const websiteLink = entity.metadata.links?.find(
        l => l.title === 'Website',
      );
      expect(websiteLink).toBeUndefined();
    });

    it('omits Website link when websiteUrl is absent', () => {
      const { entity } = mapServerToEntity(makeMinimalDoc());
      const websiteLink = entity.metadata.links?.find(
        l => l.title === 'Website',
      );
      expect(websiteLink).toBeUndefined();
    });
  });

  describe('repository URL combination (D10)', () => {
    it('emits Source Code link for GitHub with subfolder', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          repository: {
            url: 'https://github.com/modelcontextprotocol/servers',
            source: 'github',
            subfolder: 'src/everything',
          },
        }),
      );
      const link = entity.metadata.links?.find(l => l.title === 'Source Code');
      expect(link?.url).toBe(
        'https://github.com/modelcontextprotocol/servers/tree/HEAD/src/everything',
      );
    });

    it('emits backstage.io/source-location for GitHub subfolder', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          repository: {
            url: 'https://github.com/modelcontextprotocol/servers',
            source: 'github',
            subfolder: 'src/everything',
          },
        }),
      );
      expect(
        entity.metadata.annotations?.['backstage.io/source-location'],
      ).toBe(
        'url:https://github.com/modelcontextprotocol/servers/tree/HEAD/src/everything',
      );
    });

    it('preserves original repository.url unnormalized', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          repository: {
            url: 'https://github.com/modelcontextprotocol/servers',
            source: 'github',
            subfolder: 'src/everything',
          },
        }),
      );
      expect(
        entity.metadata.annotations?.['modelcontextprotocol.io/repository.url'],
      ).toBe('https://github.com/modelcontextprotocol/servers');
    });

    it('emits GitLab subfolder URL', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          repository: {
            url: 'https://gitlab.com/group/repo',
            source: 'gitlab',
            subfolder: 'servers/weather',
          },
        }),
      );
      const link = entity.metadata.links?.find(l => l.title === 'Source Code');
      expect(link?.url).toBe(
        'https://gitlab.com/group/repo/-/tree/HEAD/servers/weather',
      );
    });

    it('emits Bitbucket subfolder URL', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          repository: {
            url: 'https://bitbucket.org/org/repo',
            source: 'bitbucket',
            subfolder: 'src/server',
          },
        }),
      );
      const link = entity.metadata.links?.find(l => l.title === 'Source Code');
      expect(link?.url).toBe(
        'https://bitbucket.org/org/repo/src/HEAD/src/server',
      );
    });

    it('emits Azure DevOps subfolder URL with path query param', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          repository: {
            url: 'https://dev.azure.com/org/project/_git/repo',
            source: 'azure-devops',
            subfolder: 'src/server',
          },
        }),
      );
      const link = entity.metadata.links?.find(l => l.title === 'Source Code');
      expect(link?.url).toBe(
        'https://dev.azure.com/org/project/_git/repo?path=/src/server',
      );
    });

    it('encodes Azure DevOps subfolder segments with special characters', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          repository: {
            url: 'https://dev.azure.com/org/project/_git/repo',
            source: 'azure-devops',
            subfolder: 'src/my&folder/file name',
          },
        }),
      );
      const link = entity.metadata.links?.find(l => l.title === 'Source Code');
      expect(link?.url).toBe(
        'https://dev.azure.com/org/project/_git/repo?path=/src/my%26folder/file%20name',
      );
    });

    it('falls back to path join for unknown SCM', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          repository: {
            url: 'https://git.example.com/org/repo',
            source: 'gerrit',
            subfolder: 'src/server',
          },
        }),
      );
      const link = entity.metadata.links?.find(l => l.title === 'Source Code');
      expect(link?.url).toBe('https://git.example.com/org/repo/src/server');
    });

    it('uses base URL without subfolder when subfolder is absent', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          repository: {
            url: 'https://github.com/org/repo',
          },
        }),
      );
      const link = entity.metadata.links?.find(l => l.title === 'Source Code');
      expect(link?.url).toBe('https://github.com/org/repo');
      expect(
        entity.metadata.annotations?.['modelcontextprotocol.io/repository.url'],
      ).toBe('https://github.com/org/repo');
    });

    it('preserves repository.url with trailing .git/ unnormalized', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          repository: {
            url: 'https://github.com/org/repo.git/',
          },
        }),
      );
      expect(
        entity.metadata.annotations?.['modelcontextprotocol.io/repository.url'],
      ).toBe('https://github.com/org/repo.git/');
      // Combined URL uses normalized base
      const link = entity.metadata.links?.find(l => l.title === 'Source Code');
      expect(link?.url).toBe('https://github.com/org/repo');
    });

    it('omits repository fields when repository.url fails D11', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          repository: {
            url: 'data:text/html,<script>alert(1)</script>',
            source: 'github',
          },
        }),
      );
      expect(
        entity.metadata.links?.find(l => l.title === 'Source Code'),
      ).toBeUndefined();
      expect(entity.metadata.annotations).not.toHaveProperty(
        'backstage.io/source-location',
      );
      expect(entity.metadata.annotations).not.toHaveProperty(
        'modelcontextprotocol.io/repository.url',
      );
    });

    it('copies https repository with internal-looking hostname', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          repository: {
            url: 'https://gitlab.internal/org/repo',
          },
        }),
      );
      const link = entity.metadata.links?.find(l => l.title === 'Source Code');
      expect(link?.url).toBe('https://gitlab.internal/org/repo');
      expect(
        entity.metadata.annotations?.['modelcontextprotocol.io/repository.url'],
      ).toBe('https://gitlab.internal/org/repo');
    });
  });

  describe('determinism (D6)', () => {
    it('produces byte-identical output for identical inputs', () => {
      const doc = makeMinimalDoc({
        name: 'io.github.user/weather',
        version: '1.0.2',
        title: 'Weather',
        description: 'A weather server',
        websiteUrl: 'https://weather.example.com',
        repository: {
          url: 'https://github.com/user/weather',
          source: 'github',
          subfolder: 'src/server',
        },
        remotes: [
          { type: 'streamable-http', url: 'https://a.com/mcp' },
          { type: 'sse', url: 'https://b.com/mcp' },
        ],
      });

      const result1 = mapServerToEntity(doc);
      const result2 = mapServerToEntity(doc);

      expect(JSON.stringify(result1.entity)).toBe(
        JSON.stringify(result2.entity),
      );
    });

    it('annotation keys are sorted', () => {
      const { entity } = mapServerToEntity(
        makeMinimalDoc({
          repository: {
            url: 'https://github.com/org/repo',
            source: 'github',
          },
        }),
      );

      const keys = Object.keys(entity.metadata.annotations ?? {});
      const sortedKeys = [...keys].sort((a, b) => a.localeCompare(b));
      expect(keys).toEqual(sortedKeys);
    });
  });

  describe('hand-off contract', () => {
    it('supplies consumed paths', () => {
      const { consumedPaths } = mapServerToEntity(
        makeMinimalDoc({
          title: 'Weather',
          websiteUrl: 'https://example.com',
          repository: { url: 'https://github.com/org/repo' },
          remotes: [
            { type: 'streamable-http', url: 'https://example.com/mcp' },
          ],
        }),
      );

      expect(consumedPaths).toContain('name');
      expect(consumedPaths).toContain('description');
      expect(consumedPaths).toContain('version');
      expect(consumedPaths).toContain('title');
      expect(consumedPaths).toContain('websiteUrl');
      expect(consumedPaths).toContain('repository.url');
      expect(consumedPaths).toContain('remotes.0.type');
      expect(consumedPaths).toContain('remotes.0.url');
    });

    it('supplies reserved annotation keys', () => {
      const { reservedAnnotationKeys } = mapServerToEntity(
        makeMinimalDoc({
          repository: { url: 'https://github.com/org/repo' },
        }),
      );

      expect(reservedAnnotationKeys).toContain('modelcontextprotocol.io/name');
      expect(reservedAnnotationKeys).toContain(
        'modelcontextprotocol.io/version',
      );
      expect(reservedAnnotationKeys).toContain('backstage.io/source-location');
      expect(reservedAnnotationKeys).toContain(
        'modelcontextprotocol.io/repository.url',
      );
    });

    it('does not include repository annotation keys when repo URL fails D11', () => {
      const { reservedAnnotationKeys } = mapServerToEntity(
        makeMinimalDoc({
          repository: { url: 'javascript:alert(1)' },
        }),
      );

      expect(reservedAnnotationKeys).not.toContain(
        'backstage.io/source-location',
      );
      expect(reservedAnnotationKeys).not.toContain(
        'modelcontextprotocol.io/repository.url',
      );
    });

    it('consumed paths and reserved keys are sorted', () => {
      const { consumedPaths, reservedAnnotationKeys } = mapServerToEntity(
        makeMinimalDoc({
          repository: { url: 'https://github.com/org/repo' },
        }),
      );

      expect(consumedPaths).toEqual(
        [...consumedPaths].sort((a, b) => a.localeCompare(b)),
      );
      expect(reservedAnnotationKeys).toEqual(
        [...reservedAnnotationKeys].sort((a, b) => a.localeCompare(b)),
      );
    });

    it('consumes refused remote URLs symmetrically', () => {
      const { consumedPaths } = mapServerToEntity(
        makeMinimalDoc({
          remotes: [
            { type: 'valid', url: 'https://good.com/mcp' },
            { type: 'bad', url: 'javascript:alert(1)' },
          ],
        }),
      );

      // Both remote URLs are consumed regardless of D11 outcome
      expect(consumedPaths).toContain('remotes.0.url');
      expect(consumedPaths).toContain('remotes.1.url');
      expect(consumedPaths).toContain('remotes.0.type');
      expect(consumedPaths).toContain('remotes.1.type');
    });
  });

  describe('remote.type runtime validation', () => {
    it('skips remote entry with missing type', () => {
      const doc = makeMinimalDoc({
        remotes: [
          { type: undefined as unknown as string, url: 'https://a.com/mcp' },
          { type: 'sse', url: 'https://b.com/mcp' },
        ],
        websiteUrl: 'https://example.com',
      });
      const { entity } = mapServerToEntity(doc);
      expect(entity.spec.remotes).toEqual([
        { type: 'sse', url: 'https://b.com/mcp' },
      ]);
    });

    it('skips remote entry with empty string type', () => {
      const doc = makeMinimalDoc({
        remotes: [
          { type: '', url: 'https://a.com/mcp' },
          { type: 'sse', url: 'https://b.com/mcp' },
        ],
        websiteUrl: 'https://example.com',
      });
      const { entity } = mapServerToEntity(doc);
      expect(entity.spec.remotes).toEqual([
        { type: 'sse', url: 'https://b.com/mcp' },
      ]);
    });

    it('falls back to D8 placeholder when all remotes have invalid type', () => {
      const doc = makeMinimalDoc({
        remotes: [
          { type: undefined as unknown as string, url: 'https://a.com/mcp' },
        ],
        websiteUrl: 'https://example.com',
      });
      const { entity } = mapServerToEntity(doc);
      expect(entity.spec.remotes).toEqual([
        { type: 'undefined', url: 'https://example.com' },
      ]);
    });
  });
});
