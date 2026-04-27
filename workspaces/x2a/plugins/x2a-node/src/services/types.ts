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

import type {
  JobStatusEnum,
  MigrationPhase,
  Artifact,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

/**
 * X2A configuration structure.
 * Runtime type extracted from `app-config.yaml` under the `x2a` key.
 * Defaults for optional values are defined in `x2a-backend/src/services/constants.ts`.
 * @public
 */
export interface X2AConfig {
  kubernetes: {
    namespace: string;
    image: string;
    imageTag: string;
    ttlSecondsAfterFinished: number;
    resources: {
      requests: {
        cpu: string;
        memory: string;
      };
      limits: {
        cpu: string;
        memory: string;
      };
    };
  };
  git?: {
    author?: {
      name: string;
      email: string;
    };
  };
  credentials: {
    llm: Record<string, string>;
    aap?: {
      url: string;
      orgName: string;
      oauthToken?: string;
      username?: string;
      password?: string;
      skipSSLVerification?: boolean;
    };
  };
}

/** @public */
export interface JobStatusInfo {
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
}

/** @public */
export interface CreateJobInput {
  projectId: string;
  moduleId?: string | null;
  log?: string | null;
  startedAt?: Date;
  finishedAt?: Date | null;
  status?: JobStatusEnum;
  phase: MigrationPhase;
  errorDetails?: string | null;
  k8sJobName?: string | null;
  callbackToken?: string | null;
  artifacts?: Pick<Artifact, 'type' | 'value'>[];
}

/** @public */
export type GitRepo = {
  url: string;
  branch: string;
  token: string;
};

/** @public */
export interface AAPCredentials {
  url: string;
  orgName: string;
  oauthToken?: string;
  username?: string;
  password?: string;
}

/** @public */
export interface JobCreateParams {
  jobId: string;
  projectId: string;
  projectName: string;
  projectAbbrev: string;
  phase: MigrationPhase;
  user: string;
  userPrompt?: string;
  callbackToken: string;
  callbackUrl: string;
  moduleId?: string;
  moduleName?: string;
  sourceRepo: GitRepo;
  targetRepo: GitRepo;
  aapCredentials?: AAPCredentials;
}
