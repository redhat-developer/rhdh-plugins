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

import { ConfigApi } from '@backstage/core-plugin-api';
import { AnsibleBackendClient } from '../AnsibleBackendClient';
import { SecureFetchApi } from '../SecureFetchClient';

// Helper to create a mock Response object
const createMockResponse = (options: {
  ok: boolean;
  status?: number;
  statusText?: string;
  json?: () => Promise<any>;
}): Response => {
  const { ok, status = 200, statusText = '', json } = options;
  return {
    ok,
    status,
    statusText,
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: 'http://mock',
    json: json || (() => Promise.resolve({})),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    bodyUsed: false,
    body: null,
    clone: function () {
      return this;
    },
  } as Response;
};

describe('AnsibleBackendClient', () => {
  let mockConfigApi: jest.Mocked<ConfigApi>;
  let mockSecureFetchApi: jest.Mocked<SecureFetchApi>;
  let client: AnsibleBackendClient;
  const testNamespace = 'test-namespace';
  const mockKubeApi = 'http://kube-api';

  beforeEach(() => {
    mockConfigApi = {
      getString: jest.fn(),
      getOptionalString: jest.fn(),
    } as any;

    mockSecureFetchApi = {
      fetch: jest.fn(),
    } as any;

    client = new AnsibleBackendClient({
      configApi: mockConfigApi,
      secureFetchApi: mockSecureFetchApi,
    });

    mockConfigApi.getString.mockReturnValue(mockKubeApi);
  });

  describe('getAAP', () => {
    it('should return AAP data on successful response', async () => {
      const mockData = { name: 'sandbox-aap', status: 'Running' };
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
          json: () => Promise.resolve(mockData),
        }),
      );

      const result = await client.getAAP(testNamespace);
      expect(result).toEqual(mockData);
      expect(mockSecureFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/apis/aap.ansible.com/v1alpha1/namespaces/${testNamespace}/ansibleautomationplatforms`,
        ),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should throw error on unsuccessful response', async () => {
      const errorData = { message: 'Not found' };
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 404,
          json: () => Promise.resolve(errorData),
        }),
      );

      await expect(client.getAAP(testNamespace)).rejects.toThrow();
    });
  });

  describe('createAAP', () => {
    const aapObject = '"kind":"AnsibleAutomationPlatform"';

    it('should successfully create AAP', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
        }),
      );

      await expect(client.createAAP(testNamespace)).resolves.not.toThrow();
      expect(mockSecureFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/apis/aap.ansible.com/v1alpha1/namespaces/${testNamespace}/ansibleautomationplatforms`,
        ),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(aapObject),
          headers: {
            'Content-Type': 'application/yaml',
          },
        }),
      );
    });

    it('should not throw error on 409 Conflict response', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 409,
        }),
      );

      await expect(client.createAAP(testNamespace)).resolves.not.toThrow();
    });

    it('should throw error on other unsuccessful responses', async () => {
      const errorData = { message: 'Internal error' };
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 500,
          json: () => Promise.resolve(errorData),
        }),
      );

      await expect(client.createAAP(testNamespace)).rejects.toThrow();
    });
  });

  describe('unIdleAAP', () => {
    it('should successfully unidle AAP', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
        }),
      );

      await expect(client.unIdleAAP(testNamespace)).resolves.not.toThrow();
      expect(mockSecureFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/apis/aap.ansible.com/v1alpha1/namespaces/${testNamespace}/ansibleautomationplatforms/sandbox-aap`,
        ),
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/merge-patch+json',
          },
          body: JSON.stringify({
            spec: {
              idle_aap: false,
            },
          }),
        }),
      );
    });

    it('should throw error on unsuccessful response', async () => {
      const errorData = { message: 'Failed to unidle' };
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 400,
          json: () => Promise.resolve(errorData),
        }),
      );

      await expect(client.unIdleAAP(testNamespace)).rejects.toThrow();
    });
  });

  describe('deleteAAPCR', () => {
    it('should successfully delete AAP CR', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
        }),
      );

      await expect(client.deleteAAPCR(testNamespace)).resolves.not.toThrow();
      expect(mockSecureFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `/apis/aap.ansible.com/v1alpha1/namespaces/${testNamespace}/ansibleautomationplatforms/sandbox-aap`,
        ),
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });

    it('should not throw error on 404 Not Found response', async () => {
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 404,
        }),
      );

      await expect(client.deleteAAPCR(testNamespace)).resolves.not.toThrow();
    });

    it('should throw error on other unsuccessful responses', async () => {
      const errorData = { message: 'Internal error' };
      mockSecureFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 500,
          json: () => Promise.resolve(errorData),
        }),
      );

      await expect(client.deleteAAPCR(testNamespace)).rejects.toThrow();
    });
  });
});
