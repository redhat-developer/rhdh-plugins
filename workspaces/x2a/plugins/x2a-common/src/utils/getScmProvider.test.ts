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
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { getScmProvider } from './getScmProvider';

describe('getScmProvider', () => {
  it('returns github for GitHub URLs', () => {
    expect(getScmProvider('https://github.com/owner/repo')).toBe('github');
    expect(getScmProvider('https://github.com/org/group/repo')).toBe('github');
  });

  it('returns gitlab for GitLab URLs', () => {
    expect(getScmProvider('https://gitlab.com/group/project')).toBe('gitlab');
    expect(getScmProvider('https://gitlab.example.com/org/repo')).toBe(
      'gitlab',
    );
  });

  it('returns bitbucket for Bitbucket URLs', () => {
    expect(getScmProvider('https://bitbucket.org/owner/repo')).toBe(
      'bitbucket',
    );
  });

  it('defaults to gitlab for self-hosted Bitbucket Server URLs (expected, cloud-based bitbucket support only)', () => {
    expect(getScmProvider('https://bitbucket.mycompany.com/org/repo')).toBe(
      'gitlab',
    );
  });

  it('defaults to gitlab for unknown SCM hosts', () => {
    expect(getScmProvider('https://gitea.example.com/org/repo')).toBe('gitlab');
  });
});
