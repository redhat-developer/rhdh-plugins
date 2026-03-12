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
import { buildScmHostMap } from './buildScmHostMap';

describe('buildScmHostMap', () => {
  it('returns empty map when no integrations are configured', () => {
    const config = new ConfigReader({});
    expect(buildScmHostMap(config).size).toBe(0);
  });

  it('maps github hosts', () => {
    const config = new ConfigReader({
      integrations: {
        github: [{ host: 'github.com' }, { host: 'github.mycompany.com' }],
      },
    });
    const map = buildScmHostMap(config);
    expect(map.get('github.com')).toBe('github');
    expect(map.get('github.mycompany.com')).toBe('github');
  });

  it('maps gitlab hosts', () => {
    const config = new ConfigReader({
      integrations: {
        gitlab: [{ host: 'gitlab.com' }, { host: 'gitlab.internal.io' }],
      },
    });
    const map = buildScmHostMap(config);
    expect(map.get('gitlab.com')).toBe('gitlab');
    expect(map.get('gitlab.internal.io')).toBe('gitlab');
  });

  it('maps bitbucketCloud hosts', () => {
    const config = new ConfigReader({
      integrations: {
        bitbucketCloud: [{ host: 'bitbucket.org' }],
      },
    });
    const map = buildScmHostMap(config);
    expect(map.get('bitbucket.org')).toBe('bitbucket');
  });

  it('maps deprecated bitbucket key', () => {
    const config = new ConfigReader({
      integrations: {
        bitbucket: [{ host: 'bitbucket.mycompany.com' }],
      },
    });
    const map = buildScmHostMap(config);
    expect(map.get('bitbucket.mycompany.com')).toBe('bitbucket');
  });

  it('maps all provider types together', () => {
    const config = new ConfigReader({
      integrations: {
        github: [{ host: 'github.com' }, { host: 'ghe.corp.com' }],
        gitlab: [{ host: 'gitlab.com' }],
        bitbucketCloud: [{ host: 'bitbucket.org' }],
      },
    });
    const map = buildScmHostMap(config);
    expect(map.size).toBe(4);
    expect(map.get('github.com')).toBe('github');
    expect(map.get('ghe.corp.com')).toBe('github');
    expect(map.get('gitlab.com')).toBe('gitlab');
    expect(map.get('bitbucket.org')).toBe('bitbucket');
  });

  it('first mapping wins when a host appears under multiple keys', () => {
    const config = new ConfigReader({
      integrations: {
        github: [{ host: 'example.com' }],
        gitlab: [{ host: 'example.com' }],
      },
    });
    const map = buildScmHostMap(config);
    expect(map.get('example.com')).toBe('github');
  });

  it('normalizes host case to lowercase', () => {
    const config = new ConfigReader({
      integrations: {
        github: [{ host: 'GitHub.COM' }],
        gitlab: [{ host: 'GitLab.Internal.IO' }],
      },
    });
    const map = buildScmHostMap(config);
    expect(map.get('github.com')).toBe('github');
    expect(map.get('gitlab.internal.io')).toBe('gitlab');
  });

  it('trims whitespace from host values', () => {
    const config = new ConfigReader({
      integrations: {
        github: [{ host: '  github.com  ' }],
      },
    });
    const map = buildScmHostMap(config);
    expect(map.get('github.com')).toBe('github');
  });

  it('strips port from host values', () => {
    const config = new ConfigReader({
      integrations: {
        gitlab: [{ host: 'gitlab.internal.io:8443' }],
      },
    });
    const map = buildScmHostMap(config);
    expect(map.get('gitlab.internal.io')).toBe('gitlab');
  });

  it('strips accidental scheme from host values', () => {
    const config = new ConfigReader({
      integrations: {
        github: [{ host: 'https://ghe.corp.com' }],
      },
    });
    const map = buildScmHostMap(config);
    expect(map.get('ghe.corp.com')).toBe('github');
  });

  it('deduplicates hosts that normalize to the same value', () => {
    const config = new ConfigReader({
      integrations: {
        github: [{ host: 'GitHub.COM' }, { host: 'github.com' }],
      },
    });
    const map = buildScmHostMap(config);
    expect(map.size).toBe(1);
    expect(map.get('github.com')).toBe('github');
  });
});
