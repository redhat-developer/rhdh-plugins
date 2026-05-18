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

import type { JobStatusEnum } from '../../client/src/schema/openapi';

/** @public */
export class JobStatus {
  static readonly PENDING = new JobStatus('pending');
  static readonly RUNNING = new JobStatus('running');
  static readonly SUCCESS = new JobStatus('success');
  static readonly ERROR = new JobStatus('error');
  static readonly CANCELLED = new JobStatus('cancelled');

  private static readonly BY_VALUE = new Map<string, JobStatus>(
    [
      JobStatus.PENDING,
      JobStatus.RUNNING,
      JobStatus.SUCCESS,
      JobStatus.ERROR,
      JobStatus.CANCELLED,
    ].map(s => [s.value, s]),
  );

  private constructor(readonly value: JobStatusEnum) {}

  static from(raw: string): JobStatus {
    const status = JobStatus.BY_VALUE.get(raw);
    if (!status) {
      throw new Error(
        `Invalid job status: "${raw}". Valid: ${JobStatus.values().join(', ')}`,
      );
    }
    return status;
  }

  static all(): readonly JobStatus[] {
    return [
      JobStatus.PENDING,
      JobStatus.RUNNING,
      JobStatus.SUCCESS,
      JobStatus.ERROR,
      JobStatus.CANCELLED,
    ];
  }

  static values(): readonly JobStatusEnum[] {
    return JobStatus.all().map(s => s.value);
  }

  static activeStatuses(): readonly JobStatus[] {
    return [JobStatus.PENDING, JobStatus.RUNNING];
  }

  static finishedStatuses(): readonly JobStatus[] {
    return [JobStatus.SUCCESS, JobStatus.ERROR, JobStatus.CANCELLED];
  }

  isActive(): boolean {
    return this === JobStatus.PENDING || this === JobStatus.RUNNING;
  }

  isFinished(): boolean {
    return !this.isActive();
  }

  isPending(): boolean {
    return this === JobStatus.PENDING;
  }

  isRunning(): boolean {
    return this === JobStatus.RUNNING;
  }

  isSuccess(): boolean {
    return this === JobStatus.SUCCESS;
  }

  isError(): boolean {
    return this === JobStatus.ERROR;
  }

  isCancelled(): boolean {
    return this === JobStatus.CANCELLED;
  }

  equals(other: JobStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
