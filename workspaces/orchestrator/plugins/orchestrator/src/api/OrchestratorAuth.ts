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
  ApiRef,
  githubAuthApiRef,
  gitlabAuthApiRef,
  microsoftAuthApiRef,
} from '@backstage/core-plugin-api';

import {
  AuthToken,
  AuthTokenDescriptor,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { OrchestratorAuthAPi } from './authApi';

type ExtractApiRefType<T> = T extends ApiRef<infer U> ? U : never;

export interface OrchestratorAuthDependencies {
  githubAuthApi: ExtractApiRefType<typeof githubAuthApiRef>;
  gitlabAuthApi: ExtractApiRefType<typeof gitlabAuthApiRef>;
  microsoftAuthApi: ExtractApiRefType<typeof microsoftAuthApiRef>;
}
export class OrchestratorAuth implements OrchestratorAuthAPi {
  private readonly deps: OrchestratorAuthDependencies;
  constructor(deps: OrchestratorAuthDependencies) {
    this.deps = deps;
  }

  private async getToken(
    tokenDescriptor: AuthTokenDescriptor,
  ): Promise<AuthToken> {
    let token: string;
    switch (tokenDescriptor.provider) {
      case 'github': {
        if (tokenDescriptor.tokenType === 'openId') {
          throw new Error(
            'Github backstage auth API does not support oidc auth tokens',
          );
        } else {
          token = await this.deps.githubAuthApi.getAccessToken(
            tokenDescriptor.scope,
          );
        }
        break;
      }
      case 'gitlab': {
        if (tokenDescriptor.tokenType === 'openId') {
          token = await this.deps.gitlabAuthApi.getIdToken();
        } else {
          token = await this.deps.gitlabAuthApi.getAccessToken();
        }

        break;
      }
      case 'microsoft': {
        if (tokenDescriptor.tokenType === 'openId') {
          token = await this.deps.microsoftAuthApi.getIdToken();
        } else {
          token = await this.deps.microsoftAuthApi.getAccessToken();
        }
        break;
      }
      default: {
        throw new Error(
          `Schema contains unsupported authentication provider: ${tokenDescriptor.provider}. The supported providers are: github, gitlab and microsoft`,
        );
      }
    }
    return {
      token,
      provider: tokenDescriptor.provider,
    };
  }

  public async authenticate(
    tokenDescriptors: AuthTokenDescriptor[],
  ): Promise<Array<AuthToken>> {
    const authTokens: Array<AuthToken> = [];
    for (const tokenDescriptor of tokenDescriptors) {
      authTokens.push(await this.getToken(tokenDescriptor));
    }
    return authTokens;
  }
}
