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

const mockGetRawToken = jest.fn();
jest.mock('../repoAuth', () => ({
  AuthHostNotAllowedError:
    jest.requireActual('../repoAuth').AuthHostNotAllowedError,
  useRepoAuthentication: () => ({
    getRawToken: mockGetRawToken,
    authenticate: jest.fn(),
  }),
}));

import { act, renderHook, waitFor } from '@testing-library/react';
import { TestApiProvider } from '@backstage/test-utils';
import { ConfigReader } from '@backstage/config';
import {
  ScmIntegrationsApi,
  scmAuthApiRef,
  scmIntegrationsApiRef,
} from '@backstage/integration-react';
import { SecretsContextProvider } from '@backstage/plugin-scaffolder-react';

import { useRepoUrlCredentials } from './useRepoUrlCredentials';

const integrationsWith = (gitlabHost: string) =>
  ScmIntegrationsApi.fromConfig(
    new ConfigReader({
      integrations: {
        gitlab: [
          { host: gitlabHost, apiBaseUrl: `https://${gitlabHost}/api/v4` },
        ],
      },
    }),
  );

function renderCredentials(host: string, gitlabHost = host) {
  const integrations = integrationsWith(gitlabHost);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestApiProvider apis={[[scmIntegrationsApiRef, integrations]]}>
      <SecretsContextProvider>{children}</SecretsContextProvider>
    </TestApiProvider>
  );
  const { result } = renderHook(
    () =>
      useRepoUrlCredentials({
        host,
        options: { secretsKey: 'SRC_USER_OAUTH_TOKEN' },
      }),
    { wrapper },
  );
  const getCredentials = (url: string) =>
    result.current.apis.get(scmAuthApiRef)!.getCredentials({ url });
  return { result, getCredentials };
}

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

describe('useRepoUrlCredentials', () => {
  beforeEach(() => {
    // Reset, not clear: drops queued mock*Once values a test left unused.
    mockGetRawToken.mockReset();
  });

  describe('overlapping requests for one host', () => {
    it('shares the pending request instead of starting another', async () => {
      const token = deferred<string>();
      mockGetRawToken.mockReturnValueOnce(token.promise);
      const { result, getCredentials } =
        renderCredentials('gitlab.example.com');

      let first!: Promise<{ token: string }>;
      let second!: Promise<{ token: string }>;
      act(() => {
        first = getCredentials('https://gitlab.example.com');
        second = getCredentials('https://gitlab.example.com');
      });
      await act(async () => token.resolve('gl-token'));

      await expect(first).resolves.toEqual({ token: 'gl-token' });
      await expect(second).resolves.toEqual({ token: 'gl-token' });
      expect(mockGetRawToken).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe('authenticated');
    });

    it('does not let a late failure overwrite an obtained token', async () => {
      const token = deferred<string>();
      mockGetRawToken.mockReturnValueOnce(token.promise);
      // Would be the outcome of a second, independent request.
      mockGetRawToken.mockRejectedValueOnce(new Error('popup closed'));
      const { result, getCredentials } =
        renderCredentials('gitlab.example.com');

      let first!: Promise<{ token: string }>;
      let second!: Promise<{ token: string }>;
      act(() => {
        first = getCredentials('https://gitlab.example.com');
        second = getCredentials('https://gitlab.example.com');
      });
      await act(async () => token.resolve('gl-token'));

      await expect(first).resolves.toEqual({ token: 'gl-token' });
      await expect(second).resolves.toEqual({ token: 'gl-token' });
      expect(result.current.status).toBe('authenticated');
      expect(result.current.error).toBeUndefined();
    });

    it('starts a new request once the previous one has settled', async () => {
      mockGetRawToken.mockResolvedValue('gl-token');
      const { getCredentials } = renderCredentials('gitlab.example.com');

      await act(() => getCredentials('https://gitlab.example.com'));
      await act(() => getCredentials('https://gitlab.example.com'));

      expect(mockGetRawToken).toHaveBeenCalledTimes(2);
    });
  });

  describe('host spelling', () => {
    // Backstage accepts `host:443` as an integration host, and the picker
    // keeps that spelling, while `new URL('https://host:443').host` drops the
    // port. Capitals cannot occur: Backstage rejects such integration hosts.
    it('treats an explicit default port as the same host', async () => {
      mockGetRawToken.mockResolvedValue('gl-token');
      const { result, getCredentials } = renderCredentials(
        'gitlab.example.com:443',
      );

      let credentials!: { token: string };
      await act(async () => {
        credentials = await getCredentials('https://gitlab.example.com:443');
      });

      expect(credentials).toEqual({ token: 'gl-token' });
      expect(mockGetRawToken).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'gitlab' }),
        'gitlab.example.com',
      );
      await waitFor(() => expect(result.current.status).toBe('authenticated'));
    });
  });
});
