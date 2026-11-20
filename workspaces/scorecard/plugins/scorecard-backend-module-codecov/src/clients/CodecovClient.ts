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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import type { Entity } from '@backstage/catalog-model';

import type { CodecovRepoResponse } from './types';
import {
  CODECOV_REPO_ANNOTATION,
  CODECOV_ACCOUNT_ANNOTATION,
  CODECOV_SERVICE_ANNOTATION,
  CODECOV_OWNER_ANNOTATION,
  GITHUB_SLUG_ANNOTATION,
} from '../annotations';

const CODECOV_API_BASE = 'https://api.codecov.io/api/v2';
const DEFAULT_ACCOUNT_NAME = 'default';

export class CodecovClient {
  private readonly config: Config;
  private readonly logger: LoggerService;

  constructor(config: Config, logger: LoggerService) {
    this.config = config;
    this.logger = logger.child({ component: 'CodecovClient' });
  }

  private resolveAuthToken(accountName?: string): string | undefined {
    const codecovConfig = this.config.getOptionalConfig('codecov');
    if (!codecovConfig) {
      return undefined;
    }

    const resolvedName =
      accountName ??
      codecovConfig.getOptionalString('defaultAccount') ??
      DEFAULT_ACCOUNT_NAME;

    const accounts = codecovConfig.getOptionalConfigArray('accounts') ?? [];
    const account = accounts.find(a => a.getString('name') === resolvedName);

    if (!account) {
      if (accountName) {
        throw new Error(
          `Codecov account '${accountName}' not found in configuration`,
        );
      }
      return undefined;
    }

    return account.getOptionalString('authToken');
  }

  resolveApiParams(entity: Entity): {
    service: string;
    owner: string;
    repo: string;
  } {
    const annotations = entity.metadata.annotations ?? {};

    const repoAnnotation = annotations[CODECOV_REPO_ANNOTATION];
    if (!repoAnnotation) {
      throw new Error(
        `Entity '${entity.metadata.name}' is missing required annotation '${CODECOV_REPO_ANNOTATION}'`,
      );
    }

    // Resolve service
    let service = annotations[CODECOV_SERVICE_ANNOTATION];
    if (!service) {
      if (annotations[GITHUB_SLUG_ANNOTATION]) {
        service = 'github';
      } else {
        throw new Error(
          `Entity '${entity.metadata.name}' has no '${CODECOV_SERVICE_ANNOTATION}' annotation ` +
            `and no '${GITHUB_SLUG_ANNOTATION}' annotation to infer the service from`,
        );
      }
    }

    // Resolve owner and repo from annotations
    let owner = annotations[CODECOV_OWNER_ANNOTATION];
    let repo: string;

    if (repoAnnotation.includes('/')) {
      const slashIndex = repoAnnotation.indexOf('/');
      const extractedOwner = repoAnnotation.substring(0, slashIndex);
      repo = repoAnnotation.substring(slashIndex + 1);
      if (!owner) {
        owner = extractedOwner;
      }
    } else {
      repo = repoAnnotation;
      if (!owner) {
        throw new Error(
          `Entity '${entity.metadata.name}' has no '${CODECOV_OWNER_ANNOTATION}' annotation ` +
            `and '${CODECOV_REPO_ANNOTATION}' does not contain a slash to extract the owner from`,
        );
      }
    }

    return { service, owner, repo };
  }

  async getRepoData(entity: Entity): Promise<CodecovRepoResponse> {
    const { service, owner, repo } = this.resolveApiParams(entity);
    const accountName =
      entity.metadata.annotations?.[CODECOV_ACCOUNT_ANNOTATION];
    const authToken = this.resolveAuthToken(accountName);

    const url = `${CODECOV_API_BASE}/${encodeURIComponent(
      service,
    )}/${encodeURIComponent(owner)}/repos/${encodeURIComponent(repo)}/`;

    this.logger.debug(`Fetching Codecov data for ${service}/${owner}/${repo}`);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (authToken) {
      headers.Authorization = `bearer ${authToken}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(
        `Codecov API request failed with status ${response.status}: ${response.statusText}`,
      );
    }

    return (await response.json()) as CodecovRepoResponse;
  }
}
