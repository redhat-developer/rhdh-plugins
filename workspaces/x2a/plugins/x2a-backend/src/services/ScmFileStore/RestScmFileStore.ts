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

import { InputError } from '@backstage/errors';
import {
  resolveScmProvider,
  ScmProviderName,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { githubGetFile, githubPutFile } from './githubFileAdapter';
import { gitlabGetFile, gitlabPutFile } from './gitlabFileAdapter';
import { FetchFn } from './scmRequest';
import {
  ScmFile,
  ScmFileLocation,
  ScmFilePutParams,
  ScmFileStore,
} from './types';

/**
 * {@link ScmFileStore} using the REST APIs of GitHub and GitLab, so no git
 * clone is needed for a single-file read or commit.
 *
 * Bitbucket is not supported for direct writes.
 */
export class RestScmFileStore implements ScmFileStore {
  constructor(
    private readonly hostProviderMap?: Map<string, ScmProviderName>,
    private readonly fetchFn: FetchFn = fetch,
  ) {}

  async getFile(location: ScmFileLocation): Promise<ScmFile> {
    const { name, loc } = this.prepare(location);
    return name === 'github'
      ? githubGetFile(this.fetchFn, loc)
      : gitlabGetFile(this.fetchFn, loc);
  }

  async putFile(params: ScmFilePutParams): Promise<{ version: string }> {
    const { name, loc } = this.prepare(params);
    const prepared = { ...params, token: loc.token };
    return name === 'github'
      ? githubPutFile(this.fetchFn, prepared)
      : gitlabPutFile(this.fetchFn, prepared);
  }

  private prepare<T extends ScmFileLocation>(
    location: T,
  ): { name: 'github' | 'gitlab'; loc: T } {
    const provider = resolveScmProvider(location.repoUrl, this.hostProviderMap);
    if (provider.name === 'bitbucket') {
      throw new InputError(
        'Direct editing is not supported for Bitbucket repositories yet. Open the document in Bitbucket and edit it there.',
      );
    }
    return {
      name: provider.name,
      loc: { ...location, token: provider.extractToken(location.token) },
    };
  }
}
