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

import { useApi } from '@backstage/core-plugin-api';

import { renderHook, waitFor } from '@testing-library/react';

import { useLearningPathData } from './useLearningPathData';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

describe('useLearningPathData', () => {
  const learningPathData = [
    {
      paths: 6,
      minutes: 20,
      description: 'Learn about k8s API fundamentals',
      label: 'Building Operators on OpenShift',
      url: 'https://developers.redhat.com/learn/openshift/operators',
    },
  ];

  beforeEach(() => {
    (useApi as jest.Mock).mockReturnValue({
      getLearningPathData: jest.fn(() => Promise.resolve(learningPathData)),
    });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns learning path data from the API', async () => {
    const { result } = renderHook(() => useLearningPathData());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.data).toStrictEqual(learningPathData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  it('handles API and fallback errors', async () => {
    (useApi as jest.Mock).mockReturnValue({
      getLearningPathData: jest.fn(() =>
        Promise.reject(new Error('API Error')),
      ),
    });

    jest
      .spyOn(global, 'fetch')
      .mockImplementationOnce(() =>
        Promise.reject(new Error('Fallback data fetch Error')),
      );

    const { result } = renderHook(() => useLearningPathData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(
        new Error('Fallback data fetch Error'),
      );
    });
  });

  it('fetches learning path data from fallback when the API fails', async () => {
    const fallbackData = [
      {
        paths: 1,
        minutes: 20,
        description: 'Fallback description',
        label: 'Fallback learning path',
        url: 'https://example.com/learning-path',
      },
    ];

    (useApi as jest.Mock).mockReturnValue({
      getLearningPathData: jest.fn(() =>
        Promise.reject(new Error('API Error')),
      ),
    });

    jest
      .spyOn(global, 'fetch')
      .mockImplementationOnce(() =>
        Promise.resolve(
          new Response(JSON.stringify(fallbackData), { status: 200 }),
        ),
      );

    const { result } = renderHook(() => useLearningPathData());

    await waitFor(() => {
      expect(result.current.data).toEqual(fallbackData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      'Learning paths proxy request failed, using static fallback data.',
      expect.any(Error),
    );
  });

  it('rejects invalid fallback data', async () => {
    (useApi as jest.Mock).mockReturnValue({
      getLearningPathData: jest.fn(() =>
        Promise.reject(new Error('API Error')),
      ),
    });

    jest.spyOn(global, 'fetch').mockImplementationOnce(() =>
      Promise.resolve(
        new Response(JSON.stringify([{ label: 'Missing url', paths: 1 }]), {
          status: 200,
        }),
      ),
    );

    const { result } = renderHook(() => useLearningPathData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(
        new Error('learning path at index 0 is missing a valid url'),
      );
    });
  });
});
