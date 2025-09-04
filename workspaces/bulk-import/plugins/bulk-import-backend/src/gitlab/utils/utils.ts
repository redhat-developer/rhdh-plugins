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
  CacheService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import {
  ScmIntegrations,
  type GitLabIntegrationConfig,
} from '@backstage/integration';

import { Gitlab, OffsetPagination } from '@gitbeaker/rest';

import { logErrorIfNeeded } from '../../helpers';
import type { CustomGitlabCredentialsProvider } from '../GitlabAppManager';
import {
  type ExtendedGitlabCredentials,
  type GitlabFetchError,
} from '../types';
import { buildGitlab } from './glUtils';
import { validateAndBuildRepoData, ValidatedRepo } from './repoUtils';

// /**
//  * Creates the GitlabFetchError to be stored in the returned errors array of the returned GitlabRepositoryResponse object
//  */
export function createCredentialError(
  err?: Error,
): GitlabFetchError | undefined {
  if (err) {
    return {
      type: 'token',
      error: {
        name: err.name,
        message: err.message,
      },
    };
  }
  return undefined;
}

export function verifyAndGetIntegrations(
  deps: {
    logger: LoggerService;
  },

  integrations: ScmIntegrations,
) {
  const glConfigs = integrations.gitlab.list().map(glInit => glInit.config);

  if (glConfigs.length === 0) {
    deps.logger.debug(
      'No GitLab Integration in config => returning an empty list of repositories.',
    );
    throw new Error(
      "Looks like there is no GitLab Integration in config. Please add a configuration entry under 'integrations.gitlab",
    );
  }
  return glConfigs;
}

export async function getCredentialsFromIntegrations(
  gitlabCredentialsProvider: CustomGitlabCredentialsProvider,
  glConfigs: GitLabIntegrationConfig[],
) {
  const credentialsByConfig = new Map<
    GitLabIntegrationConfig,
    ExtendedGitlabCredentials[]
  >();
  for (const glConfig of glConfigs) {
    const creds = await getCredentialsForConfig(
      gitlabCredentialsProvider,
      glConfig,
    );
    credentialsByConfig.set(glConfig, creds);
  }
  return credentialsByConfig;
}

export async function getCredentialsForConfig(
  gitlabCredentialsProvider: CustomGitlabCredentialsProvider,
  glConfig: GitLabIntegrationConfig,
) {
  return await gitlabCredentialsProvider.getAllCredentials({
    host: glConfig.host,
  });
}

export function handleError(
  deps: {
    logger: LoggerService;
  },
  desc: string,
  _credential: ExtendedGitlabCredentials,
  errors: Map<number, GitlabFetchError>,
  err: any,
) {
  logErrorIfNeeded(deps.logger, `${desc} failed`, err);
  const credentialError = createCredentialError(err as Error);
  if (credentialError) {
    errors.set(-1, credentialError);
  }
}

export async function computeTotalCountFromPaginationInfo(
  deps: {
    logger: LoggerService;
  },
  paginationInfo: OffsetPagination,
  pageSize?: number,
): Promise<number | undefined> {
  /*
    paginationInfo: {
      total: , This is the total amount of repos, but will be NaN if the value is above 10k, see: https://github.com/jdalrymple/gitbeaker/issues/839#issuecomment-636482319
      next: ,
      current: ,
      previous: ,
      perPage: ,
      totalPages:
    }
  */

  if (isNaN(paginationInfo.total)) {
    deps.logger.debug(
      `Too many result, total count is NaN, returning current page size`,
    );
    return pageSize;
  }
  return paginationInfo.total;
}

export async function executeFunctionOnFirstSuccessfulIntegration<T>(
  deps: {
    logger: LoggerService;
    cache: CacheService;
    config: Config;
    gitlabCredentialsProvider: CustomGitlabCredentialsProvider;
  },
  integrations: ScmIntegrations,
  params: {
    repoUrl: string;
    fn: (
      validatedRepo: ValidatedRepo,
      gitlab: InstanceType<typeof Gitlab<false>>,
    ) => Promise<{ successful: boolean; result?: T }>;
  },
) {
  const validatedRepo = await validateAndBuildRepoData(
    deps.gitlabCredentialsProvider,
    integrations,
    deps.config,
    params,
  );
  for (const credential of validatedRepo.credentials) {
    const glKit = buildGitlab(
      deps,
      { credential, owner: validatedRepo.owner },
      validatedRepo.glConfig.baseUrl,
    );
    const res = await params.fn(validatedRepo, glKit);
    if (!res.successful) {
      continue;
    }
    return res.result;
  }
  return undefined;
}

export async function fetchFromAllIntegrations<T>(
  deps: {
    logger: LoggerService;
    cache: CacheService;
    gitlabCredentialsProvider: CustomGitlabCredentialsProvider;
  },
  integrations: ScmIntegrations,
  params: {
    dataFetcher: (
      gitlab: InstanceType<typeof Gitlab<false>>,
      credential: ExtendedGitlabCredentials,
      glConfig: GitLabIntegrationConfig,
    ) => Promise<{
      stopFetchingData?: boolean;
      result?: T;
      errors?: GitlabFetchError[];
    }>;
  },
) {
  const glConfigs = verifyAndGetIntegrations(deps, integrations);

  const credentialsByConfig = await getCredentialsFromIntegrations(
    deps.gitlabCredentialsProvider,
    glConfigs,
  );
  const errors = new Map<number, GitlabFetchError>();
  const data: T[] = [];
  const dataErrs: GitlabFetchError[] = [];
  let stopFetchingData: boolean | undefined = false;
  for (const [glConfig, credentials] of credentialsByConfig) {
    if (stopFetchingData) {
      break;
    }
    deps.logger.debug(
      `Got ${credentials.length} credential(s) for ${glConfig.host}`,
    );
    for (const credential of credentials) {
      const glKit = buildGitlab(deps, { credential, errors }, glConfig.baseUrl);
      const res = await params.dataFetcher(glKit, credential, glConfig);
      res.errors?.forEach(err => dataErrs.push(err));

      if (res.result) {
        data.push(res.result);
      }

      stopFetchingData = res.stopFetchingData;
    }
  }

  const aggregatedErrors = new Map<number, GitlabFetchError>();
  errors.forEach((err, num) => aggregatedErrors.set(num, err));
  dataErrs.forEach((err, idx) => aggregatedErrors.set(idx, err));

  return { data, errors: aggregatedErrors };
}
