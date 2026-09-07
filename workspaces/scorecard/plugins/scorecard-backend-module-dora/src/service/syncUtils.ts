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

export function laterOf(windowFrom: Date, watermark: Date | undefined): Date {
  if (!watermark || watermark < windowFrom) {
    return windowFrom;
  }
  return watermark;
}

/**
 * Computes the data boundary for a collector.
 *
 * With no prior watermark, returns `windowFrom`. Otherwise returns
 * `max(windowFrom, min(watermark, now) - lookbackMs)` so collected data created
 * near the last watermark are re-queried.
 *
 * A watermark ahead of the current time cannot describe already collected data
 * and is clamped to now, otherwise the boundary would land in the future.
 *
 * Usage:
 * - Deployments: `from` parameter when syncing deployment data
 * - Incidents: `updatedSince` parameter when syncing incident data
 */
export function collectorDataBoundary(
  windowFrom: Date,
  watermark: Date | undefined,
  lookbackMs: number,
): Date {
  if (!watermark) {
    return windowFrom;
  }
  const now = new Date();
  const effectiveWatermark = watermark > now ? now : watermark;
  if (lookbackMs <= 0) {
    return laterOf(windowFrom, effectiveWatermark);
  }
  return laterOf(
    windowFrom,
    new Date(effectiveWatermark.getTime() - lookbackMs),
  );
}

/**
 * Returns true when last sync is still considered fresh and a refresh should be skipped.
 */
export function isWithinStaleWindow(
  lastSyncedAt: Date | undefined,
  staleAfterMs: number,
): boolean {
  if (!lastSyncedAt) {
    return false;
  }

  const elapsedMs = new Date().getTime() - lastSyncedAt.getTime();

  // A negative elapsed time makes no sense - treat data as stale and refresh
  if (elapsedMs < 0) {
    return false;
  }

  return elapsedMs < staleAfterMs;
}

/**
 * Shares one in-flight promise per key so concurrent callers wait on the same work.
 * The window is excluded from the key: including ms-precision timestamps
 * would make every key unique and disable coalescing entirely.
 */
export function coalesceInFlight<T>(
  inflight: Map<string, Promise<T>>,
  key: string,
  run: () => Promise<T>,
): Promise<T> {
  const existing = inflight.get(key);
  if (existing) {
    return existing;
  }

  const promise = run().finally(() => {
    if (inflight.get(key) === promise) {
      inflight.delete(key);
    }
  });
  inflight.set(key, promise);
  return promise;
}
