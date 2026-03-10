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

import { getAuthTokenDescriptor } from './getAuthTokenDescriptor';

describe('getAuthTokenDescriptor', () => {
  it('returns github descriptor with repo scope', () => {
    const result = getAuthTokenDescriptor({
      repoUrl: 'https://github.com/owner/repo',
      readOnly: false,
    });
    expect(result).toEqual({
      provider: 'github',
      tokenType: 'oauth',
      scope: 'repo',
    });
  });

  it('returns github descriptor with repo scope even when readOnly', () => {
    const result = getAuthTokenDescriptor({
      repoUrl: 'https://github.com/owner/repo',
      readOnly: true,
    });
    expect(result).toEqual({
      provider: 'github',
      tokenType: 'oauth',
      scope: 'repo',
    });
  });

  it('returns gitlab descriptor with write_repository scope', () => {
    const result = getAuthTokenDescriptor({
      repoUrl: 'https://gitlab.com/group/project',
      readOnly: false,
    });
    expect(result).toEqual({
      provider: 'gitlab',
      tokenType: 'oauth',
      scope: 'write_repository',
    });
  });

  it('returns gitlab descriptor with read_repository scope when readOnly', () => {
    const result = getAuthTokenDescriptor({
      repoUrl: 'https://gitlab.com/group/project',
      readOnly: true,
    });
    expect(result).toEqual({
      provider: 'gitlab',
      tokenType: 'oauth',
      scope: 'read_repository',
    });
  });

  it('returns bitbucket descriptor with repository:write scope', () => {
    const result = getAuthTokenDescriptor({
      repoUrl: 'https://bitbucket.org/workspace/repo',
      readOnly: false,
    });
    expect(result).toEqual({
      provider: 'bitbucket',
      tokenType: 'oauth',
      scope: 'repository:write',
    });
  });

  it('returns bitbucket descriptor with repository scope when readOnly', () => {
    const result = getAuthTokenDescriptor({
      repoUrl: 'https://bitbucket.org/workspace/repo',
      readOnly: true,
    });
    expect(result).toEqual({
      provider: 'bitbucket',
      tokenType: 'oauth',
      scope: 'repository',
    });
  });
});
