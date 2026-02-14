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

import type { Entity } from '@backstage/catalog-model';

import { OpenSSFClient } from './OpenSSFClient';
import type { OpenSSFResponse } from './types';

const mockScorecardUrl =
  'https://api.securityscorecards.dev/projects/github.com/owner/repo';

function createEntity(baseUrl: string): Entity {
  return {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Component',
    metadata: {
      name: 'my-service',
      annotations: {
        'openssf/baseUrl': baseUrl,
      },
    },
    spec: {},
  } as Entity;
}

const mockOpenSSFResponse: OpenSSFResponse = {
  date: '2024-01-15',
  repo: { name: 'github.com/owner/repo', commit: 'abc123' },
  scorecard: { version: '4.0.0', commit: 'def456' },
  score: 7.5,
  checks: [
    {
      name: 'Maintained',
      score: 8,
      reason: null,
      details: null,
      documentation: { short: '', url: '' },
    },
  ],
};

describe('OpenSSFClient', () => {
  const entity = createEntity(mockScorecardUrl);

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
  });

  describe('getScorecard', () => {
    it('fetches the scorecard from the entity baseUrl', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockOpenSSFResponse),
      });

      const client = new OpenSSFClient();
      const result = await client.getScorecard(entity);

      expect(fetch).toHaveBeenCalledWith(mockScorecardUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      expect(result).toEqual(mockOpenSSFResponse);
    });

    it('throws when the response is not ok', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const client = new OpenSSFClient();

      await expect(client.getScorecard(entity)).rejects.toThrow(
        'OpenSSF API request failed with status 404: Not Found',
      );
    });

    it('throws when fetch rejects', async () => {
      (globalThis.fetch as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );

      const client = new OpenSSFClient();

      await expect(client.getScorecard(entity)).rejects.toThrow(
        'Network error',
      );
    });
  });
});
