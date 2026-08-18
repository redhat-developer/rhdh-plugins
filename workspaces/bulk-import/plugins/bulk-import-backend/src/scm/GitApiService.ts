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
import { LoggerService } from '@backstage/backend-plugin-api';

import gitUrlParse from 'git-url-parse';

import {
  SCMFetchError,
  SCMOrganizationResponse,
  SCMRepository,
  SCMRepositoryResponse,
} from './types';

export interface GitApiService {
  getRepositoryFromIntegrations(
    repoUrl: string,
  ): Promise<{ repository?: SCMRepository; errors?: SCMFetchError[] }>;

  getOrganizationsFromIntegrations(
    pageNumber: number,
    pageSize: number,
    search?: string,
  ): Promise<SCMOrganizationResponse>;

  getOrgRepositoriesFromIntegrations(
    orgName: string,
    search?: string,
    pageNumber?: number,
    pageSize?: number,
    userTokens?: Record<string, string>,
  ): Promise<SCMRepositoryResponse>;

  getRepositoriesFromIntegrations(
    search?: string,
    userTokens?: Record<string, string>,
  ): Promise<SCMRepositoryResponse>;

  filterLocationsAccessibleFromIntegrations(
    locationUrls: string[],
  ): Promise<string[]>;

  getPullRequest(
    repoUrl: string,
    pullRequestNumber: number,
  ): Promise<{
    title?: string;
    body?: string;
    merged?: boolean;
    lastUpdated?: string;
    prSha?: string;
    prBranch?: string;
  }>;

  findImportOpenPr(
    logger: LoggerService,
    input: {
      repoUrl: string;
      includeCatalogInfoContent?: boolean;
    },
  ): Promise<{
    prNum?: number;
    prUrl?: string;
    prTitle?: string;
    prBody?: string;
    prCatalogInfoContent?: string;
    lastUpdate?: string;
  }>;

  getCatalogInfoFile(
    logger: LoggerService,
    input: {
      repoUrl: string;
      prNumber: number;
      prHeadSha: string;
    },
  ): Promise<string | undefined>;

  submitPrToRepo(
    logger: LoggerService,
    input: {
      repoUrl: string;
      gitUrl: gitUrlParse.GitUrl;
      defaultBranch?: string;
      prTitle: string;
      prBody: string;
      catalogInfoContent: string;
    },
  ): Promise<{
    prUrl?: string;
    prNumber?: number;
    hasChanges?: boolean;
    lastUpdate?: string;
    errors?: string[];
  }>;

  hasFileInRepo(input: {
    repoUrl: string;
    defaultBranch?: string;
    fileName: string;
  }): Promise<boolean>;

  closeImportPR(
    logger: LoggerService,
    input: {
      repoUrl: string;
      gitUrl: gitUrlParse.GitUrl;
      comment: string;
    },
  ): Promise<void>;

  deleteImportBranch(input: {
    repoUrl: string;
    gitUrl: gitUrlParse.GitUrl;
  }): Promise<void>;

  isRepoEmpty(input: { repoUrl: string }): Promise<boolean | undefined>;
}
