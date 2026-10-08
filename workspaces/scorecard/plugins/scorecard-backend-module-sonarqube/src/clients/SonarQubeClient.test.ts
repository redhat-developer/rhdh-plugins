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

import type { Config } from '@backstage/config';
import { SonarQubeClient } from './SonarQubeClient';
import { mockServices } from '@backstage/backend-test-utils';

const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

describe('SonarQubeClient', () => {
  let config: Config;
  let client: SonarQubeClient;
  let logger: ReturnType<typeof mockServices.logger.mock>;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = mockServices.logger.mock();
    config = mockServices.rootConfig({
      data: {
        sonarqube: {
          baseUrl: 'https://sonarcloud.io',
          apiKey: 'test-key',
        },
      },
    });

    client = new SonarQubeClient(config, logger);
  });

  it('should send Authorization header with base64-encoded Basic auth by default', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projectStatus: { status: 'OK' } }),
    });

    await client.getQualityGateStatus('my-project');

    const expectedToken = Buffer.from('test-key:').toString('base64');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { Authorization: `Basic ${expectedToken}` },
      }),
    );
  });

  describe('getQualityGateStatus', () => {
    it('should return true when quality gate status is OK', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projectStatus: { status: 'OK' } }),
      });

      const result = await client.getQualityGateStatus('my-project');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonarcloud.io/api/qualitygates/project_status?projectKey=my-project',
        expect.any(Object),
      );
    });

    it('should return false when quality gate status is ERROR', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projectStatus: { status: 'ERROR' } }),
      });

      const result = await client.getQualityGateStatus('my-project');

      expect(result).toBe(false);
    });
  });

  describe('getOpenIssuesCount', () => {
    const mockProjectAccessible = () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ component: { key: 'my-project' } }),
      });
    };

    it('should return the total count of open issues', async () => {
      mockProjectAccessible();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 42 }),
      });

      const result = await client.getOpenIssuesCount('my-project');

      expect(result).toBe(42);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://sonarcloud.io/api/components/show?component=my-project',
        expect.any(Object),
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://sonarcloud.io/api/issues/search?componentKeys=my-project&statuses=OPEN,CONFIRMED,REOPENED&ps=1',
        expect.any(Object),
      );
    });

    it('should throw when project access check fails and does not search issues', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(client.getOpenIssuesCount('my-project')).rejects.toThrow(
        "SonarQube project 'my-project' is not accessible or the project key is missing",
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonarcloud.io/api/components/show?component=my-project',
        expect.any(Object),
      );
    });

    it('should propagate API errors from issues search after access check succeeds', async () => {
      mockProjectAccessible();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      await expect(client.getOpenIssuesCount('my-project')).rejects.toThrow(
        /SonarQube API error: 503 Service Unavailable/,
      );
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when the project is accessible and has no open issues', async () => {
      mockProjectAccessible();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          total: 0,
          paging: { pageIndex: 1, pageSize: 1, total: 0 },
        }),
      });

      const result = await client.getOpenIssuesCount('my-project');

      expect(result).toBe(0);
    });

    it('should return the top-level total field from the issues search response', async () => {
      mockProjectAccessible();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          total: 99,
          paging: { pageIndex: 1, pageSize: 1, total: 7 },
        }),
      });

      const result = await client.getOpenIssuesCount('my-project');

      expect(result).toBe(99);
    });
  });

  describe('getMeasures', () => {
    it('should return measures as a record of metric key to number', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          component: {
            measures: [
              { metric: 'security_rating', value: '2.0' },
              { metric: 'vulnerabilities', value: '5' },
            ],
          },
        }),
      });

      const result = await client.getMeasures('my-project', [
        'security_rating',
        'vulnerabilities',
      ]);

      expect(result).toEqual({ security_rating: 2, vulnerabilities: 5 });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonarcloud.io/api/measures/component?component=my-project&metricKeys=security_rating%2Cvulnerabilities',
        expect.any(Object),
      );
    });
  });

  describe('error handling', () => {
    it('should throw when API returns non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(client.getQualityGateStatus('my-project')).rejects.toThrow(
        /SonarQube API error: 401 Unauthorized/,
      );
    });
  });

  it('should strip trailing slash from baseUrl', async () => {
    const configWithSlash = mockServices.rootConfig({
      data: {
        sonarqube: {
          baseUrl: 'https://sonarcloud.io/',
          apiKey: 'test-key',
        },
      },
    });
    const clientWithSlash = new SonarQubeClient(configWithSlash, logger);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projectStatus: { status: 'OK' } }),
    });

    await clientWithSlash.getQualityGateStatus('my-project');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://sonarcloud.io/api/qualitygates/project_status?projectKey=my-project',
      expect.any(Object),
    );
  });

  it('should default baseUrl to https://sonarcloud.io when not configured', async () => {
    const emptyConfig = mockServices.rootConfig({});
    const defaultClient = new SonarQubeClient(emptyConfig, logger);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projectStatus: { status: 'OK' } }),
    });

    await defaultClient.getQualityGateStatus('my-project');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://sonarcloud.io/api/qualitygates/project_status?projectKey=my-project',
      expect.any(Object),
    );
  });

  it('should send no Authorization header when apiKey is not configured', async () => {
    const noKeyConfig = mockServices.rootConfig({
      data: {
        sonarqube: {
          baseUrl: 'https://sonarcloud.io',
        },
      },
    });
    const noKeyClient = new SonarQubeClient(noKeyConfig, logger);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projectStatus: { status: 'OK' } }),
    });

    await noKeyClient.getQualityGateStatus('my-project');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: {} }),
    );
  });

  describe('named instances', () => {
    const multiConfig = mockServices.rootConfig({
      data: {
        sonarqube: {
          baseUrl: 'https://sonarcloud.io',
          apiKey: 'default-key',
          instances: [
            {
              name: 'internal',
              baseUrl: 'https://sonar.internal.com',
              apiKey: 'internal-key',
              authType: 'Bearer',
            },
            {
              name: 'basic-instance',
              baseUrl: 'https://sonar.basic.com',
              apiKey: 'basic-key',
              authType: 'Basic',
            },
            {
              name: 'public',
              baseUrl: 'https://sonarcloud.io',
            },
          ],
        },
      },
    });

    it('should use named instance when instanceName is provided', async () => {
      const multiClient = new SonarQubeClient(multiConfig, logger);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projectStatus: { status: 'OK' } }),
      });

      await multiClient.getQualityGateStatus('my-project', 'internal');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonar.internal.com/api/qualitygates/project_status?projectKey=my-project',
        expect.objectContaining({
          headers: { Authorization: 'Bearer internal-key' },
        }),
      );
    });

    it('should use Basic auth when named instance sets authType Basic', async () => {
      const multiClient = new SonarQubeClient(multiConfig, logger);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projectStatus: { status: 'OK' } }),
      });

      await multiClient.getQualityGateStatus('my-project', 'basic-instance');

      const expectedToken = Buffer.from('basic-key:').toString('base64');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonar.basic.com/api/qualitygates/project_status?projectKey=my-project',
        expect.objectContaining({
          headers: { Authorization: `Basic ${expectedToken}` },
        }),
      );
    });

    it('should use default instance when no instanceName is provided', async () => {
      const multiClient = new SonarQubeClient(multiConfig, logger);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projectStatus: { status: 'OK' } }),
      });

      await multiClient.getQualityGateStatus('my-project');

      const expectedToken = Buffer.from('default-key:').toString('base64');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonarcloud.io/api/qualitygates/project_status?projectKey=my-project',
        expect.objectContaining({
          headers: { Authorization: `Basic ${expectedToken}` },
        }),
      );
    });

    it('should throw when named instance is not found', async () => {
      const multiClient = new SonarQubeClient(multiConfig, logger);

      await expect(
        multiClient.getQualityGateStatus('my-project', 'unknown'),
      ).rejects.toThrow(
        "SonarQube instance 'unknown' not found in configuration",
      );
    });

    it('should throw when instanceName is set but instances array is absent', async () => {
      const noInstancesClient = new SonarQubeClient(config, logger);

      await expect(
        noInstancesClient.getQualityGateStatus('my-project', 'unknown'),
      ).rejects.toThrow(
        "SonarQube instance 'unknown' not found in configuration",
      );
    });

    it('should send no Authorization header for instance without apiKey', async () => {
      const multiClient = new SonarQubeClient(multiConfig, logger);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projectStatus: { status: 'OK' } }),
      });

      await multiClient.getQualityGateStatus('my-project', 'public');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ headers: {} }),
      );
    });
  });
});
