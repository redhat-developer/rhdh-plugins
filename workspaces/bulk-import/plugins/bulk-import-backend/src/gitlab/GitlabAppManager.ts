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
  GitlabCredentials,
  GitLabIntegrationConfig,
  ScmIntegrationRegistry,
} from '@backstage/integration';

import {
  ExtendedGitlabCredentials,
  ExtendedGitlabCredentialsProvider,
} from './types';

// For reference
// https://github.com/backstage/backstage/blob/master/packages/integration/src/gitlab/SingleInstanceGitlabCredentialsProvider.ts

export class CustomSingleInstanceGitlabCredentialsProvider implements ExtendedGitlabCredentialsProvider {
  static readonly create: (
    config: GitLabIntegrationConfig,
  ) => ExtendedGitlabCredentialsProvider = config => {
    return new CustomSingleInstanceGitlabCredentialsProvider(config.token);
  };

  private constructor(private readonly token?: string) {}
  async getAllCredentials(_opts: {
    host: string;
  }): Promise<ExtendedGitlabCredentials[]> {
    const credentials: ExtendedGitlabCredentials[] = [];
    if (this.token) {
      credentials.push({
        headers: { Authorization: `Bearer ${this.token}` },
        token: this.token,
      });
    }
    return credentials;
  }
  getCredentials(_opts: { url: string }): Promise<GitlabCredentials> {
    throw new Error('Method not implemented.');
  }
}

export class CustomGitlabCredentialsProvider implements ExtendedGitlabCredentialsProvider {
  static fromIntegrations(integrations: ScmIntegrationRegistry) {
    const credentialsProviders: Map<string, ExtendedGitlabCredentialsProvider> =
      new Map<string, ExtendedGitlabCredentialsProvider>();

    integrations.gitlab.list().forEach(integration => {
      const credtialsProvider =
        CustomSingleInstanceGitlabCredentialsProvider.create(
          integration.config,
        );
      credentialsProviders.set(integration.config.host, credtialsProvider);
    });

    return new CustomGitlabCredentialsProvider(credentialsProviders);
  }

  private constructor(
    private readonly providers: Map<string, ExtendedGitlabCredentialsProvider>,
  ) {}
  async getAllCredentials(opts: {
    host: string;
  }): Promise<ExtendedGitlabCredentials[]> {
    const provider = this.providers.get(opts.host);

    if (!provider) {
      throw new Error(
        `There is no GitLab integration that matches ${opts.host}. Please add a configuration for an integration.`,
      );
    }
    return provider.getAllCredentials(opts);
  }
  getCredentials(_opts: { url: string }): Promise<GitlabCredentials> {
    throw new Error('Method not implemented.');
  }
}
