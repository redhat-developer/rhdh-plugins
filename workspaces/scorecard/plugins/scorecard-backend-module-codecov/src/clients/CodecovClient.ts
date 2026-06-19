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
import type { CodecovRepoResponse } from './types';

const CODECOV_API_BASE_URL = 'https://api.codecov.io/api/v2';
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

    const accounts = codecovConfig.getOptionalConfigArray('accounts') ?? [];
    const defaultAccountName =
      codecovConfig.getOptionalString('defaultAccount') ?? DEFAULT_ACCOUNT_NAME;
    const resolvedName = accountName ?? defaultAccountName;

    const account = accounts.find(a => a.getString('name') === resolvedName);
    if (account) {
      return account.getOptionalString('authToken');
    }

    // If a specific account was requested but not found, log a warning
    if (accountName) {
      this.logger.warn(
        `Codecov account '${accountName}' not found in configuration`,
      );
    }

    return undefined;
  }

  async getRepoInfo(
    service: string,
    owner: string,
    repo: string,
    accountName?: string,
  ): Promise<CodecovRepoResponse> {
    this.logger.debug(
      `Fetching Codecov repo info for ${service}/${owner}/${repo}`,
    );

    const url = `${CODECOV_API_BASE_URL}/${encodeURIComponent(
      service,
    )}/${encodeURIComponent(owner)}/repos/${encodeURIComponent(repo)}/`;
    const headers: Record<string, string> = {
      accept: 'application/json',
    };

    const authToken = this.resolveAuthToken(accountName);
    if (authToken) {
      headers.Authorization = `bearer ${authToken}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(
        `Codecov API error: ${response.status} ${response.statusText} for ${url}`,
      );
    }
    return response.json() as Promise<CodecovRepoResponse>;
  }
}
