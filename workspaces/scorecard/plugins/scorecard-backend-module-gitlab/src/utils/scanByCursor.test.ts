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
import { scanByCursor } from './scanByCursor';

describe('scanByCursor', () => {
  const logger = mockServices.logger.mock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should accumulate values across cursor pages', async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce({
        items: Array.from({ length: 100 }, () => 1),
        nextCursor: 'c1',
        hasNextPage: true,
      })
      .mockResolvedValueOnce({
        items: [1, 1],
        nextCursor: null,
        hasNextPage: false,
      });

    const result = await scanByCursor<number, { count: number }>(logger, {
      fetchPage,
      getValue: (_item, acc) => {
        acc.count++;
      },
      initialResult: { count: 0 },
      context: 'cursor numbers',
    });

    expect(result.count).toBe(102);
    expect(fetchPage).toHaveBeenNthCalledWith(1, null, 100);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 'c1', 100);
  });

  it('should stop when hasNextPage is false', async () => {
    const fetchPage = jest.fn().mockResolvedValue({
      items: Array.from({ length: 100 }, () => 1),
      nextCursor: 'c1',
      hasNextPage: false,
    });

    const result = await scanByCursor<number, { count: number }>(logger, {
      fetchPage,
      getValue: (_item, acc) => {
        acc.count++;
      },
      initialResult: { count: 0 },
      context: 'cursor numbers',
    });

    expect(result.count).toBe(100);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('should warn when the fetch cap is hit', async () => {
    const fetchPage = jest.fn().mockResolvedValue({
      items: Array.from({ length: 100 }, () => 1),
      nextCursor: 'next',
      hasNextPage: true,
    });

    const result = await scanByCursor<number, { count: number }>(logger, {
      fetchPage,
      getValue: (_item, acc) => {
        acc.count++;
      },
      initialResult: { count: 0 },
      context: 'cursor numbers',
    });

    expect(result.count).toBe(1000);
    expect(fetchPage).toHaveBeenCalledTimes(10);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Reached fetch limit while counting cursor numbers',
      ),
    );
  });
});
