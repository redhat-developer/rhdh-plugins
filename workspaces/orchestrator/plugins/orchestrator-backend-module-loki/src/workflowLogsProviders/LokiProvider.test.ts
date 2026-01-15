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
import { ProcessInstanceDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';
import { LokiProvider } from './LokiProvider';
import mockWorkflowLog from '../../__fixtures__/mockWorkflowLogs';

describe('LokiProvider', () => {
  describe('FromConfig', () => {
    it('should create a provider when there is an entry in the app-config', () => {
      const lokiAppConfig = {
        orchestrator: {
          workflowLogProvider: {
            loki: {
              baseUrl: 'http://localhost:3100',
            },
          },
        },
      };

      const lokiConfig = new ConfigReader(lokiAppConfig);
      const provider = LokiProvider.fromConfig(lokiConfig);

      // Test for the baseUrl
      expect(provider.getBaseURL()).toEqual(
        lokiAppConfig.orchestrator.workflowLogProvider.loki.baseUrl,
      );
      // Test the providerId
      expect(provider.getProviderId()).toEqual('loki');

      // Test the selectors passed in
      // Should be an empty array when nothing is passed in
      expect(provider.getSelectors()).toEqual([]);
    });
    it('should create a provider with custom selectors', () => {
      const lokiAppConfig = {
        orchestrator: {
          workflowLogProvider: {
            loki: {
              baseUrl: 'http://localhost:3100',
              logStreamSelectors: [
                {
                  label: 'custom-selector',
                  value: '=~".+"',
                },
                {
                  label: 'custom-selector1',
                  value: '=~".+"',
                },
              ],
            },
          },
        },
      };

      const lokiConfig = new ConfigReader(lokiAppConfig);
      const provider = LokiProvider.fromConfig(lokiConfig);

      // Test the selectors passed in
      expect(provider.getSelectors()[0]).toEqual(
        lokiAppConfig.orchestrator.workflowLogProvider.loki
          .logStreamSelectors[0],
      );
      expect(provider.getSelectors()[1]).toEqual(
        lokiAppConfig.orchestrator.workflowLogProvider.loki
          .logStreamSelectors[1],
      );
    });
  });
  describe('fetchWorkflowLogsByInstance', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('should pass with defaults', async () => {
      const mockResponse: Partial<Response> = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockWorkflowLog),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      const lokiAppConfig = {
        orchestrator: {
          workflowLogProvider: {
            loki: {
              baseUrl: 'http://localhost:3100',
            },
          },
        },
      };

      const lokiConfig = new ConfigReader(lokiAppConfig);
      const provider = LokiProvider.fromConfig(lokiConfig);
      const workflowInstance: ProcessInstanceDTO = {
        id: '12345',
        processId: '54321',
        start: '2025-12-05T16:35:13.621Z',
        end: '',
        nodes: [],
      };

      const urlToFetch =
        'http://localhost:3100/loki/api/v1/query_range?query=%7Bservice_name%3D%7E%22.%2B%22%7D+%7C%3D%2212345%22&start=2025-12-05T16%3A30%3A13.621Z&end=2026-01-03T16%3A35%3A13.621Z';
      const workflowLogs =
        await provider.fetchWorkflowLogsByInstance(workflowInstance);

      const parsedURLToFetch = new URL(urlToFetch);
      expect(fetch).toHaveBeenCalledWith(urlToFetch);
      expect(parsedURLToFetch.origin).toEqual(provider.getBaseURL());
      expect(parsedURLToFetch.pathname).toEqual('/loki/api/v1/query_range');
      expect(parsedURLToFetch.searchParams.get('end')).toEqual(
        '2026-01-03T16:35:13.621Z',
      );
      expect(parsedURLToFetch.searchParams.get('start')).toEqual(
        '2025-12-05T16:30:13.621Z',
      ); // should be 5 minutes before
      expect(parsedURLToFetch.searchParams.get('query')).toEqual(
        `{service_name=~".+"} |="${workflowInstance.id}"`,
      );
      expect(workflowLogs).toHaveProperty('instanceId', workflowInstance.id);
      expect(workflowLogs).toHaveProperty('logs');
      expect(workflowLogs.logs.length).toEqual(8);

      expect(workflowLogs.logs[0]).toHaveProperty('id');
      expect(workflowLogs.logs[0]).toHaveProperty('log');
      // Sorted correctly, this id is the last in the mockdata and should be first when returned
      expect(workflowLogs.logs[0].id).toEqual('1764952546327102000');
    });

    it('should have an enddate that had 5 minutes added to it', async () => {
      const mockResponse: Partial<Response> = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockWorkflowLog),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      const lokiAppConfig = {
        orchestrator: {
          workflowLogProvider: {
            loki: {
              baseUrl: 'http://localhost:3100',
            },
          },
        },
      };

      const lokiConfig = new ConfigReader(lokiAppConfig);
      const provider = LokiProvider.fromConfig(lokiConfig);
      const workflowInstance: ProcessInstanceDTO = {
        id: '12345',
        processId: '54321',
        start: '2025-12-05T16:35:13.621Z',
        end: '2025-12-05T17:35:13.621Z',
        nodes: [],
      };

      const urlToFetch =
        'http://localhost:3100/loki/api/v1/query_range?query=%7Bservice_name%3D%7E%22.%2B%22%7D+%7C%3D%2212345%22&start=2025-12-05T16%3A30%3A13.621Z&end=2025-12-05T17%3A40%3A13.621Z';

      await provider.fetchWorkflowLogsByInstance(workflowInstance);
      const parsedURLToFetch = new URL(urlToFetch);
      expect(fetch).toHaveBeenCalledWith(urlToFetch);
      expect(parsedURLToFetch.searchParams.get('end')).toEqual(
        '2025-12-05T17:40:13.621Z',
      ); // Should be 5 minutes after
    });

    it('should have a custom log selector and filter', async () => {
      const mockResponse: Partial<Response> = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockWorkflowLog),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      const lokiAppConfig = {
        orchestrator: {
          workflowLogProvider: {
            loki: {
              baseUrl: 'http://localhost:3100',
              logStreamSelectors: [
                {
                  label: 'custom-selector',
                  value: '=~".+"',
                },
                {
                  label: 'custom-selector1',
                  value: '=~".+"',
                },
              ],
            },
          },
        },
      };

      const lokiConfig = new ConfigReader(lokiAppConfig);
      const provider = LokiProvider.fromConfig(lokiConfig);
      const workflowInstance: ProcessInstanceDTO = {
        id: '12345',
        processId: '54321',
        start: '2025-12-05T16:35:13.621Z',
        end: '',
        nodes: [],
      };

      const urlToFetch =
        'http://localhost:3100/loki/api/v1/query_range?query=%7Bcustom-selector%3D%7E%22.%2B%22%2Ccustom-selector1%3D%7E%22.%2B%22%7D+%7C%3D%2212345%22&start=2025-12-05T16%3A30%3A13.621Z&end=2026-01-03T16%3A35%3A13.621Z';

      await provider.fetchWorkflowLogsByInstance(workflowInstance);

      const parsedURLToFetch = new URL(urlToFetch);
      expect(fetch).toHaveBeenCalledWith(urlToFetch);
      expect(parsedURLToFetch.origin).toEqual(provider.getBaseURL());
      expect(parsedURLToFetch.pathname).toEqual('/loki/api/v1/query_range');
      expect(parsedURLToFetch.searchParams.get('query')).toEqual(
        `{custom-selector=~".+",custom-selector1=~".+"} |="${workflowInstance.id}"`,
      );
    });

    it('should have a custom log selector and filter, no label and no value, use defaults', async () => {
      const mockResponse: Partial<Response> = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockWorkflowLog),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      const lokiAppConfig = {
        orchestrator: {
          workflowLogProvider: {
            loki: {
              baseUrl: 'http://localhost:3100',
              logStreamSelectors: [
                {
                  value: '=~".+"',
                },
                {
                  label: 'custom-selector1',
                },
              ],
            },
          },
        },
      };

      const lokiConfig = new ConfigReader(lokiAppConfig);
      const provider = LokiProvider.fromConfig(lokiConfig);
      const workflowInstance: ProcessInstanceDTO = {
        id: '12345',
        processId: '54321',
        start: '2025-12-05T16:35:13.621Z',
        end: '',
        nodes: [],
      };

      const urlToFetch =
        'http://localhost:3100/loki/api/v1/query_range?query=%7Bservice_name%3D%7E%22.%2B%22%2Ccustom-selector1%3D%7E%22.%2B%22%7D+%7C%3D%2212345%22&start=2025-12-05T16%3A30%3A13.621Z&end=2026-01-03T16%3A35%3A13.621Z';

      await provider.fetchWorkflowLogsByInstance(workflowInstance);
      const parsedURLToFetch = new URL(urlToFetch);
      expect(fetch).toHaveBeenCalledWith(urlToFetch);
      expect(parsedURLToFetch.origin).toEqual(provider.getBaseURL());
      expect(parsedURLToFetch.pathname).toEqual('/loki/api/v1/query_range');
      expect(parsedURLToFetch.searchParams.get('query')).toEqual(
        `{service_name=~".+",custom-selector1=~".+"} |="${workflowInstance.id}"`,
      );
    });
  });
});
