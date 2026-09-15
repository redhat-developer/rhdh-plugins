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

import { LearningPathApiClient } from './LearningPathApiClient';

describe('LearningPathApiClient', () => {
  const discoveryApi = {
    getBaseUrl: jest.fn().mockResolvedValue('http://localhost:7007/api/proxy'),
  };
  const configApi = {
    getOptionalString: jest.fn(),
  };
  const identityApi = {
    getCredentials: jest.fn().mockResolvedValue({ token: 'test-token' }),
  };

  const learningPathData = [
    {
      label: 'Building Operators on OpenShift',
      url: 'https://developers.redhat.com/learn/openshift/operators',
      paths: 6,
      minutes: 20,
      description: 'Learn about k8s API fundamentals',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    configApi.getOptionalString.mockReturnValue(undefined);
    identityApi.getCredentials.mockResolvedValue({ token: 'test-token' });
  });

  it('fetches learning paths from the default developer hub proxy path', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(learningPathData), { status: 200 }),
    );

    const client = new LearningPathApiClient({
      discoveryApi: discoveryApi as any,
      configApi: configApi as any,
      identityApi: identityApi as any,
    });

    await expect(client.getLearningPathData()).resolves.toEqual(
      learningPathData,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:7007/api/proxy/developer-hub/learning-paths',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      },
    );
  });

  it('uses a configured developer hub proxy path', async () => {
    configApi.getOptionalString.mockReturnValue('/custom-hub');
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(learningPathData), { status: 200 }),
    );

    const client = new LearningPathApiClient({
      discoveryApi: discoveryApi as any,
      configApi: configApi as any,
      identityApi: identityApi as any,
    });

    await client.getLearningPathData();

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:7007/api/proxy/custom-hub/learning-paths',
      expect.any(Object),
    );
  });

  it('omits the authorization header when no identity token is available', async () => {
    identityApi.getCredentials.mockResolvedValue({ token: undefined });
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(learningPathData), { status: 200 }),
    );

    const client = new LearningPathApiClient({
      discoveryApi: discoveryApi as any,
      configApi: configApi as any,
      identityApi: identityApi as any,
    });

    await client.getLearningPathData();

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:7007/api/proxy/developer-hub/learning-paths',
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('throws when the proxy request fails', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('Not Found', { status: 404 }));

    const client = new LearningPathApiClient({
      discoveryApi: discoveryApi as any,
      configApi: configApi as any,
      identityApi: identityApi as any,
    });

    await expect(client.getLearningPathData()).rejects.toThrow(
      'failed to fetch data, status 404:',
    );
  });

  it('throws when the proxy response is not an array', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), { status: 200 }),
    );

    const client = new LearningPathApiClient({
      discoveryApi: discoveryApi as any,
      configApi: configApi as any,
      identityApi: identityApi as any,
    });

    await expect(client.getLearningPathData()).rejects.toThrow(
      'expected learning paths response to be an array',
    );
  });

  it('throws when a learning path entry is missing required fields', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ label: 'Missing url', paths: 1 }]), {
        status: 200,
      }),
    );

    const client = new LearningPathApiClient({
      discoveryApi: discoveryApi as any,
      configApi: configApi as any,
      identityApi: identityApi as any,
    });

    await expect(client.getLearningPathData()).rejects.toThrow(
      'learning path at index 0 is missing a valid url',
    );
  });
});
