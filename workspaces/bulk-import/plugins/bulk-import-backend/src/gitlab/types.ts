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

import type { SerializedError } from '@backstage/errors';
import type {
  GitlabCredentials,
  GitlabCredentialsProvider,
} from '@backstage/integration';

// From https://docs.github.com/en/rest/orgs/orgs?apiVersion=2022-11-28#list-organizations
export type GitlabOrganization = {
  name: string;
  id: number;
  description?: string;
  url?: string;
  html_url?: string;
  avatar_url?: string;
  public_repos?: number;
  total_private_repos?: number;
  /**
   * Number of internal repositories, accessible to all members in a GH enterprise
   */
  owned_private_repos?: number;
};

export type GitlabRepository = {
  // id?: string;
  name: string;
  /**
   * The full name of the repository in the form of owner/repo, should be the path_with_namespace property in gitlab
   */
  full_name: string;
  /**
   * The API url to the repository
   */
  url: string;
  /**
   * The HTML URL to the repository, web_url in gitlab
   */
  html_url: string;
  /**
   * The default "main" branch of the repository to place the `catalog-info.yaml` file into
   */
  default_branch: string;
  /**
   * The date-time the repository was last updated at
   */
  updated_at?: string | null;
};

/**
 * The type of credentials produced by the credential provider.
 *
 * @public
 */

export type GitlabFetchError = {
  type: 'token';
  error: SerializedError;
};

export type GitlabOrganizationResponse = {
  organizations: GitlabOrganization[];
  errors: GitlabFetchError[];
  totalCount?: number;
};

export type GitlabRepositoryResponse = {
  repositories: GitlabRepository[];
  errors: GitlabFetchError[];
  totalCount?: number;
};

export type ExtendedGitlabCredentials = GitlabCredentials;

export interface ExtendedGitlabCredentialsProvider extends GitlabCredentialsProvider {
  getAllCredentials: (options: {
    host: string;
  }) => Promise<ExtendedGitlabCredentials[]>;
}
