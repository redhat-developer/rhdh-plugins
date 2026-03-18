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

const mockConfig = new ConfigReader({
  integrations: {
    github: [{ host: 'github.com' }, { host: 'ghe.corp.com' }],
    gitlab: [{ host: 'gitlab.com' }],
    bitbucketCloud: [{ host: 'bitbucket.org' }],
  },
});

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  configApiRef: Symbol('configApiRef'),
  useApi: jest.fn(() => mockConfig),
}));

import { renderHook } from '@testing-library/react';
import { useScmHostMap } from './useScmHostMap';

describe('useScmHostMap', () => {
  it('builds a host-to-provider map from config', () => {
    const { result } = renderHook(() => useScmHostMap());

    expect(result.current.get('github.com')).toBe('github');
    expect(result.current.get('ghe.corp.com')).toBe('github');
    expect(result.current.get('gitlab.com')).toBe('gitlab');
    expect(result.current.get('bitbucket.org')).toBe('bitbucket');
    expect(result.current.size).toBe(4);
  });

  it('returns the same reference on re-render when config has not changed', () => {
    const { result, rerender } = renderHook(() => useScmHostMap());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('returns empty map when no integrations are configured', () => {
    const { useApi } = jest.requireMock('@backstage/core-plugin-api');
    useApi.mockReturnValueOnce(new ConfigReader({}));

    const { result } = renderHook(() => useScmHostMap());
    expect(result.current.size).toBe(0);
  });
});
