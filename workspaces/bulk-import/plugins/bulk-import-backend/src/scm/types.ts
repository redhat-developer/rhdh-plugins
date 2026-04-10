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

/**
 * Error type returned when fetching SCM resources from an integration.
 *
 * @public
 */

export type SCMFetchError =
  | {
      type: 'app';
      appId: number;
      error: SerializedError;
    }
  | {
      type: 'token';
      error: SerializedError;
    };

export type SCMOrganization = {
  name: string;
  id: number;
  description?: string;
  url?: string;
  html_url?: string;
  repos_url?: string;
  events_url?: string;
  hooks_url?: string;
  issues_url?: string;
  members_url?: string;
  public_members_url?: string;
  avatar_url?: string;
  public_repos?: number;
  total_private_repos?: number;
  /**
   * Number of internal repositories, accessible to all members in a GH enterprise
   */
  owned_private_repos?: number;
};

export type SCMOrganizationResponse = {
  organizations: SCMOrganization[];
  errors: SCMFetchError[];
  totalCount?: number;
};

export type SCMRepository = {
  name: string;
  /**
   * The full name of the repository in the form of owner/repo
   */
  full_name: string;
  /**
   * The API url to the repository
   */
  url: string;
  /**
   * The HTML URL to the repository
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

export type SCMRepositoryResponse = {
  repositories: SCMRepository[];
  errors: SCMFetchError[];
  totalCount?: number;
};
