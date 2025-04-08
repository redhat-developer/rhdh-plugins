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
import { OAuthApi } from '@backstage/core-plugin-api';
import { fetchWithAuth } from '../fetch-utils';

// Mock the global fetch function
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock OAuthApi
const mockOAuthApi: jest.Mocked<OAuthApi> = {
  getAccessToken: jest.fn(),
};

describe('fetchWithAuth', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockFetch.mockResolvedValue(new Response('Success', { status: 200 })); // Default success response
  });

  it('should add Authorization header when token is available', async () => {
    const mockToken = 'test-token-123';
    mockOAuthApi.getAccessToken.mockResolvedValue(mockToken);
    const url = 'https://example.com/api/data';
    const init: RequestInit = { method: 'GET' };

    await fetchWithAuth(mockOAuthApi, url, init);

    expect(mockOAuthApi.getAccessToken).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchCallArgs = mockFetch.mock.calls[0];
    expect(fetchCallArgs[0]).toBe(url);
    expect(fetchCallArgs[1]).toBeDefined();
    const headers = new Headers(fetchCallArgs[1]?.headers);
    expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    expect(fetchCallArgs[1]?.method).toBe('GET'); // Ensure original init is preserved
  });

  it('should not add Authorization header when token is not available', async () => {
    mockOAuthApi.getAccessToken.mockResolvedValue(''); // Simulate no token (empty string)
    const url = 'https://example.com/api/other';

    await fetchWithAuth(mockOAuthApi, url);

    expect(mockOAuthApi.getAccessToken).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchCallArgs = mockFetch.mock.calls[0];
    expect(fetchCallArgs[0]).toBe(url);
    expect(fetchCallArgs[1]).toBeDefined();
    const headers = new Headers(fetchCallArgs[1]?.headers);
    expect(headers.has('Authorization')).toBe(false);
  });

  it('should merge existing headers with Authorization header', async () => {
    const mockToken = 'test-token-456';
    mockOAuthApi.getAccessToken.mockResolvedValue(mockToken);
    const url = 'https://example.com/api/resource';
    const init: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value',
      },
      body: JSON.stringify({ key: 'value' }),
    };

    await fetchWithAuth(mockOAuthApi, url, init);

    expect(mockOAuthApi.getAccessToken).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchCallArgs = mockFetch.mock.calls[0];
    expect(fetchCallArgs[0]).toBe(url);
    expect(fetchCallArgs[1]).toBeDefined();
    const headers = new Headers(fetchCallArgs[1]?.headers);
    expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-Custom-Header')).toBe('custom-value');
    expect(fetchCallArgs[1]?.method).toBe('POST');
    expect(fetchCallArgs[1]?.body).toBe(JSON.stringify({ key: 'value' }));
  });

  it('should handle fetch errors', async () => {
    const mockToken = 'test-token-789';
    mockOAuthApi.getAccessToken.mockResolvedValue(mockToken);
    const url = 'https://example.com/api/error';
    const mockError = new Error('Network Error');
    mockFetch.mockRejectedValue(mockError); // Simulate fetch failure

    await expect(fetchWithAuth(mockOAuthApi, url)).rejects.toThrow(
      'Network Error',
    );

    expect(mockOAuthApi.getAccessToken).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchCallArgs = mockFetch.mock.calls[0];
    expect(fetchCallArgs[0]).toBe(url);
    const headers = new Headers(fetchCallArgs[1]?.headers);
    expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
  });

  it('should return the response object on successful fetch', async () => {
    const mockToken = 'test-token-abc';
    mockOAuthApi.getAccessToken.mockResolvedValue(mockToken);
    const url = 'https://example.com/api/success';
    const mockResponse = new Response('Data fetched', { status: 200 });
    mockFetch.mockResolvedValue(mockResponse);

    const response = await fetchWithAuth(mockOAuthApi, url);

    expect(response).toBe(mockResponse);
    expect(await response.text()).toBe('Data fetched');
    expect(response.status).toBe(200);
  });
});
