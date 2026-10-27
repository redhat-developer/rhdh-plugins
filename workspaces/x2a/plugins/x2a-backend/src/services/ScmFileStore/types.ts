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

/** A file read from a repository. */
export interface ScmFile {
  /** UTF-8 content of the file. */
  content: string;
  /**
   * Opaque version of the file (e.g. a blob sha). Pass it back as
   * `expectedVersion` to {@link ScmFileStore.putFile} to detect concurrent changes.
   */
  version: string;
}

export interface ScmFileLocation {
  /** Clone URL or web URL of the repository. */
  repoUrl: string;
  branch: string;
  /** Path of the file relative to the repository root. */
  path: string;
  /**
   * The user's token, as handled by the rest of the plugin: it may carry the
   * provider-specific prefix added by `ScmProvider.augmentToken`.
   */
  token: string;
}

export interface ScmFilePutParams extends ScmFileLocation {
  content: string;
  /** Commit message. */
  message: string;
  /** The `version` of the file that was read before editing. */
  expectedVersion: string;
}

/**
 * Reads and commits single files in a remote repository.
 *
 * This is the contract the router depends on, so that the REST based
 * implementation can be replaced (e.g. by one using the git CLI).
 *
 * Implementations throw the `@backstage/errors` classes, with a message that is
 * safe and useful to show to the user (what happened and what to do next):
 * - `InputError`: unsupported SCM provider or malformed repository URL
 * - `AuthenticationError`: the SCM rejected the token
 * - `NotAllowedError`: the token may not read or push to the repository/branch
 * - `NotFoundError`: the repository, branch or file does not exist
 * - `ConflictError`: the file changed since `expectedVersion`
 * - `ServiceUnavailableError`: the SCM host is unreachable or failed
 */
export interface ScmFileStore {
  getFile(location: ScmFileLocation): Promise<ScmFile>;

  /** Commits the new content to the branch and returns the new version of the file. */
  putFile(params: ScmFilePutParams): Promise<{ version: string }>;
}
