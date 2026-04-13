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

import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { DcmBaseClient } from './DcmBaseClient';
import { DcmClientError } from '../errors/DcmClientError';

/** Minimal concrete subclass that exposes the protected fetch for testing. */
class TestClient extends DcmBaseClient {
  protected readonly serviceName = 'Test';

  async getItem(path: string): Promise<unknown> {
    return this.fetch(path);
  }

  async postItem(path: string, body: unknown): Promise<unknown> {
    return this.fetch(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

function makeClient(fetchFn: jest.Mock) {
  const discoveryApi: DiscoveryApi = {
    getBaseUrl: jest.fn().mockResolvedValue('http://localhost/api/dcm'),
  };
  const fetchApi: FetchApi = { fetch: fetchFn };
  return new TestClient({ discoveryApi, fetchApi });
}

describe('DcmBaseClient', () => {
  it('constructs the proxy URL correctly', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ id: '1' }),
    });
    const client = makeClient(fetchFn);
    await client.getItem('providers/abc');

    expect(fetchFn).toHaveBeenCalledWith(
      'http://localhost/api/dcm/proxy/providers/abc',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('returns undefined for 204 No Content', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ status: 204, ok: true });
    const client = makeClient(fetchFn);
    const result = await client.getItem('resources/x');
    expect(result).toBeUndefined();
  });

  it('throws DcmClientError on non-OK response', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      status: 404,
      ok: false,
      text: async () => '{"title":"Not Found","detail":"provider not found"}',
    });
    const client = makeClient(fetchFn);

    await expect(client.getItem('providers/missing')).rejects.toBeInstanceOf(
      DcmClientError,
    );
  });

  it('DcmClientError carries the HTTP status code', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      status: 422,
      ok: false,
      text: async () => '{"title":"Unprocessable","detail":"invalid spec"}',
    });
    const client = makeClient(fetchFn);

    let error: DcmClientError | undefined;
    try {
      await client.getItem('catalog-items/x');
    } catch (e) {
      error = e as DcmClientError;
    }

    expect(error?.status).toBe(422);
  });

  it('DcmClientError parses structured apiError from RFC 7807 JSON body', async () => {
    const body = { title: 'Conflict', detail: 'already exists', status: 409 };
    const fetchFn = jest.fn().mockResolvedValue({
      status: 409,
      ok: false,
      text: async () => JSON.stringify(body),
    });
    const client = makeClient(fetchFn);

    let error: DcmClientError | undefined;
    try {
      await client.getItem('providers/dup');
    } catch (e) {
      error = e as DcmClientError;
    }

    expect(error?.apiError?.title).toBe('Conflict');
    expect(error?.apiError?.detail).toBe('already exists');
  });

  it('DcmClientError.apiError is undefined for non-JSON error bodies', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      status: 503,
      ok: false,
      text: async () => 'Service Unavailable',
    });
    const client = makeClient(fetchFn);

    let error: DcmClientError | undefined;
    try {
      await client.getItem('providers');
    } catch (e) {
      error = e as DcmClientError;
    }

    expect(error?.apiError).toBeUndefined();
    expect(error?.message).toContain('503');
  });

  it('merges caller-provided headers with the default Content-Type', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({}),
    });
    const client = makeClient(fetchFn);
    await client.postItem('catalog-items/x', { name: 'test' });

    const calledHeaders = fetchFn.mock.calls[0][1].headers;
    expect(calledHeaders['Content-Type']).toBe('application/json');
  });
});
