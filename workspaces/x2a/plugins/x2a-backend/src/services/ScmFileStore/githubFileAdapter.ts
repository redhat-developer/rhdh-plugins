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

import { InputError, ServiceUnavailableError } from '@backstage/errors';
import { parseRepoUrl } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import {
  commonStatusError,
  errorDetail,
  ScmErrorContext,
  staleVersionError,
  unexpectedStatusError,
} from './httpErrors';
import { FetchFn, scmRequest } from './scmRequest';
import { ScmFile, ScmFileLocation, ScmFilePutParams } from './types';

/** github.com is served by a dedicated API host, GitHub Enterprise under /api/v3. */
const apiBaseUrl = (origin: string) =>
  origin === 'https://github.com'
    ? 'https://api.github.com'
    : `${origin}/api/v3`;

function contentsUrl(loc: ScmFileLocation): string {
  const { origin, path } = parseRepoUrl(loc.repoUrl);
  const [owner, repo] = path.split('/').filter(Boolean);
  if (!owner || !repo) {
    throw new InputError(
      `Cannot determine the GitHub owner and repository from "${loc.repoUrl}".`,
    );
  }
  const filePath = loc.path.split('/').map(encodeURIComponent).join('/');
  return `${apiBaseUrl(origin)}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${filePath}`;
}

const headers = (token: string) => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
});

const ctxOf = (loc: ScmFileLocation): ScmErrorContext => ({
  providerLabel: 'GitHub',
  repoUrl: loc.repoUrl,
  branch: loc.branch,
  path: loc.path,
});

/** `token` is the bare token. */
export async function githubGetFile(
  fetchFn: FetchFn,
  loc: ScmFileLocation,
): Promise<ScmFile> {
  const ctx = ctxOf(loc);
  const response = await scmRequest(
    fetchFn,
    `${contentsUrl(loc)}?ref=${encodeURIComponent(loc.branch)}`,
    { headers: headers(loc.token) },
    ctx,
  );
  if (!response.ok) {
    throw (
      commonStatusError(ctx, response.status, 'read') ??
      unexpectedStatusError(ctx, response.status, await errorDetail(response))
    );
  }

  const body = await response.json();
  if (Array.isArray(body) || body?.type !== 'file') {
    throw new InputError(`"${loc.path}" is not a file in ${loc.repoUrl}.`);
  }
  if (body.encoding !== 'base64' || typeof body.content !== 'string') {
    throw new ServiceUnavailableError(
      `"${loc.path}" is too large to be edited here (GitHub does not return its content). Edit it directly in GitHub.`,
    );
  }
  return {
    content: Buffer.from(body.content, 'base64').toString('utf-8'),
    version: body.sha,
  };
}

export async function githubPutFile(
  fetchFn: FetchFn,
  params: ScmFilePutParams,
): Promise<{ version: string }> {
  const ctx = ctxOf(params);
  const response = await scmRequest(
    fetchFn,
    contentsUrl(params),
    {
      method: 'PUT',
      headers: { ...headers(params.token), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: params.message,
        content: Buffer.from(params.content, 'utf-8').toString('base64'),
        sha: params.expectedVersion,
        branch: params.branch,
      }),
    },
    ctx,
  );
  if (!response.ok) {
    if (response.status === 409) {
      throw staleVersionError(ctx);
    }
    const detail = await errorDetail(response);
    // GitHub answers 409 for a stale sha, but validation failures about the sha
    // (e.g. the file was recreated) come as 422.
    if (response.status === 422 && /\bsha\b/i.test(detail ?? '')) {
      throw staleVersionError(ctx);
    }
    throw (
      commonStatusError(ctx, response.status, 'write') ??
      unexpectedStatusError(ctx, response.status, detail)
    );
  }

  const body = await response.json();
  if (typeof body?.content?.sha !== 'string') {
    throw unexpectedStatusError(
      ctx,
      response.status,
      'the response carries no new version',
    );
  }
  return { version: body.content.sha };
}
