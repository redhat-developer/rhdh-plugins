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
  resolveScmProvider,
  resolveScmProviderByName,
} from './providerRegistry';

describe('resolveScmProvider', () => {
  it('returns github provider for GitHub URLs', () => {
    expect(resolveScmProvider('https://github.com/owner/repo').name).toBe(
      'github',
    );
    expect(resolveScmProvider('https://github.com/org/group/repo').name).toBe(
      'github',
    );
  });

  it('returns gitlab provider for GitLab URLs', () => {
    expect(resolveScmProvider('https://gitlab.com/group/project').name).toBe(
      'gitlab',
    );
    expect(resolveScmProvider('https://gitlab.example.com/org/repo').name).toBe(
      'gitlab',
    );
  });

  it('returns bitbucket provider for Bitbucket URLs', () => {
    expect(resolveScmProvider('https://bitbucket.org/owner/repo').name).toBe(
      'bitbucket',
    );
  });

  it('defaults to gitlab for self-hosted Bitbucket Server URLs (cloud-based bitbucket support only)', () => {
    expect(
      resolveScmProvider('https://bitbucket.mycompany.com/org/repo').name,
    ).toBe('gitlab');
  });

  it('defaults to gitlab for unknown SCM hosts', () => {
    expect(resolveScmProvider('https://gitea.example.com/org/repo').name).toBe(
      'gitlab',
    );
  });

  it('does not misclassify hosts that contain github.com or bitbucket.org as substrings', () => {
    expect(
      resolveScmProvider('https://github.com.evil.com/org/repo').name,
    ).toBe('gitlab');
    expect(resolveScmProvider('https://notgithub.com/org/repo').name).toBe(
      'gitlab',
    );
    expect(
      resolveScmProvider('https://bitbucket.org.evil.com/ws/repo').name,
    ).toBe('gitlab');
    expect(resolveScmProvider('https://notbitbucket.org/ws/repo').name).toBe(
      'gitlab',
    );
  });

  describe('with hostProviderMap', () => {
    const hostMap = new Map([
      ['ghe.corp.com', 'github' as const],
      ['bb.internal.io', 'bitbucket' as const],
      ['gitlab.internal.io', 'gitlab' as const],
    ]);

    it('detects github on a custom domain via host map', () => {
      expect(
        resolveScmProvider('https://ghe.corp.com/org/repo', hostMap).name,
      ).toBe('github');
    });

    it('detects bitbucket on a custom domain via host map', () => {
      expect(
        resolveScmProvider('https://bb.internal.io/ws/repo', hostMap).name,
      ).toBe('bitbucket');
    });

    it('detects gitlab on a custom domain via host map', () => {
      expect(
        resolveScmProvider('https://gitlab.internal.io/grp/prj', hostMap).name,
      ).toBe('gitlab');
    });

    it('falls back to URL heuristic when host is not in the map', () => {
      expect(
        resolveScmProvider('https://github.com/owner/repo', hostMap).name,
      ).toBe('github');
    });

    it('falls back to gitlab for unknown hosts not in the map', () => {
      expect(
        resolveScmProvider('https://unknown.example.com/org/repo', hostMap)
          .name,
      ).toBe('gitlab');
    });

    it('host map takes priority over URL heuristic', () => {
      const overrideMap = new Map([['github.com', 'gitlab' as const]]);
      expect(
        resolveScmProvider('https://github.com/org/repo', overrideMap).name,
      ).toBe('gitlab');
    });

    it('distinguishes providers on same hostname with different ports', () => {
      const portMap = new Map([
        ['scm.corp.com:8080', 'gitlab' as const],
        ['scm.corp.com:9090', 'github' as const],
      ]);
      expect(
        resolveScmProvider('https://scm.corp.com:8080/grp/prj', portMap).name,
      ).toBe('gitlab');
      expect(
        resolveScmProvider('https://scm.corp.com:9090/org/repo', portMap).name,
      ).toBe('github');
    });
  });
});

describe('resolveScmProviderByName', () => {
  it('returns github provider', () => {
    expect(resolveScmProviderByName('github').name).toBe('github');
  });

  it('returns gitlab provider', () => {
    expect(resolveScmProviderByName('gitlab').name).toBe('gitlab');
  });

  it('returns bitbucket provider', () => {
    expect(resolveScmProviderByName('bitbucket').name).toBe('bitbucket');
  });

  it('throws for unknown provider names', () => {
    expect(() => resolveScmProviderByName('gitea' as any)).toThrow(
      'Unknown SCM provider: gitea',
    );
  });
});
