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
import { act, renderHook, waitFor } from '@testing-library/react';
import { useFetch } from './useFetch';
import { useRequestInit } from './useRequestInit';
import { useEvaluateTemplate } from './evaluateTemplate';
import { fetchWithRetry } from './retry';

jest.mock('@backstage/core-plugin-api', () => ({
  fetchApiRef: { id: 'fetch' },
  useApi: jest.fn(),
}));

jest.mock('./useRequestInit', () => ({
  useRequestInit: jest.fn(),
}));

jest.mock('./evaluateTemplate', () => ({
  useEvaluateTemplate: jest.fn(),
}));

jest.mock('./retry', () => ({
  fetchWithRetry: jest.fn(),
}));

const mockedUseApi = jest.requireMock('@backstage/core-plugin-api')
  .useApi as jest.Mock;
const mockedUseRequestInit = useRequestInit as jest.Mock;
const mockedUseEvaluateTemplate = useEvaluateTemplate as jest.Mock;
const mockedFetchWithRetry = fetchWithRetry as jest.Mock;

describe('useFetch', () => {
  const fetchApi = {
    fetch: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockedUseApi.mockReturnValue(fetchApi);
    mockedUseRequestInit.mockReturnValue({ method: 'GET' });
    mockedUseEvaluateTemplate.mockReturnValue('https://example.test/fetch');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns loading=false when fetch inputs are missing', async () => {
    const { result } = renderHook(() =>
      useFetch({} as any, {} as any, undefined as any),
    );
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('sets error when evaluated fetch URL is not a string', async () => {
    mockedUseEvaluateTemplate.mockReturnValue({ unexpected: true });

    const { result } = renderHook(() =>
      useFetch(
        {} as any,
        { 'fetch:url': 'https://example.test/fetch' } as any,
        ['ready'],
      ),
    );
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.error).toContain(
        'fetch:url is not evaluated to a string',
      );
    });
  });

  it('suppresses errors when fetch:error:ignoreUnready is enabled and deps are empty', async () => {
    mockedFetchWithRetry.mockRejectedValue(new Error('request failed'));

    const { result } = renderHook(() =>
      useFetch(
        {} as any,
        {
          'fetch:url': 'https://example.test/fetch',
          'fetch:error:ignoreUnready': true,
        } as any,
        [''],
      ),
    );
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockedFetchWithRetry).toHaveBeenCalled();
    });
    expect(result.current.error).toBeUndefined();
  });

  it('calls onSamlSsoError when response indicates expired SSO', async () => {
    const onSamlSsoError = jest.fn();
    mockedFetchWithRetry.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: {
        get: () => 'required; url=https://github.com/orgs/example/sso',
      },
    });

    renderHook(() =>
      useFetch(
        {} as any,
        { 'fetch:url': 'https://example.test/fetch' } as any,
        ['ready'],
        onSamlSsoError,
      ),
    );
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(onSamlSsoError).toHaveBeenCalled();
    });
    expect(onSamlSsoError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Re-authorize at'),
      }),
    );
  });

  it('stores response data for successful fetch', async () => {
    mockedFetchWithRetry.mockResolvedValue({
      ok: true,
      json: async () => ({ value: 'ok' }),
    });

    const { result } = renderHook(() =>
      useFetch(
        {} as any,
        { 'fetch:url': 'https://example.test/fetch' } as any,
        ['ready'],
      ),
    );
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ value: 'ok' });
    });
  });
});
