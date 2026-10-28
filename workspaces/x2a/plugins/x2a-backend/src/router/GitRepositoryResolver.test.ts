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

import { ConfigReader } from '@backstage/config';
import { GitRepositoryResolver } from './GitRepositoryResolver';

describe('GitRepositoryResolver', () => {
  const resolver = new GitRepositoryResolver(
    new ConfigReader({
      integrations: {
        github: [
          { host: 'github.com' },
          { host: 'github.enterprise.com:8443' },
        ],
      },
    }),
  );

  it('rejects non-HTTPS repository URLs', () => {
    expect(() =>
      resolver.resolveConfiguredRepository(
        'http://github.com/org/repository.git',
        'main',
        { token: 'token' },
      ),
    ).toThrow('Repository URL must use HTTPS.');
  });

  it('matches configured hosts including their port', () => {
    expect(
      resolver.resolveConfiguredRepository(
        'https://github.enterprise.com:8443/org/repository.git',
        'main',
        { token: 'token' },
      ).url,
    ).toBe('https://github.enterprise.com:8443/org/repository.git');

    expect(() =>
      resolver.resolveConfiguredRepository(
        'https://github.enterprise.com:9443/org/repository.git',
        'main',
        { token: 'token' },
      ),
    ).toThrow(
      'Configuration repository host is not a supported configured SCM host.',
    );
  });

  it('rejects credentials embedded in repository URLs', () => {
    expect(() =>
      resolver.resolveConfiguredRepository(
        'https://user:password@github.com/org/repository.git',
        'main',
        { token: 'token' },
      ),
    ).toThrow('Repository URL must not contain embedded credentials.');
  });

  it('rejects query strings and fragments in repository URLs', () => {
    expect(() =>
      resolver.resolveConfiguredRepository(
        'https://github.com/org/repository.git?ref=main',
        'main',
        { token: 'token' },
      ),
    ).toThrow('Repository URL must not contain a query string or fragment.');
  });
});
