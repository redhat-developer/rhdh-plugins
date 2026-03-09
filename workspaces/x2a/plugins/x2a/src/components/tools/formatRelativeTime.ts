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

class RelativeTimeFormatter {
  private computeDuration(startMs: number, endMs: number): string {
    const diffMs = endMs - startMs;
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    }
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  private formatRelativeTime(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(timestamp).getTime();
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) {
      return hours > 0 ? `${days}d ${hours}h ago` : `${days}d ago`;
    }
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m ago` : `${hours}h ago`;
    }
    if (minutes > 0) {
      return `${minutes}m ago`;
    }
    return '<1m ago';
  }

  format(startedAt: Date | undefined, finishedAt: Date | undefined): string {
    if (!startedAt) {
      return '-';
    }

    const startMs = new Date(startedAt).getTime();

    if (!finishedAt) {
      const runningDuration = this.computeDuration(
        startMs,
        new Date().getTime(),
      );
      return `Running for ${runningDuration}`;
    }

    const finishedMs = new Date(finishedAt).getTime();
    const relativeTime = this.formatRelativeTime(finishedAt);
    const duration = this.computeDuration(startMs, finishedMs);
    return `Finished ${relativeTime} (took ${duration})`;
  }
}

export const formatRelativeTime = (
  startedAt: Date | undefined,
  finishedAt: Date | undefined,
): string => {
  return new RelativeTimeFormatter().format(startedAt, finishedAt);
};
