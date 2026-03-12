/**
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

import { TFuncX2A } from '../../hooks/useTranslation';

const num2str = (n: number) => n.toString();

/**
 * Formats a duration given in seconds as a human-readable string.
 * Shows at most two adjacent time units (e.g. "2d 3h", "1h 30m", "5m 12s").
 */
export const formatDuration = (
  t: TFuncX2A,
  totalSecondsRaw: number,
): string => {
  // Limit to 0 to never produce negative output
  const totalSeconds = Math.max(0, totalSecondsRaw);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (days > 0) {
    return hours > 0
      ? t('time.duration.daysAndHours' as any, {
          days: num2str(days),
          hours: num2str(hours),
        })
      : t('time.duration.daysOnly' as any, { days: num2str(days) });
  }
  if (hours > 0) {
    return minutes > 0
      ? t('time.duration.hoursAndMinutes' as any, {
          hours: num2str(hours),
          minutes: num2str(minutes),
        })
      : t('time.duration.hoursOnly' as any, { hours: num2str(hours) });
  }
  if (minutes > 0) {
    return t('time.duration.minutesAndSeconds' as any, {
      minutes: num2str(minutes),
      seconds: num2str(seconds),
    });
  }
  return t('time.duration.secondsOnly' as any, { seconds: num2str(seconds) });
};

/**
 * Formats how long ago a timestamp was relative to now.
 * Returns strings like "5m ago", "2h 30m ago", "<1m ago".
 */
export const formatTimeAgo = (t: TFuncX2A, timestamp: Date): string => {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (diffMs <= 0) {
    // Should not happen, but just in case.
    return t('time.ago.lessThanMinute');
  }
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return hours > 0
      ? t('time.ago.daysAndHours' as any, {
          days: num2str(days),
          hours: num2str(hours),
        })
      : t('time.ago.daysOnly' as any, { days: num2str(days) });
  }
  if (hours > 0) {
    return minutes > 0
      ? t('time.ago.hoursAndMinutes' as any, {
          hours: num2str(hours),
          minutes: num2str(minutes),
        })
      : t('time.ago.hoursOnly' as any, { hours: num2str(hours) });
  }
  if (minutes > 0) {
    return t('time.ago.minutes' as any, { minutes: num2str(minutes) });
  }
  return t('time.ago.lessThanMinute');
};

export const secondsBetween = (from: Date, to: Date): number => {
  const diffMs = new Date(to).getTime() - new Date(from).getTime();
  return Math.floor(diffMs / 1000);
};

/**
 * Formats relative timing as a status string:
 * - No start time: "-"
 * - Running (no finish time): "Running for 2m 30s"
 * - Finished: "Finished 5m ago (took 15m 0s)"
 */
export const formatRelativeTime = (
  t: TFuncX2A,
  startedAt: Date | undefined,
  finishedAt: Date | undefined,
): string => {
  if (!startedAt) {
    return t('time.jobTiming.noStartTime');
  }

  if (!finishedAt) {
    const duration = formatDuration(t, secondsBetween(startedAt, new Date()));
    return t('time.jobTiming.running' as any, { duration });
  }

  const timeAgo = formatTimeAgo(t, finishedAt);
  const duration = formatDuration(t, secondsBetween(startedAt, finishedAt));
  return t('time.jobTiming.finished' as any, { timeAgo, duration });
};
