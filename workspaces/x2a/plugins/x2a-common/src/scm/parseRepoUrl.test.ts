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

import { parseRepoUrl } from './parseRepoUrl';

describe('parseRepoUrl', () => {
  it('splits origin and path', () => {
    expect(parseRepoUrl('https://github.com/owner/repo')).toEqual({
      origin: 'https://github.com',
      path: '/owner/repo',
    });
  });

  it('strips the .git suffix', () => {
    expect(parseRepoUrl('https://github.com/owner/repo.git')).toEqual({
      origin: 'https://github.com',
      path: '/owner/repo',
    });
  });

  it('strips a trailing slash', () => {
    expect(parseRepoUrl('https://gitlab.com/group/sub/repo/')).toEqual({
      origin: 'https://gitlab.com',
      path: '/group/sub/repo',
    });
  });

  it('keeps a non-default port in the origin', () => {
    expect(parseRepoUrl('https://git.example.com:8443/o/r.git')).toEqual({
      origin: 'https://git.example.com:8443',
      path: '/o/r',
    });
  });

  it('throws for an unparsable URL', () => {
    expect(() => parseRepoUrl('not a url')).toThrow();
  });
});
