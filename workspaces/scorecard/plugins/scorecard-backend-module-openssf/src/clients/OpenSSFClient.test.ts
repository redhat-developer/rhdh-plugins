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

import { OpenSSFClient } from './OpenSSFClient';
import { OpenSSFResponse } from './types';

describe('OpenSSFClient', () => {
  let client: OpenSSFClient;

  const mockOpenSSFResponse: OpenSSFResponse = {
    date: '2024-01-15',
    repo: {
      name: 'github.com/owner/test',
      commit: 'abc123',
    },
    scorecard: {
      version: '4.0.0',
      commit: 'def456',
    },
    score: 7.5,
    checks: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    client = new OpenSSFClient();
    globalThis.fetch = jest.fn();
  });

  describe('getScorecard', () => {
    it('should return the scorecard', async () => {
      // mocked fetch behaviour for the test
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockOpenSSFResponse),
      });

      const scorecard = await client.getScorecard('owner', 'test');
      expect(scorecard).toEqual(mockOpenSSFResponse);
    });

    it('should throw an error if the API returns a non-ok response', async () => {
      // mock response from the API
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(client.getScorecard('wrong', 'test')).rejects.toThrow(
        'OpenSSF API request failed with status 404: Not Found',
      );
    });

    it('should throw an error if the score is not a number', async () => {
      // mock response from the API
      const responseWithoutScore = {
        ...mockOpenSSFResponse,
        score: 'not a number',
      };

      // mocked fetch behaviour for the test
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(responseWithoutScore),
      });

      await expect(client.getScorecard('owner', 'test')).rejects.toThrow(
        'Invalid response from OpenSSF API: score is not a number',
      );
    });

    it('should throw an error if API request fails', async () => {
      // mocked fetch behaviour for the test
      (globalThis.fetch as jest.Mock).mockRejectedValue(
        new Error('API request failed'),
      );

      await expect(client.getScorecard('owner', 'test')).rejects.toThrow(
        'API request failed',
      );
    });
  });
});
