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

import { mockServices } from '@backstage/backend-test-utils';

import { findAllSCMHosts } from './scm';

describe('findAllSCMHosts', () => {
  it('returns github and gitlab host URLs from config', async () => {
    const config = mockServices.rootConfig({
      data: {
        integrations: {
          github: [
            { host: 'github.com', token: 'gh-token' },
            { host: 'enterprise.github.com', token: 'gh-ent-token' },
          ],
          gitlab: [
            {
              host: 'gitlab.com',
              baseUrl: 'https://gitlab.com/',
              token: 'gl-token',
            },
          ],
        },
      },
    });

    const result = await findAllSCMHosts(config);

    expect(result.statusCode).toBe(200);
    expect(result.responseBody?.github).toEqual([
      'https://github.com',
      'https://enterprise.github.com',
    ]);
    expect(result.responseBody?.gitlab).toEqual(['https://gitlab.com']);
  });

  it('normalizes gitlab baseUrl by stripping trailing slash', async () => {
    const config = mockServices.rootConfig({
      data: {
        integrations: {
          gitlab: [
            {
              host: 'gitlab.com',
              baseUrl: 'https://gitlab.com/',
              token: 'gl-token',
            },
          ],
        },
      },
    });

    const result = await findAllSCMHosts(config);

    expect(result.statusCode).toBe(200);
    // trailing slash should be stripped from gitlab baseUrl
    expect(result.responseBody?.gitlab).toEqual(
      expect.arrayContaining(['https://gitlab.com']),
    );
    expect(result.responseBody?.gitlab?.every(u => !u.endsWith('/'))).toBe(
      true,
    );
  });

  it('returns only github hosts when no gitlab integrations are explicitly configured', async () => {
    const config = mockServices.rootConfig({
      data: {
        integrations: {
          github: [{ host: 'github.com', token: 'gh-token' }],
        },
      },
    });

    const result = await findAllSCMHosts(config);

    expect(result.statusCode).toBe(200);
    expect(result.responseBody?.github).toEqual(['https://github.com']);
    // Backstage's ScmIntegrations always adds a default gitlab.com entry
    expect(result.responseBody?.gitlab).toContain('https://gitlab.com');
  });

  it('returns only gitlab hosts when no github integrations are explicitly configured', async () => {
    const config = mockServices.rootConfig({
      data: {
        integrations: {
          gitlab: [
            {
              host: 'gitlab.com',
              baseUrl: 'https://gitlab.com',
              token: 'gl-token',
            },
          ],
        },
      },
    });

    const result = await findAllSCMHosts(config);

    expect(result.statusCode).toBe(200);
    expect(result.responseBody?.gitlab).toContain('https://gitlab.com');
    // Backstage's ScmIntegrations always adds a default github.com entry
    expect(result.responseBody?.github).toContain('https://github.com');
  });

  it('returns multiple github integrations in order', async () => {
    const config = mockServices.rootConfig({
      data: {
        integrations: {
          github: [
            { host: 'github.com', token: 'token-1' },
            { host: 'ghe.example.com', token: 'token-2' },
            { host: 'another-ghe.corp.com', token: 'token-3' },
          ],
        },
      },
    });

    const result = await findAllSCMHosts(config);

    expect(result.statusCode).toBe(200);
    expect(result.responseBody?.github).toEqual([
      'https://github.com',
      'https://ghe.example.com',
      'https://another-ghe.corp.com',
    ]);
  });
});
