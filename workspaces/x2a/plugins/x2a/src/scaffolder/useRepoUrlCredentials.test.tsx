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

import { act, renderHook } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import { ConfigReader } from '@backstage/config';
import {
  bitbucketAuthApiRef,
  configApiRef,
  githubAuthApiRef,
  gitlabAuthApiRef,
} from '@backstage/core-plugin-api';
import {
  ScmIntegrationsApi,
  scmAuthApiRef,
  scmIntegrationsApiRef,
} from '@backstage/integration-react';
import { SecretsContextProvider } from '@backstage/plugin-scaffolder-react';

import { useRepoUrlCredentials } from './useRepoUrlCredentials';

const config = new ConfigReader({
  integrations: {
    gitlab: [
      {
        host: 'gitlab.example.com',
        apiBaseUrl: 'https://gitlab.example.com/api/v4',
      },
      {
        host: 'gitlab.other.example.com',
        apiBaseUrl: 'https://gitlab.other.example.com/api/v4',
      },
    ],
  },
  x2a: { scm: { authHosts: { gitlab: 'gitlab.example.com' } } },
});
const integrations = ScmIntegrationsApi.fromConfig(config);

/** A promise that the test settles by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const appGetCredentials = jest.fn();

function renderCredentials(
  initialHost: string,
  options: { readOnly?: boolean } = {},
) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestApiProvider
      apis={[
        [configApiRef, config],
        [scmIntegrationsApiRef, integrations],
        [scmAuthApiRef, { getCredentials: appGetCredentials }],
        [githubAuthApiRef, {}],
        [gitlabAuthApiRef, {}],
        [bitbucketAuthApiRef, {}],
      ]}
    >
      <SecretsContextProvider>{children}</SecretsContextProvider>
    </TestApiProvider>
  );
  const rendered = renderHook(
    ({ host }: { host: string }) =>
      useRepoUrlCredentials({
        host,
        options: { secretsKey: 'SRC_USER_OAUTH_TOKEN', ...options },
      }),
    { wrapper, initialProps: { host: initialHost } },
  );
  const getCredentials = (url: string) =>
    rendered.result.current.apis.get(scmAuthApiRef)!.getCredentials({ url });
  return { ...rendered, getCredentials };
}

describe('useRepoUrlCredentials', () => {
  beforeEach(() => {
    // Reset, not clear: drops queued mock*Once values a test left unused.
    appGetCredentials.mockReset();
  });

  it('passes the url through and requests write access by default', async () => {
    appGetCredentials.mockResolvedValue({ token: 'gl-token' });
    const { result, getCredentials } = renderCredentials('gitlab.example.com');

    let credentials!: { token: string };
    await act(async () => {
      credentials = await getCredentials('https://gitlab.example.com');
    });

    expect(credentials).toEqual({ token: 'gl-token' });
    expect(appGetCredentials).toHaveBeenCalledWith({
      url: 'https://gitlab.example.com',
      additionalScope: { repoWrite: true },
    });
    expect(result.current.status).toBe('idle');
  });

  it('maps readOnly to repoWrite: false', async () => {
    appGetCredentials.mockResolvedValue({ token: 'gl-token' });
    const { getCredentials } = renderCredentials('gitlab.example.com', {
      readOnly: true,
    });

    await act(() => getCredentials('https://gitlab.example.com'));

    expect(appGetCredentials).toHaveBeenCalledWith({
      url: 'https://gitlab.example.com',
      additionalScope: { repoWrite: false },
    });
  });

  it('forwards the custom scopes the stock picker passes', async () => {
    appGetCredentials.mockResolvedValue({ token: 'gl-token' });
    const { result } = renderCredentials('gitlab.example.com');

    await act(() =>
      result.current.apis.get(scmAuthApiRef)!.getCredentials({
        url: 'https://gitlab.example.com',
        additionalScope: { repoWrite: true, customScopes: { gitlab: ['api'] } },
      }),
    );

    expect(appGetCredentials).toHaveBeenCalledWith({
      url: 'https://gitlab.example.com',
      additionalScope: { repoWrite: true, customScopes: { gitlab: ['api'] } },
    });
  });

  it('reports an error, does not re-prompt, and Retry then succeeds', async () => {
    appGetCredentials.mockRejectedValueOnce(new Error('popup closed'));
    const { result, getCredentials } = renderCredentials('gitlab.example.com');

    let credentials!: { token: string };
    await act(async () => {
      credentials = await getCredentials('https://gitlab.example.com');
    });
    expect(credentials).toEqual({ token: '' });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('popup closed');
    expect(result.current.refused).toBeUndefined();

    // No new prompt until Retry.
    await act(() => getCredentials('https://gitlab.example.com'));
    expect(appGetCredentials).toHaveBeenCalledTimes(1);

    appGetCredentials.mockResolvedValueOnce({ token: 'gl-token' });
    act(() => result.current.retry());
    await act(async () => {
      credentials = await getCredentials('https://gitlab.example.com');
    });
    expect(credentials).toEqual({ token: 'gl-token' });
    expect(appGetCredentials).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('idle');
  });

  it('refuses a host other than the auth host without calling the app API', async () => {
    const { result, getCredentials } = renderCredentials(
      'gitlab.other.example.com',
    );

    let credentials!: { token: string };
    await act(async () => {
      credentials = await getCredentials('https://gitlab.other.example.com');
    });

    expect(credentials).toEqual({ token: '' });
    expect(appGetCredentials).not.toHaveBeenCalled();
    expect(result.current.status).toBe('error');
    expect(result.current.refused).toBeDefined();
    expect(result.current.refused?.host).toBe('gitlab.other.example.com');
  });

  it('refuses an unknown host (fail closed)', async () => {
    const { result, getCredentials } = renderCredentials('unknown.example.org');

    await act(() => getCredentials('https://unknown.example.org'));

    expect(appGetCredentials).not.toHaveBeenCalled();
    expect(result.current.refused).toBeDefined();
  });

  describe('a response for a host that is no longer selected', () => {
    it('does not hand back the token of the old host', async () => {
      const response = deferred<{ token: string }>();
      appGetCredentials.mockReturnValueOnce(response.promise);
      const { result, rerender, getCredentials } =
        renderCredentials('gitlab.example.com');

      let pending!: Promise<{ token: string }>;
      act(() => {
        pending = getCredentials('https://gitlab.example.com');
      });
      rerender({ host: 'gitlab.other.example.com' });
      await act(async () => response.resolve({ token: 'gl-token' }));

      await expect(pending).resolves.toEqual({ token: '' });
      expect(result.current.status).toBe('idle');
    });

    it('ignores a late failure and leaves the status alone', async () => {
      const response = deferred<{ token: string }>();
      appGetCredentials.mockReturnValueOnce(response.promise);
      const { result, rerender, getCredentials } =
        renderCredentials('gitlab.example.com');

      let pending!: Promise<{ token: string }>;
      act(() => {
        pending = getCredentials('https://gitlab.example.com');
      });
      rerender({ host: 'gitlab.other.example.com' });
      await act(async () => response.reject(new Error('popup closed')));

      await expect(pending).resolves.toEqual({ token: '' });
      expect(result.current.status).toBe('idle');
    });
  });
});
