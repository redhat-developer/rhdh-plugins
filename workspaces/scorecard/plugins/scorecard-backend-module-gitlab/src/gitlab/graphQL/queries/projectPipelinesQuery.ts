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

import type { PipelinesStatus } from '../../types';

export type ProjectPipelinesVariables = {
  projectPath: string;
  status?: PipelinesStatus;
  first?: number;
  updatedAfter: string;
  after?: string | null;
};

export type GitlabGraphqlPipelineNode = {
  startedAt?: string | null;
  finishedAt?: string | null;
  status?: string | null;
};

export type ProjectPipelinesConnection = {
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
  nodes: Array<GitlabGraphqlPipelineNode | null>;
};

export type ProjectPipelinesResponse = {
  project: {
    pipelines: ProjectPipelinesConnection | null;
  } | null;
};

export const PROJECT_PIPELINES_QUERY = `
  query projectPipelines(
    $projectPath: ID!
    $updatedAfter: Time
    $status: PipelineStatusEnum
    $first: Int
    $after: String
  ) {
    project(fullPath: $projectPath) {
      pipelines(
        updatedAfter: $updatedAfter
        status: $status
        first: $first
        after: $after
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          startedAt
          finishedAt
          status
        }
      }
    }
  }
`;
