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

import { normalizeRepoUrl } from './normalizeRepoUrl';

describe('normalizeRepoUrl', () => {
  it('converts RepoUrlPicker GitHub-style URL to clone URL', () => {
    expect(normalizeRepoUrl('github.com?owner=someone&repo=myrepo')).toBe(
      'https://github.com/someone/myrepo.git',
    );
  });

  it('converts RepoUrlPicker GitLab-style URL to clone URL', () => {
    expect(normalizeRepoUrl('gitlab.com?owner=mygroup&repo=myproject')).toBe(
      'https://gitlab.com/mygroup/myproject.git',
    );
  });

  it('handles custom GitHub host', () => {
    expect(normalizeRepoUrl('github.example.com?owner=org&repo=repo')).toBe(
      'https://github.example.com/org/repo.git',
    );
  });

  it('trims leading and trailing whitespace from input', () => {
    expect(normalizeRepoUrl('  github.com?owner=someone&repo=myrepo  ')).toBe(
      'https://github.com/someone/myrepo.git',
    );
  });

  it('returns empty string unchanged', () => {
    expect(normalizeRepoUrl('')).toBe('');
  });

  it('returns whitespace-only string unchanged', () => {
    expect(normalizeRepoUrl('   ')).toBe('   ');
  });

  it('returns already-normalized full clone URL unchanged', () => {
    const url = 'https://github.com/someone/myrepo.git';
    expect(normalizeRepoUrl(url)).toBe(url);
  });

  it('returns URL without owner and repo params unchanged', () => {
    expect(normalizeRepoUrl('github.com')).toBe('github.com');
    expect(normalizeRepoUrl('github.com?repo=myrepo')).toBe(
      'github.com?repo=myrepo',
    );
    expect(normalizeRepoUrl('github.com?owner=someone')).toBe(
      'github.com?owner=someone',
    );
  });

  it('ignores extra query params and normalizes when owner and repo present', () => {
    expect(
      normalizeRepoUrl('github.com?owner=someone&repo=myrepo&branch=main'),
    ).toBe('https://github.com/someone/myrepo.git');
  });

  it('returns invalid URL string unchanged', () => {
    const invalid = 'not-a-valid-url???';
    expect(normalizeRepoUrl(invalid)).toBe(invalid);
  });

  it('handles URL-encoded owner and repo', () => {
    // URLSearchParams decodes automatically
    expect(normalizeRepoUrl('github.com?owner=some%20user&repo=my-repo')).toBe(
      'https://github.com/some user/my-repo.git',
    );
  });
});
