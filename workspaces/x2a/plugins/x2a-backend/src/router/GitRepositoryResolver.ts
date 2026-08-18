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

import type { RootConfigService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { GitRepository } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

interface ResolveParams {
  project: {
    sourceRepoUrl: string;
    sourceRepoBranch: string;
    targetRepoUrl: string;
    targetRepoBranch: string;
  };
  sourceRepoAuth?: { token: string };
  targetRepoAuth?: { token: string };
}

interface ResolveResult {
  sourceRepo: GitRepository;
  targetRepo: GitRepository;
}

export class GitRepositoryResolver {
  private readonly config: RootConfigService;

  constructor(config: RootConfigService) {
    this.config = config;
  }

  resolve(params: ResolveParams): ResolveResult {
    const { project, sourceRepoAuth, targetRepoAuth } = params;

    const sourceToken =
      sourceRepoAuth?.token ??
      this.config.getOptionalString('x2a.git.sourceRepo.token');

    const targetToken =
      targetRepoAuth?.token ??
      this.config.getOptionalString('x2a.git.targetRepo.token');

    if (!sourceToken) {
      throw new InputError(
        'Source repository token is required. Provide it in the request or configure x2a.git.sourceRepo.token.',
      );
    }
    if (!targetToken) {
      throw new InputError(
        'Target repository token is required. Provide it in the request or configure x2a.git.targetRepo.token.',
      );
    }

    return {
      sourceRepo: new GitRepository(
        project.sourceRepoUrl,
        project.sourceRepoBranch,
        sourceToken,
      ),
      targetRepo: new GitRepository(
        project.targetRepoUrl,
        project.targetRepoBranch,
        targetToken,
      ),
    };
  }
}
