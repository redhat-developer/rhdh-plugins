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
export class GitRepository {
  readonly url: string;
  readonly branch: string;
  readonly token: string;

  constructor(url: string, branch: string, token: string) {
    if (!url) {
      throw new Error('GitRepository url must be a non-empty string');
    }
    if (!branch) {
      throw new Error('GitRepository branch must be a non-empty string');
    }
    if (!token) {
      throw new Error('GitRepository token must be a non-empty string');
    }
    this.url = url;
    this.branch = branch;
    this.token = token;
  }

  equals(other: GitRepository): boolean {
    return (
      this.url === other.url &&
      this.branch === other.branch &&
      this.token === other.token
    );
  }

  toString(): string {
    return this.url;
  }
}
