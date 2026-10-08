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

const mockClient = {
  getLearningPathData: jest.fn(),
};

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
    mockClient.getLearningPathData.mockResolvedValue(learningPathData);
    (useApi as jest.Mock).mockReturnValue(mockClient);
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

  it('uses bundled fallback data when the API fails', async () => {
    mockClient.getLearningPathData.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useLearningPathData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data?.length).toBeGreaterThan(0);
      expect(result.current.error).toBeUndefined();
    });

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      'Learning paths proxy request failed, using bundled fallback data.',
      expect.any(Error),
    );
  });
});
