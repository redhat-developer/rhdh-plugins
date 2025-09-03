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

import { mockServices } from '@backstage/backend-test-utils';
import { ScmIntegrations } from '@backstage/integration';

import {
  CustomGitlabCredentialsProvider,
  CustomSingleInstanceGitlabCredentialsProvider,
} from './GitlabAppManager';

describe('CustomSingleInstanceGithubCredentialsProvider tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('CustomSingleInstanceGithubCredentialsProvider #GetAllCredentials Tests', () => {
    it('should return a list of access tokens the PAT token', async () => {
      const multipleGitlabApps =
        CustomSingleInstanceGitlabCredentialsProvider.create({
          host: 'gitlab.com',
          token: 'ghp_pat-token',
          apiBaseUrl: '',
          baseUrl: '',
        });
      const response = await multipleGitlabApps.getAllCredentials({
        host: 'gitlab.com',
      });
      const expected_response = [
        {
          headers: { Authorization: `Bearer ghp_pat-token` },
          token: 'ghp_pat-token',
        },
      ];
      expect(response).toEqual(expected_response);
    });
  });
});

describe('CustomGithubCredentialsProvider tests', () => {
  let integrations: ScmIntegrations;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    integrations = ScmIntegrations.fromConfig(
      mockServices.rootConfig({
        data: {
          integrations: {
            gitlab: [
              {
                host: 'gitlab.com',
                apiBaseUrl: 'https://gitlab.com/api',
                token: 'hardcoded_token',
              },
              {
                host: 'gritlab.com',
                apiBaseUrl: 'https://gitlab.com/api',
                token: 'hardcoded_token_2',
              },
            ],
          },
        },
      }),
    );
  });

  describe('.create', () => {
    it('passes the config through to the custom provider', () => {
      jest.spyOn(CustomSingleInstanceGitlabCredentialsProvider, 'create');
      CustomGitlabCredentialsProvider.fromIntegrations(integrations);
      const gitlabIntegration =
        integrations.gitlab.byHost('gitlab.com')?.config;
      const gritlabIntegration =
        integrations.gitlab.byHost('gritlab.com')?.config;
      expect(
        CustomSingleInstanceGitlabCredentialsProvider.create,
      ).toHaveBeenCalledWith(gitlabIntegration);
      expect(
        CustomSingleInstanceGitlabCredentialsProvider.create,
      ).toHaveBeenCalledWith(gritlabIntegration);
    });
  });

  describe('#getAllCredentials', () => {
    it('returns the access tokens for all tokens on a gitlab org/user', async () => {
      const customIntegrations = ScmIntegrations.fromConfig(
        mockServices.rootConfig({
          data: {
            integrations: {
              gitlab: [
                {
                  host: 'gitlab.com',
                  token: 'hardcoded_token',
                  apiBaseUrl: 'https://gitlab.com/api',
                },
              ],
            },
          },
        }),
      );
      const provider =
        CustomGitlabCredentialsProvider.fromIntegrations(customIntegrations);

      const gitlabAccessTokens = await provider.getAllCredentials({
        host: 'gitlab.com',
      });

      const expected_response = [
        {
          headers: { Authorization: 'Bearer hardcoded_token' },
          token: 'hardcoded_token',
        },
      ];
      expect(gitlabAccessTokens).toEqual(expected_response);
    });
    it('throws an error if an host without a corresponding gitlab integration is provided', async () => {
      const provider =
        CustomGitlabCredentialsProvider.fromIntegrations(integrations);
      await expect(
        provider.getAllCredentials({
          host: 'invalid.com',
        }),
      ).rejects.toThrow(
        'There is no GitLab integration that matches invalid.com. Please add a configuration for an integration.',
      );
    });
  });
});
