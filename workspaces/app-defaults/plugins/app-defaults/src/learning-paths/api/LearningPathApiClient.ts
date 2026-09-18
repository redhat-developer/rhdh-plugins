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

import {
  ConfigApi,
  createApiRef,
  DiscoveryApi,
  IdentityApi,
} from '@backstage/core-plugin-api';

import { LearningPathLink } from '../types';
import { parseLearningPathLinks } from './parseLearningPathLinks';

const DEFAULT_PROXY_PATH = '/developer-hub';

/**
 * API for loading Learning Paths catalog data from the Developer Hub proxy.
 *
 * @internal
 */
export interface LearningPathApi {
  /**
   * Loads learning path cards from the Developer Hub proxy.
   *
   * Reads `developerHub.proxyPath` from config (default `/developer-hub`) and
   * requests `{proxyBaseUrl}{proxyPath}/learning-paths` with the current
   * Backstage identity token when available.
   *
   * @throws Error when the request fails or the response is not a valid array of learning paths.
   */
  getLearningPathData(): Promise<LearningPathLink[]>;
}

/**
 * ApiRef for {@link LearningPathApi}.
 *
 * @internal
 */
export const learningPathApiRef = createApiRef<LearningPathApi>({
  id: 'app.developer-hub.learning-path.service',
});

/**
 * Options for constructing a {@link LearningPathApiClient}.
 *
 * @internal
 */
export type LearningPathApiClientOptions = {
  discoveryApi: DiscoveryApi;
  configApi: ConfigApi;
  identityApi: IdentityApi;
};

/**
 * Client that loads Learning Paths data via the backend proxy.
 *
 * @internal
 */
export class LearningPathApiClient implements LearningPathApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly configApi: ConfigApi;
  private readonly identityApi: IdentityApi;

  constructor(options: LearningPathApiClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.configApi = options.configApi;
    this.identityApi = options.identityApi;
  }

  private async getBaseUrl() {
    const proxyPath =
      this.configApi.getOptionalString('developerHub.proxyPath') ??
      DEFAULT_PROXY_PATH;
    return `${await this.discoveryApi.getBaseUrl('proxy')}${proxyPath}`;
  }

  private async fetcher(url: string) {
    const { token: idToken } = await this.identityApi.getCredentials();
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(idToken && { Authorization: `Bearer ${idToken}` }),
      },
    });
    if (!response.ok) {
      throw new Error(
        `failed to fetch data, status ${response.status}: ${response.statusText}`,
      );
    }
    return await response.json();
  }

  /** {@inheritDoc LearningPathApi.getLearningPathData} */
  async getLearningPathData(): Promise<LearningPathLink[]> {
    const proxyUrl = await this.getBaseUrl();
    const data = await this.fetcher(`${proxyUrl}/learning-paths`);
    return parseLearningPathLinks(data);
  }
}
