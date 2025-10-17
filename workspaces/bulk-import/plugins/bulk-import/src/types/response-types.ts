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

import { ApprovalTool, RepositoryStatus } from './types';

export type Repository = {
  id: string;
  url?: string;
  name?: string;
  organization?: string;
  defaultBranch?: string;
  lastUpdate?: string;
  errors?: string[];
  totalRepoCount?: number;
};

export interface ScaffolderTask {
  taskId: string;
  repositoryId: number;
}

export type ImportJobResponse = {
  errors: RepositoryStatus[];
  status: RepositoryStatus;
  catalogEntityName?: string;
  repository: Repository;
};

export type ImportJobs = {
  imports: ImportJobStatus[];
  page: number;
  size: number;
  totalCount: number;
};

export type PullRequest = {
  number: number;
  url: string;
  title: string;
  body: string;
  catalogInfoContent: string;
};

export type ImportJobStatus<
  Provider extends 'github' | 'gitlab' = 'github' | 'gitlab',
> = {
  approvalTool: ApprovalTool;
  task?: {
    taskId: string;
  };
  tasks?: ScaffolderTask[];
  status: string;
  id: string;
  source?: 'location' | 'config' | 'integration';
  lastUpdate: string;
  repository: Repository;
} & Partial<Record<Provider, { pullRequest: PullRequest }>>;

export function isGithubJob(
  job: ImportJobStatus<'github'> | ImportJobStatus<'gitlab'>,
): job is ImportJobStatus<'github'> {
  return 'github' in job;
}

export type OrgAndRepoResponse = {
  errors?: string[];
  repositories?: Repository[];
  organizations?: Repository[];
  totalCount: number;
  pagePerIntegration: number;
  sizePerIntegration: number;
  approvalTool?: ApprovalTool;
};
