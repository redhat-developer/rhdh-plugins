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

// Following import is a workaround so we can reuse the same logic in migrations as well.
// The migrations must be self-contained.
import {
  sanitizeBaseName,
  computeDirName,
  SHORT_ID_LENGTH,
} from '../../lib/projectNaming';

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

  /** Sanitized project name suitable for use as a directory component. */
  get baseName(): string {
    return sanitizeBaseName(this.projectName);
  }

  /** Directory name for the target repo: `<baseName>-<shortId>` */
  get dirName(): string {
    return computeDirName(this.id, this.projectName);
  }
}
