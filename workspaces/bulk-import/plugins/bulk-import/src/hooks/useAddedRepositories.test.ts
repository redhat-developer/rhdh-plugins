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

import { renderHook, waitFor } from '@testing-library/react';

import { mockGetImportJobs, mockGetRepositories } from '../mocks/mockData';
import { useAddedRepositories } from './useAddedRepositories';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn().mockReturnValue({
    getImportJobs: jest.fn().mockReturnValue(mockGetImportJobs),
    getString: jest.fn().mockReturnValue('https://localhost:3000/'),
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn().mockReturnValue({
    data: mockGetImportJobs,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
  useFormikContext: jest.fn().mockReturnValue({
    setFieldValue: jest.fn(),
    values: {
      repositories: mockGetRepositories,
    },
  }),
}));

describe('useAddedRepositories', () => {
  it('should return import jobs', async () => {
    const { result } = renderHook(() => useAddedRepositories(1, 5, ''));
    await waitFor(() => {
      expect(result.current.loading).toBeFalsy();
      expect(result.current.data.totalJobs).toBe(4);
    });
  });
});
