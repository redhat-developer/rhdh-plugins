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
import { fetch as undiciFetch } from 'undici';

import { LokiProvider } from './LokiProvider';
import mockWorkflowLog from '../../__fixtures__/mockWorkflowLogs';

jest.mock('undici', () => ({
  ...jest.requireActual('undici'),
  fetch: jest.fn(),
}));

describe('LokiProvider', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  describe('FromConfig', () => {
    it('should create a provider when there is an entry in the app-config', () => {
      const lokiAppConfig = {
        orchestrator: {
          workflowLogProvider: {
            loki: {
              baseUrl: 'http://localhost:3100',
              token: 'notsecret',
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

      // Test the token passed in
      expect(provider.getToken()).toEqual('notsecret');

      // Test the default rejectUnauthorized value
      expect(provider.getRejectUnauthorized()).toEqual(true);
    });
    it('should create a provider with custom selectors', () => {
      const lokiAppConfig = {
        orchestrator: {
          workflowLogProvider: {
            loki: {
              baseUrl: 'http://localhost:3100',
              token: 'notsecret',
              rejectUnauthorized: false,
              logStreamSelectors: [
                {
                  label: 'custom_selector',
                  value: '=~".+"',
                },
                {
                  label: 'custom_selector1',
                },
              ],
            },
          },
        },
      };

      const lokiConfig = new ConfigReader(lokiAppConfig);
      const provider = LokiProvider.fromConfig(lokiConfig);

      // Test the rejectUnauthorized value when set to false
      expect(provider.getRejectUnauthorized()).toEqual(false);

      // Test the selectors passed in (defaults merged at parse time)
      expect(provider.getSelectors()[0]).toEqual(
        lokiAppConfig.orchestrator.workflowLogProvider.loki
          .logStreamSelectors[0],
      );
      expect(provider.getSelectors()[1]).toEqual({
        label: 'custom_selector1',
        value: '="application"',
      });
    });

    it('rejects logStreamSelectors with an invalid label name', () => {
      expect(() =>
        LokiProvider.fromConfig(
          new ConfigReader({
            orchestrator: {
              workflowLogProvider: {
                loki: {
                  baseUrl: 'http://localhost:3100',
                  token: 't',
                  logStreamSelectors: [
                    { label: 'bad-label', value: '="application"' },
                  ],
                },
              },
            },
          }),
        ),
      ).toThrow(/Prometheus label name rules/);
    });

    it('rejects logStreamSelectors with an unsafe value fragment', () => {
      expect(() =>
        LokiProvider.fromConfig(
          new ConfigReader({
            orchestrator: {
              workflowLogProvider: {
                loki: {
                  baseUrl: 'http://localhost:3100',
                  token: 't',
                  logStreamSelectors: [
                    {
                      label: 'app',
                      value: '="unclosed',
                    },
                  ],
                },
              },
            },
          }),
        ),
      ).toThrow(/LogQL label matcher/);
    });

    it('rejects logPipelineFilters containing closing brace', () => {
      expect(() =>
        LokiProvider.fromConfig(
          new ConfigReader({
            orchestrator: {
              workflowLogProvider: {
                loki: {
                  baseUrl: 'http://localhost:3100',
                  token: 't',
                  logPipelineFilters: ['| json }'],
                },
              },
            },
          }),
        ),
      ).toThrow(/must not contain "\}"/);
    });

    it('rejects logPipelineFilters containing opening brace', () => {
      expect(() =>
        LokiProvider.fromConfig(
          new ConfigReader({
            orchestrator: {
              workflowLogProvider: {
                loki: {
                  baseUrl: 'http://localhost:3100',
                  token: 't',
                  logPipelineFilters: ['| pattern `{stream}`'],
                },
              },
            },
          }),
        ),
      ).toThrow(/must not contain "\{"/);
    });

    it('rejects a negative limit', () => {
      expect(() =>
        LokiProvider.fromConfig(
          new ConfigReader({
            orchestrator: {
              workflowLogProvider: {
                loki: {
                  baseUrl: 'http://localhost:3100',
                  token: 't',
                  limit: -1,
                },
              },
            },
          }),
        ),
      ).toThrow(/limit must not be negative/);
    });

    describe('baseUrl validation', () => {
      afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
      });

      it('normalizes a trailing slash on baseUrl', () => {
        const lokiAppConfig = {
          orchestrator: {
            workflowLogProvider: {
              loki: {
                baseUrl: 'http://localhost:3100/',
                token: 'notsecret',
              },
            },
          },
        };
        const provider = LokiProvider.fromConfig(
          new ConfigReader(lokiAppConfig),
        );
        expect(provider.getBaseURL()).toEqual('http://localhost:3100');
      });

      it('rejects an empty baseUrl', () => {
        expect(() =>
          LokiProvider.fromConfig(
            new ConfigReader({
              orchestrator: {
                workflowLogProvider: {
                  loki: { baseUrl: '  ', token: 't' },
                },
              },
            }),
          ),
        ).toThrow(/must not be empty/);
      });

      it('rejects a non-absolute baseUrl', () => {
        expect(() =>
          LokiProvider.fromConfig(
            new ConfigReader({
              orchestrator: {
                workflowLogProvider: {
                  loki: { baseUrl: 'not-a-url', token: 't' },
                },
              },
            }),
          ),
        ).toThrow(/valid absolute URL/);
      });

      it('rejects embedded credentials in baseUrl', () => {
        expect(() =>
          LokiProvider.fromConfig(
            new ConfigReader({
              orchestrator: {
                workflowLogProvider: {
                  loki: {
                    baseUrl: 'http://user:pass@localhost:3100',
                    token: 't',
                  },
                },
              },
            }),
          ),
        ).toThrow(/credentials/);
      });

      it('rejects query or fragment on baseUrl', () => {
        expect(() =>
          LokiProvider.fromConfig(
            new ConfigReader({
              orchestrator: {
                workflowLogProvider: {
                  loki: {
                    baseUrl: 'http://localhost:3100?x=1',
                    token: 't',
                  },
                },
              },
            }),
          ),
        ).toThrow(/query or fragment/);
      });

      it('rejects non-http(s) schemes', () => {
        expect(() =>
          LokiProvider.fromConfig(
            new ConfigReader({
              orchestrator: {
                workflowLogProvider: {
                  loki: { baseUrl: 'ftp://localhost:3100', token: 't' },
                },
              },
            }),
          ),
        ).toThrow(/http:/);
      });

      it('rejects http baseUrl in production unless allowInsecureHttp', () => {
        process.env.NODE_ENV = 'production';
        expect(() =>
          LokiProvider.fromConfig(
            new ConfigReader({
              orchestrator: {
                workflowLogProvider: {
                  loki: {
                    baseUrl: 'http://loki.example.com',
                    token: 't',
                  },
                },
              },
            }),
          ),
        ).toThrow(/https in production/);
      });

      it('allows http in production when allowInsecureHttp is true', () => {
        process.env.NODE_ENV = 'production';
        const provider = LokiProvider.fromConfig(
          new ConfigReader({
            orchestrator: {
              workflowLogProvider: {
                loki: {
                  baseUrl: 'http://loki.example.com',
                  token: 't',
                  allowInsecureHttp: true,
                },
              },
            },
          }),
        );
        expect(provider.getBaseURL()).toEqual('http://loki.example.com');
      });

      it('allows https in production', () => {
        process.env.NODE_ENV = 'production';
        const provider = LokiProvider.fromConfig(
          new ConfigReader({
            orchestrator: {
              workflowLogProvider: {
                loki: {
                  baseUrl: 'https://loki.example.com',
                  token: 't',
                },
              },
            },
          }),
        );
        expect(provider.getBaseURL()).toEqual('https://loki.example.com');
      });

      it('rejects hostname not in allowedHosts', () => {
        expect(() =>
          LokiProvider.fromConfig(
            new ConfigReader({
              orchestrator: {
                workflowLogProvider: {
                  loki: {
                    baseUrl: 'https://evil.example.com',
                    token: 't',
                    allowedHosts: ['loki.example.com'],
                  },
                },
              },
            }),
          ),
        ).toThrow(/not allowed by allowedHosts/);
      });

      it('allows exact hostname from allowedHosts', () => {
        const provider = LokiProvider.fromConfig(
          new ConfigReader({
            orchestrator: {
              workflowLogProvider: {
                loki: {
                  baseUrl: 'https://loki.example.com',
                  token: 't',
                  allowedHosts: ['loki.example.com'],
                },
              },
            },
          }),
        );
        expect(provider.getBaseURL()).toEqual('https://loki.example.com');
      });

      it('allows subdomain suffix when allowedHosts entry starts with a dot', () => {
        const provider = LokiProvider.fromConfig(
          new ConfigReader({
            orchestrator: {
              workflowLogProvider: {
                loki: {
                  baseUrl: 'https://loki.prod.example.com',
                  token: 't',
                  allowedHosts: ['.example.com'],
                },
              },
            },
          }),
        );
        expect(provider.getBaseURL()).toEqual('https://loki.prod.example.com');
      });
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
      jest.mocked(undiciFetch).mockResolvedValue(mockResponse as any);

      const lokiAppConfig = {
        orchestrator: {
          workflowLogProvider: {
            loki: {
              baseUrl: 'http://localhost:3100',
              token: 'notsecret',
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
        'http://localhost:3100/loki/api/v1/query_range?query=%7Bopenshift_log_type%3D%22application%22%7D+%7C%3D%2212345%22&start=2025-12-05T16%3A30%3A13.621Z&end=2026-01-03T16%3A35%3A13.621Z&limit=100';
      const workflowLogs =
        await provider.fetchWorkflowLogsByInstance(workflowInstance);

      const parsedURLToFetch = new URL(urlToFetch);
      expect(parsedURLToFetch.origin).toEqual(provider.getBaseURL());
      expect(parsedURLToFetch.pathname).toEqual('/loki/api/v1/query_range');
      expect(parsedURLToFetch.searchParams.get('end')).toEqual(
        '2026-01-03T16:35:13.621Z',
      );
      expect(parsedURLToFetch.searchParams.get('start')).toEqual(
        '2025-12-05T16:30:13.621Z',
      ); // should be 5 minutes before
      expect(parsedURLToFetch.searchParams.get('query')).toEqual(
        `{openshift_log_type="application"} |="${workflowInstance.id}"`,
      );
      expect(workflowLogs).toHaveProperty('instanceId', workflowInstance.id);
      expect(workflowLogs).toHaveProperty('logs');
      expect(workflowLogs.logs.length).toEqual(8);

      expect(workflowLogs.logs[0]).toHaveProperty('id');
      expect(workflowLogs.logs[0]).toHaveProperty('log');
      // Sorted correctly, this id is the last in the mockdata and should be first when returned
      expect(workflowLogs.logs[0].id).toEqual('1764952546327102000');

      const calls = jest.mocked(undiciFetch).mock.calls;
      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toEqual(urlToFetch);
      expect(calls[0][1]).toEqual(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer notsecret',
          }),
        }),
      );
    });

    it('rejects workflow instance ids with control characters for LogQL safety', async () => {
      jest.mocked(undiciFetch).mockResolvedValue({ ok: true } as any);

      const provider = LokiProvider.fromConfig(
        new ConfigReader({
          orchestrator: {
            workflowLogProvider: {
              loki: {
                baseUrl: 'http://localhost:3100',
                token: 'notsecret',
              },
            },
          },
        }),
      );

      await expect(
        provider.fetchWorkflowLogsByInstance({
          id: 'bad\nid',
          processId: 'x',
          start: '2025-12-05T16:35:13.621Z',
          end: '',
          nodes: [],
        }),
      ).rejects.toThrow(/not allowed in Loki line filters/);
      expect(jest.mocked(undiciFetch)).not.toHaveBeenCalled();
    });

    it('escapes quotes in workflow instance ids in the LogQL line filter', async () => {
      const mockResponse: Partial<Response> = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockWorkflowLog),
      };
      jest.mocked(undiciFetch).mockResolvedValue(mockResponse as any);

      const provider = LokiProvider.fromConfig(
        new ConfigReader({
          orchestrator: {
            workflowLogProvider: {
              loki: {
                baseUrl: 'http://localhost:3100',
                token: 'notsecret',
              },
            },
          },
        }),
      );

      const workflowInstance: ProcessInstanceDTO = {
        id: '12"45',
        processId: '54321',
        start: '2025-12-05T16:35:13.621Z',
        end: '',
        nodes: [],
      };

      await provider.fetchWorkflowLogsByInstance(workflowInstance);

      const parsed = new URL(
        jest.mocked(undiciFetch).mock.calls[0][0] as string,
      );
      expect(parsed.searchParams.get('query')).toEqual(
        String.raw`{openshift_log_type="application"} |="12\"45"`,
      );
    });

    it('should have an enddate that had 5 minutes added to it', async () => {
      const mockResponse: Partial<Response> = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockWorkflowLog),
      };
      jest.mocked(undiciFetch).mockResolvedValue(mockResponse as any);

      const lokiAppConfig = {
        orchestrator: {
          workflowLogProvider: {
            loki: {
              baseUrl: 'http://localhost:3100',
              token: 'notsecret',
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
        'http://localhost:3100/loki/api/v1/query_range?query=%7Bopenshift_log_type%3D%22application%22%7D+%7C%3D%2212345%22&start=2025-12-05T16%3A30%3A13.621Z&end=2025-12-05T17%3A40%3A13.621Z&limit=100';

      await provider.fetchWorkflowLogsByInstance(workflowInstance);
      const parsedURLToFetch = new URL(urlToFetch);

      expect(parsedURLToFetch.searchParams.get('end')).toEqual(
        '2025-12-05T17:40:13.621Z',
      ); // Should be 5 minutes after

      const calls = jest.mocked(undiciFetch).mock.calls;
      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toEqual(urlToFetch);
    });

    it('should have a custom log selector and filter', async () => {
      const mockResponse: Partial<Response> = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockWorkflowLog),
      };
      jest.mocked(undiciFetch).mockResolvedValue(mockResponse as any);

      const lokiAppConfig = {
        orchestrator: {
          workflowLogProvider: {
            loki: {
              baseUrl: 'http://localhost:3100',
              token: 'notsecret',
              logStreamSelectors: [
                {
                  label: 'custom_selector',
                  value: '=~".+"',
                },
                {
                  label: 'custom_selector1',
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
        'http://localhost:3100/loki/api/v1/query_range?query=%7Bcustom_selector%3D%7E%22.%2B%22%2Ccustom_selector1%3D%22application%22%7D+%7C%3D%2212345%22&start=2025-12-05T16%3A30%3A13.621Z&end=2026-01-03T16%3A35%3A13.621Z&limit=100';

      await provider.fetchWorkflowLogsByInstance(workflowInstance);

      const calls = jest.mocked(undiciFetch).mock.calls;
      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toEqual(urlToFetch);

      const parsedURLToFetch = new URL(urlToFetch);

      expect(parsedURLToFetch.origin).toEqual(provider.getBaseURL());
      expect(parsedURLToFetch.pathname).toEqual('/loki/api/v1/query_range');
      expect(parsedURLToFetch.searchParams.get('query')).toEqual(
        `{custom_selector=~".+",custom_selector1="application"} |="${workflowInstance.id}"`,
      );
    });

    it('should have a custom log selector and filter, no label and no value, use defaults', async () => {
      const mockResponse: Partial<Response> = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockWorkflowLog),
      };
      jest.mocked(undiciFetch).mockResolvedValue(mockResponse as any);

      const lokiAppConfig = {
        orchestrator: {
          workflowLogProvider: {
            loki: {
              baseUrl: 'http://localhost:3100',
              token: 'notsecret',
              logStreamSelectors: [
                {
                  value: '=~".+"',
                },
                {
                  label: 'custom_selector1',
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
        'http://localhost:3100/loki/api/v1/query_range?query=%7Bopenshift_log_type%3D%7E%22.%2B%22%2Ccustom_selector1%3D%22application%22%7D+%7C%3D%2212345%22&start=2025-12-05T16%3A30%3A13.621Z&end=2026-01-03T16%3A35%3A13.621Z&limit=100';

      await provider.fetchWorkflowLogsByInstance(workflowInstance);
      const parsedURLToFetch = new URL(urlToFetch);

      expect(parsedURLToFetch.origin).toEqual(provider.getBaseURL());
      expect(parsedURLToFetch.pathname).toEqual('/loki/api/v1/query_range');
      expect(parsedURLToFetch.searchParams.get('query')).toEqual(
        `{openshift_log_type=~".+",custom_selector1="application"} |="${workflowInstance.id}"`,
      );

      const calls = jest.mocked(undiciFetch).mock.calls;
      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toEqual(urlToFetch);
    });

    it('should have a custom pipeline filter, no label and no value, use defaults', async () => {
      const mockResponse: Partial<Response> = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockWorkflowLog),
      };
      jest.mocked(undiciFetch).mockResolvedValue(mockResponse as any);

      const lokiAppConfig = {
        orchestrator: {
          workflowLogProvider: {
            loki: {
              baseUrl: 'http://localhost:3100',
              token: 'notsecret',
              logPipelineFilters: ['| filter1', '| json'],
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
        'http://localhost:3100/loki/api/v1/query_range?query=%7Bopenshift_log_type%3D%22application%22%7D+%7C%3D%2212345%22+%7C+filter1+%7C+json&start=2025-12-05T16%3A30%3A13.621Z&end=2026-01-03T16%3A35%3A13.621Z&limit=100';

      await provider.fetchWorkflowLogsByInstance(workflowInstance);
      const parsedURLToFetch = new URL(urlToFetch);

      expect(parsedURLToFetch.origin).toEqual(provider.getBaseURL());
      expect(parsedURLToFetch.pathname).toEqual('/loki/api/v1/query_range');
      expect(parsedURLToFetch.searchParams.get('query')).toEqual(
        `{openshift_log_type="application"} |="${workflowInstance.id}" | filter1 | json`,
      );

      const calls = jest.mocked(undiciFetch).mock.calls;
      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toEqual(urlToFetch);
    });

    it('should have a custom limit', async () => {
      const mockResponse: Partial<Response> = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockWorkflowLog),
      };
      jest.mocked(undiciFetch).mockResolvedValue(mockResponse as any);

      const lokiAppConfig = {
        orchestrator: {
          workflowLogProvider: {
            loki: {
              baseUrl: 'http://localhost:3100',
              token: 'notsecret',
              limit: 50,
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
        'http://localhost:3100/loki/api/v1/query_range?query=%7Bopenshift_log_type%3D%22application%22%7D+%7C%3D%2212345%22&start=2025-12-05T16%3A30%3A13.621Z&end=2026-01-03T16%3A35%3A13.621Z&limit=50';

      await provider.fetchWorkflowLogsByInstance(workflowInstance);
      const parsedURLToFetch = new URL(urlToFetch);
      expect(parsedURLToFetch.searchParams.get('limit')).toEqual('50');
    });
  });
});
