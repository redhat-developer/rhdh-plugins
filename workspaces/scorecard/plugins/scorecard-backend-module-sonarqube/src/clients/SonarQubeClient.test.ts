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

import { ConfigReader } from '@backstage/config';
import { SonarQubeClient } from './SonarQubeClient';
import { mockServices } from '@backstage/backend-test-utils';

const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

describe('SonarQubeClient', () => {
  const config = new ConfigReader({
    sonarqube: {
      baseUrl: 'https://sonarcloud.io',
      apiKey: 'test-key',
    },
  });
  const logger = mockServices.logger.mock();

  let client: SonarQubeClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new SonarQubeClient(config, logger);
  });

  it('sends Authorization header with base64-encoded Basic auth by default', async () => {
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
    it('returns true when quality gate status is OK', async () => {
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

    it('returns false when quality gate status is ERROR', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projectStatus: { status: 'ERROR' } }),
      });

      const result = await client.getQualityGateStatus('my-project');

      expect(result).toBe(false);
    });
  });

  describe('getOpenIssuesCount', () => {
    it('returns the total count of open issues', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 42 }),
      });

      const result = await client.getOpenIssuesCount('my-project');

      expect(result).toBe(42);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://sonarcloud.io/api/issues/search?componentKeys=my-project&statuses=OPEN,CONFIRMED,REOPENED&ps=1',
        expect.any(Object),
      );
    });
  });

  describe('getMeasures', () => {
    it('returns measures as a record of metric key to number', async () => {
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
    it('throws when API returns non-OK response', async () => {
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

  it('strips trailing slash from baseUrl', () => {
    const configWithSlash = new ConfigReader({
      sonarqube: {
        baseUrl: 'https://sonarcloud.io/',
        apiKey: 'test-key',
      },
    });
    const clientWithSlash = new SonarQubeClient(configWithSlash, logger);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projectStatus: { status: 'OK' } }),
    });

    clientWithSlash.getQualityGateStatus('my-project');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://sonarcloud.io/api/qualitygates/project_status?projectKey=my-project',
      expect.any(Object),
    );
  });

  it('defaults baseUrl to https://sonarcloud.io when not configured', async () => {
    const emptyConfig = new ConfigReader({});
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

  it('sends no Authorization header when apiKey is not configured', async () => {
    const noKeyConfig = new ConfigReader({
      sonarqube: { baseUrl: 'https://sonarcloud.io' },
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
    const multiConfig = new ConfigReader({
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
            name: 'public',
            baseUrl: 'https://sonarcloud.io',
          },
        ],
      },
    });

    it('uses named instance when instanceName is provided', async () => {
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

    it('uses default instance when no instanceName is provided', async () => {
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

    it('throws when named instance is not found', async () => {
      const multiClient = new SonarQubeClient(multiConfig, logger);

      await expect(
        multiClient.getQualityGateStatus('my-project', 'unknown'),
      ).rejects.toThrow(
        "SonarQube instance 'unknown' not found in configuration",
      );
    });

    it('sends no Authorization header for instance without apiKey', async () => {
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
