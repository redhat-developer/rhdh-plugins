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

const MAX_BASE_NAME_LENGTH = 64;
const SHORT_ID_LENGTH = 6;
const DEFAULT_BASE_NAME = 'project';

/**
 * Value Object that encapsulates project naming and directory conventions.
 *
 * All sanitization and truncation logic lives here so that consumers
 * (K8s job specs, bash scripts, etc.) receive a safe, pre-computed name.
 */
export class Project {
  constructor(
    private readonly id: string,
    private readonly projectName: string,
  ) {}

  /** Raw project ID (UUID) */
  get projectId(): string {
    return this.id;
  }

  /** First 6 characters of the project UUID */
  get shortId(): string {
    return this.id.substring(0, SHORT_ID_LENGTH);
  }

  /**
   * Sanitized project name suitable for use as a directory component.
   *
   * Rules:
   *  - Lowercased
   *  - Non-alphanumeric characters (except dash) replaced with dash
   *  - Consecutive dashes collapsed
   *  - Leading/trailing dashes removed
   *  - Truncated to 64 characters
   *  - Falls back to "project" if empty after sanitization
   *
   * Uses manual iteration for trimming to prevent ReDoS (O(n) guaranteed).
   */
  get baseName(): string {
    let sanitized = this.projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-{2,}/g, '-');

    // Remove leading dashes (manual iteration — O(n), no ReDoS)
    let start = 0;
    while (start < sanitized.length && sanitized[start] === '-') {
      start++;
    }
    sanitized = sanitized.substring(start);

    // Remove trailing dashes (manual iteration — O(n), no ReDoS)
    let end = sanitized.length;
    while (end > 0 && sanitized[end - 1] === '-') {
      end--;
    }
    sanitized = sanitized.substring(0, end);

    // Truncate to max length
    sanitized = sanitized.substring(0, MAX_BASE_NAME_LENGTH);

    // Remove any trailing dash created by truncation
    while (sanitized.length > 0 && sanitized[sanitized.length - 1] === '-') {
      sanitized = sanitized.substring(0, sanitized.length - 1);
    }

    return sanitized || DEFAULT_BASE_NAME;
  }

  /** Directory name for the target repo: `<baseName>-<shortId>` */
  get dirName(): string {
    return `${this.baseName}-${this.shortId}`;
  }
}
