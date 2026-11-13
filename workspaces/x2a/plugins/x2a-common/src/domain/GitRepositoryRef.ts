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

/** @public */
export class GitRepositoryRef {
  constructor(
    readonly url: string,
    readonly branch: string,
  ) {
    if (!url) {
      throw new Error('GitRepositoryRef url must be a non-empty string');
    }
    if (!branch) {
      throw new Error('GitRepositoryRef branch must be a non-empty string');
    }
  }

  static fromProject(project: {
    targetRepoUrl: string;
    targetRepoBranch: string;
  }): GitRepositoryRef {
    return new GitRepositoryRef(
      project.targetRepoUrl,
      project.targetRepoBranch,
    );
  }

  equals(other: GitRepositoryRef): boolean {
    return this.url === other.url && this.branch === other.branch;
  }

  toString(): string {
    return `${this.url}#${this.branch}`;
  }
}
