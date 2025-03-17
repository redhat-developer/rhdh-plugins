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
import { Config } from '@backstage/config';
import { AdoptionInsightsApiClient } from '..';
import { APIsViewOptions } from '../../types';

describe('AdoptionInsightsApiClient', () => {
  let apiClient: AdoptionInsightsApiClient;
  let mockConfigApi;
  let mockFetchApi;
  let mockFetch: jest.Mock;

  beforeAll(() => {
    global.URL.createObjectURL = jest.fn(() => 'mockedBlobUrl');
  });

  beforeEach(() => {
    mockConfigApi = {
      getString: jest.fn().mockReturnValue('http://mock-backend'), // NOSONAR
      has: jest.fn().mockReturnValue(true),
      get: jest.fn(),
      getOptional: jest.fn(),
      keys: jest.fn(),
    } as unknown as Config;
    mockFetch = jest.fn();
    mockFetchApi = { fetch: mockFetch };
    apiClient = new AdoptionInsightsApiClient({
      configApi: mockConfigApi,
      fetchApi: mockFetchApi,
    });
  });

  test('getBaseUrl returns correct URL', async () => {
    await expect(apiClient.getBaseUrl()).resolves.toBe(
      'http://mock-backend/api/adoption-insights', // NOSONAR
    );
  });

  const testCases = [
    { method: 'getActiveUsers', response: { grouping: undefined, data: [] } },
    { method: 'getUsers', response: { data: [] } },
    { method: 'getCatalogEntities', response: { data: [] } },
    { method: 'getTemplates', response: { data: [] } },
    { method: 'getTechdocs', response: { data: [] } },
    { method: 'getPlugins', response: { data: [] } },
    { method: 'getSearches', response: { grouping: undefined, data: [] } },
  ];

  testCases.forEach(({ method, response }) => {
    test(`should ${method} return expected response`, async () => {
      const options: APIsViewOptions = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        type: 'test',
      };
      mockFetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue(response),
      });

      const result = await (
        apiClient[method as keyof AdoptionInsightsApiClient] as Function
      )(options);
      expect(result).toEqual(response);
      expect(mockFetch).toHaveBeenCalled();
    });

    test(`should ${method} return default response if no dates provided`, async () => {
      const options: APIsViewOptions = { type: 'test' };
      const result = await (
        apiClient[method as keyof AdoptionInsightsApiClient] as Function
      )(options);
      expect(result).toEqual(response);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  test('should downloadBlob triggers download with correct URL', async () => {
    const options: APIsViewOptions = {
      start_date: '2025-01-01',
      end_date: '2025-01-31',
      type: 'test',
      format: 'csv',
      blobName: 'test-file.csv',
    };
    const mockBlob = new Blob(['test data'], { type: 'text/csv' });
    mockFetch.mockResolvedValue({
      blob: jest.fn().mockResolvedValue(mockBlob),
    });
    const createElementSpy = jest.spyOn(document, 'createElement');
    const appendChildSpy = jest
      .spyOn(document.body, 'appendChild')
      .mockImplementation();
    const removeChildSpy = jest
      .spyOn(document.body, 'removeChild')
      .mockImplementation();
    const mockLink = document.createElement('a');
    const clickSpy = jest.spyOn(mockLink, 'click');
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
    createElementSpy.mockReturnValue(mockLink);

    await apiClient.downloadBlob(options);

    expect(mockFetch).toHaveBeenCalled();
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockLink.href).toBeTruthy();
    expect(mockLink.download).toBe('test-file.csv');
    expect(clickSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});
