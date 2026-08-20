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

import {
  coalesceInFlight,
  deploymentSyncFrom,
  isWithinStaleWindow,
  laterOf,
} from './syncUtils';

describe('laterOf', () => {
  const windowFrom = new Date('2026-06-01T00:00:00.000Z');

  it('returns windowFrom when watermark is undefined', () => {
    expect(laterOf(windowFrom, undefined)).toBe(windowFrom);
  });

  it('returns windowFrom when watermark is earlier', () => {
    const watermark = new Date('2026-05-01T00:00:00.000Z');
    expect(laterOf(windowFrom, watermark)).toBe(windowFrom);
  });

  it('returns watermark when it is later than windowFrom', () => {
    const watermark = new Date('2026-06-15T00:00:00.000Z');
    expect(laterOf(windowFrom, watermark)).toBe(watermark);
  });

  it('returns watermark when it equals windowFrom', () => {
    const watermark = new Date('2026-06-01T00:00:00.000Z');
    expect(laterOf(windowFrom, watermark)).toBe(watermark);
  });
});

describe('deploymentSyncFrom', () => {
  const windowFrom = new Date('2026-06-01T00:00:00.000Z');
  const lookbackMs = 48 * 60 * 60 * 1000; // 48h

  it('returns windowFrom when watermark is undefined', () => {
    expect(deploymentSyncFrom(windowFrom, undefined, lookbackMs)).toBe(
      windowFrom,
    );
  });

  it('subtracts lookback from watermark when still inside the window', () => {
    const watermark = new Date('2026-06-15T00:00:00.000Z');
    expect(
      deploymentSyncFrom(windowFrom, watermark, lookbackMs).toISOString(),
    ).toBe('2026-06-13T00:00:00.000Z');
  });

  it('clamps to windowFrom when lookback would start earlier', () => {
    const watermark = new Date('2026-06-02T00:00:00.000Z');
    expect(deploymentSyncFrom(windowFrom, watermark, lookbackMs)).toBe(
      windowFrom,
    );
  });

  it('matches watermark when lookback is zero', () => {
    const watermark = new Date('2026-06-15T00:00:00.000Z');
    expect(deploymentSyncFrom(windowFrom, watermark, 0)).toBe(watermark);
  });
});

describe('coalesceInFlight', () => {
  it('shares one in-flight promise for the same key', async () => {
    const inflight = new Map<string, Promise<string>>();
    let resolveRun!: (value: string) => void;
    const run = jest.fn(
      () =>
        new Promise<string>(resolve => {
          resolveRun = resolve;
        }),
    );

    const first = coalesceInFlight(inflight, 'key-a', run);
    const second = coalesceInFlight(inflight, 'key-a', run);

    expect(run).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);

    resolveRun('done');
    await expect(Promise.all([first, second])).resolves.toEqual([
      'done',
      'done',
    ]);
    expect(inflight.size).toBe(0);
  });

  it('runs separately for different keys', async () => {
    const inflight = new Map<string, Promise<string>>();
    const runA = jest.fn(async () => 'a');
    const runB = jest.fn(async () => 'b');

    await expect(
      Promise.all([
        coalesceInFlight(inflight, 'key-a', runA),
        coalesceInFlight(inflight, 'key-b', runB),
      ]),
    ).resolves.toEqual(['a', 'b']);

    expect(runA).toHaveBeenCalledTimes(1);
    expect(runB).toHaveBeenCalledTimes(1);
  });

  it('allows a new run after the previous one settles', async () => {
    const inflight = new Map<string, Promise<number>>();
    const run = jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    await expect(coalesceInFlight(inflight, 'key-a', run)).resolves.toBe(1);
    await expect(coalesceInFlight(inflight, 'key-a', run)).resolves.toBe(2);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('clears the key when the run fails so a retry can start', async () => {
    const inflight = new Map<string, Promise<string>>();
    const run = jest
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('ok');

    await expect(coalesceInFlight(inflight, 'key-a', run)).rejects.toThrow(
      'boom',
    );
    await expect(coalesceInFlight(inflight, 'key-a', run)).resolves.toBe('ok');
    expect(run).toHaveBeenCalledTimes(2);
  });
});

describe('isWithinStaleWindow', () => {
  it('returns false when no previous sync exists', () => {
    expect(isWithinStaleWindow(undefined, 60_000)).toBe(false);
  });

  it('returns false when stale window is disabled', () => {
    expect(isWithinStaleWindow(new Date(Date.now() - 30_000), 0)).toBe(false);
  });

  it('returns true when last sync is within staleAfter', () => {
    expect(isWithinStaleWindow(new Date(Date.now() - 30_000), 60_000)).toBe(
      true,
    );
  });

  it('returns false when last sync is outside staleAfter', () => {
    expect(isWithinStaleWindow(new Date(Date.now() - 180_000), 60_000)).toBe(
      false,
    );
  });
});
