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

import { Gitlab } from '@gitbeaker/rest';

import {
  type ExtendedGitlabCredentials,
  type GitlabFetchError,
} from '../types';

const GITLAB_BASEURL_ENDPOINT = 'https://gitlab.com';

export function buildGitlab(
  _deps: {
    logger: LoggerService;
    cache: CacheService;
  },
  input: {
    credential: ExtendedGitlabCredentials;
    owner?: string;
    errors?: Map<number, GitlabFetchError>;
  },
  baseUrl: string = GITLAB_BASEURL_ENDPOINT,
): InstanceType<typeof Gitlab<false>> {
  const apiThing = new Gitlab({
    host: baseUrl,
    token: input.credential.token,
  });
  return apiThing;
}
