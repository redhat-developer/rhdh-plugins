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
  GithubCredentials,
  GithubCredentialsProvider,
} from '@backstage/integration';

export type {
  SCMFetchError as GithubFetchError,
  SCMOrganization as GithubOrganization,
  SCMOrganizationResponse as GithubOrganizationResponse,
  SCMRepository as GithubRepository,
  SCMRepositoryResponse as GithubRepositoryResponse,
} from '../scm/types';

export type AppCredentialFetchResult = AppCredential | AppCredentialError;

export type AppCredential = {
  appId: number;
  accessToken: string | undefined;
  installationAccountLogin?: string;
};
export type AppCredentialError = { appId: number; error: Error };

export type ExtendedGithubCredentials =
  | GithubCredentials
  | GithubAppCredentials
  | GithubAppError;

export type GithubAppCredentials = GithubCredentials & {
  type: 'app';
  appId: number;
  accountLogin?: string;
};

export type GithubAppError = {
  type: 'app';
  appId: number;
  error: Error;
};

export function isGithubAppCredential(
  credential: ExtendedGithubCredentials,
): credential is GithubAppCredentials {
  return 'appId' in credential && credential.type === 'app';
}

export interface ExtendedGithubCredentialsProvider extends GithubCredentialsProvider {
  getAllCredentials: (options: {
    host: string;
  }) => Promise<ExtendedGithubCredentials[]>;
}
