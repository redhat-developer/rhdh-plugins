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

import { mockServices } from '@backstage/backend-test-utils';
import { CodeCoverageClient } from './CodeCoverageClient';
import type { CodeCoverageReport } from './types';

const mockDiscovery = mockServices.discovery.mock({
  getBaseUrl: async (pluginId: string) =>
    `http://localhost:7007/api/${pluginId}`,
});
const mockLogger = mockServices.logger.mock();

const sampleReport: CodeCoverageReport = {
  aggregate: {
    line: { available: 5, covered: 4, missed: 1, percentage: 80 },
    branch: { available: 0, covered: 0, missed: 0, percentage: 0 },
  },
  entity: { kind: 'Component', name: 'entity-name', namespace: 'default' },
  files: [],
};

describe('CodeCoverageClient', () => {
  let client: CodeCoverageClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new CodeCoverageClient(mockDiscovery, mockLogger);
  });

  it('should call the correct URL and return the report', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => sampleReport,
    } as Response);

    const report = await client.getReport('component:default/entity-name');

    expect(report).toEqual(sampleReport);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:7007/api/code-coverage/report?entity=component%3Adefault%2Fentity-name',
    );
  });

  it('should throw on non-ok response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    await expect(client.getReport('component:default/missing')).rejects.toThrow(
      'Code coverage API error: 404 Not Found',
    );
  });
});
