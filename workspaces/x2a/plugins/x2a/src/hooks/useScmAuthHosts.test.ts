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

let mockConfig = new ConfigReader({});

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  configApiRef: Symbol('configApiRef'),
  useApi: jest.fn(() => mockConfig),
}));

import { renderHook } from '@testing-library/react';
import type { ScmProviderName } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useScmAuthHosts } from './useScmAuthHosts';

const withAuthHosts = (authHosts?: Record<string, string>) => {
  mockConfig = new ConfigReader(
    authHosts ? { x2a: { scm: { authHosts } } } : {},
  );
};

const isAuthHost = (host: string | undefined, provider: ScmProviderName) =>
  renderHook(() => useScmAuthHosts()).result.current.isAuthHost(host, provider);

describe('useScmAuthHosts', () => {
  const configured = {
    github: 'ghe.corp.example.com',
    gitlab: 'GitLab.Corp.Example.com:8443',
  };

  it.each<[string, string | undefined, ScmProviderName, boolean]>([
    ['the configured GitHub host', 'ghe.corp.example.com', 'github', true],
    ['another GitHub host', 'github.com', 'github', false],
    [
      'the configured GitLab host, case-insensitively',
      'gitlab.corp.example.com:8443',
      'gitlab',
      true,
    ],
    [
      'the configured GitLab host without its port',
      'gitlab.corp.example.com',
      'gitlab',
      false,
    ],
    ['a GitLab host on another type', 'ghe.corp.example.com', 'gitlab', false],
    [
      'bitbucket.org, which needs no config',
      'bitbucket.org',
      'bitbucket',
      true,
    ],
    ['another Bitbucket host', 'bitbucket.example.com', 'bitbucket', false],
    ['an empty host', '', 'github', false],
    ['an undefined host', undefined, 'github', false],
  ])('with %s', (_name, host, provider, expected) => {
    withAuthHosts(configured);
    expect(isAuthHost(host, provider)).toBe(expected);
  });

  it('has no default: an unset key authenticates no GitHub or GitLab host', () => {
    withAuthHosts();
    expect(isAuthHost('github.com', 'github')).toBe(false);
    expect(isAuthHost('gitlab.com', 'gitlab')).toBe(false);
    expect(isAuthHost('bitbucket.org', 'bitbucket')).toBe(true);
  });

  it.each([
    ['a URL, as in the GitLab audience', 'https://gitlab.example.com'],
    ['a URL with a trailing slash', 'https://gitlab.example.com/'],
    ['a default HTTPS port', 'gitlab.example.com:443'],
    ['surrounding whitespace', '  gitlab.example.com '],
  ])('accepts %s', (_name, value) => {
    withAuthHosts({ gitlab: value });
    expect(isAuthHost('gitlab.example.com', 'gitlab')).toBe(true);
    expect(
      renderHook(() => useScmAuthHosts()).result.current.authHostFor('gitlab'),
    ).toBe('gitlab.example.com');
  });

  it('keeps a non-default port in a URL', () => {
    withAuthHosts({ gitlab: 'https://gitlab.example.com:8443' });
    expect(isAuthHost('gitlab.example.com:8443', 'gitlab')).toBe(true);
    expect(isAuthHost('gitlab.example.com', 'gitlab')).toBe(false);
  });

  it('exposes the configured host, lowercased', () => {
    withAuthHosts(configured);
    const { authHostFor } = renderHook(() => useScmAuthHosts()).result.current;
    expect(authHostFor('gitlab')).toBe('gitlab.corp.example.com:8443');
    expect(authHostFor('github')).toBe('ghe.corp.example.com');
    expect(authHostFor('bitbucket')).toBe('bitbucket.org');
  });
});
