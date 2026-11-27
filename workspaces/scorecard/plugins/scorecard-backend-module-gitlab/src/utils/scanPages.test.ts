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
import { scanPages } from './scanPages';

describe('scanPages', () => {
  const logger = mockServices.logger.mock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should accumulate values across numbered pages', async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => i))
      .mockResolvedValueOnce([100, 101]);

    const result = await scanPages<number, { sum: number }>(logger, {
      fetchPage,
      getValue: (item, acc) => {
        acc.sum += item;
      },
      initialResult: { sum: 0 },
      context: 'numbers',
    });

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(result.sum).toBe(
      Array.from({ length: 102 }, (_, i) => i).reduce((a, b) => a + b, 0),
    );
  });

  it('should stop when shouldContinue returns false', async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce(Array.from({ length: 100 }, () => 1));

    const result = await scanPages<number, { count: number }>(logger, {
      fetchPage,
      getValue: (_item, acc) => {
        acc.count++;
      },
      initialResult: { count: 0 },
      context: 'numbers',
      shouldContinue: () => false,
    });

    expect(result.count).toBe(100);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('should warn when the page cap is hit', async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValue(Array.from({ length: 100 }, () => 1));

    const result = await scanPages<number, { count: number }>(logger, {
      fetchPage,
      getValue: (_item, acc) => {
        acc.count++;
      },
      initialResult: { count: 0 },
      context: 'numbers',
    });

    expect(result.count).toBe(1000);
    expect(fetchPage).toHaveBeenCalledTimes(10);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Reached fetch limit while counting numbers'),
    );
  });
});
