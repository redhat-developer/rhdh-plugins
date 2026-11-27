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

declare module 'git-url-parse' {
  namespace gitUrlParse {
    interface GitUrl {
      /** An array with the url protocols (usually it has one element). */
      protocols: string[];
      port: number | null;
      /** The url domain (including subdomains). */
      resource: string;
      /** The authentication user (usually for ssh urls). */
      user: string;
      pathname: string;
      hash: string;
      search: string;
      href: string;
      protocol: string;
      /** The oauth token (could appear in the https urls). */
      token: string;
      /** The Git provider (e.g. `"github.com"`). */
      source: string;
      /** The repository owner. */
      owner: string;
      /** The repository name. */
      name: string;
      /** The repository ref (e.g., "master" or "dev"). */
      ref: string;
      /** A filepath relative to the repository root. */
      filepath: string;
      /** The type of filepath in the url ("blob" or "tree"). */
      filepathtype: string;
      /** The owner and name values in the `owner/name` format. */
      full_name: string;
      /** The organization the owner belongs to. This is CloudForge specific. */
      organization: string;
      /** Whether to add the `.git` suffix or not. */
      git_suffix?: boolean | undefined;
      toString(type?: string): string;
    }

    function stringify(url: GitUrl, type?: string): string;
  }

  function gitUrlParse(url: string): gitUrlParse.GitUrl;

  export = gitUrlParse;
}
