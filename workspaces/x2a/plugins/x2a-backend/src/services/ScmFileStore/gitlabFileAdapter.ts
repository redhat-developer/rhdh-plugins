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

import { ServiceUnavailableError } from '@backstage/errors';
import { parseRepoUrl } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import {
  commonStatusError,
  errorDetail,
  pushDeniedError,
  ScmErrorContext,
  staleVersionError,
  unexpectedStatusError,
} from './httpErrors';
import { FetchFn, scmRequest } from './scmRequest';
import { ScmFile, ScmFileLocation, ScmFilePutParams } from './types';

function fileUrl(loc: ScmFileLocation): string {
  const { origin, path } = parseRepoUrl(loc.repoUrl);
  // GitLab addresses a project by its URL-encoded full path (groups and subgroups included)
  const projectId = encodeURIComponent(path.replace(/^\//, ''));
  return `${origin}/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(loc.path)}`;
}

const headers = (token: string) => ({ Authorization: `Bearer ${token}` });

const ctxOf = (loc: ScmFileLocation): ScmErrorContext => ({
  providerLabel: 'GitLab',
  repoUrl: loc.repoUrl,
  branch: loc.branch,
  path: loc.path,
});

/** `token` is the bare token. */
export async function gitlabGetFile(
  fetchFn: FetchFn,
  loc: ScmFileLocation,
): Promise<ScmFile> {
  const ctx = ctxOf(loc);
  const response = await scmRequest(
    fetchFn,
    `${fileUrl(loc)}?ref=${encodeURIComponent(loc.branch)}`,
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
  if (body?.encoding !== 'base64' || typeof body.content !== 'string') {
    throw new ServiceUnavailableError(
      `GitLab returned "${loc.path}" in an unexpected format. Edit it directly in GitLab.`,
    );
  }
  return {
    content: Buffer.from(body.content, 'base64').toString('utf-8'),
    // The last commit that touched the file: it changes if and only if the file is changed
    version: body.last_commit_id,
  };
}

export async function gitlabPutFile(
  fetchFn: FetchFn,
  params: ScmFilePutParams,
): Promise<{ version: string }> {
  const ctx = ctxOf(params);
  const response = await scmRequest(
    fetchFn,
    fileUrl(params),
    {
      method: 'PUT',
      headers: { ...headers(params.token), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branch: params.branch,
        content: params.content,
        commit_message: params.message,
        last_commit_id: params.expectedVersion,
      }),
    },
    ctx,
  );
  if (!response.ok) {
    const detail = await errorDetail(response);
    // Stale `last_commit_id` is answered with 400 (or 409 by some versions)
    if (
      response.status === 409 ||
      (response.status === 400 &&
        /changed since|last_commit_id/i.test(detail ?? ''))
    ) {
      throw staleVersionError(ctx);
    }
    if (
      response.status === 400 &&
      /not allowed to push|protected/i.test(detail ?? '')
    ) {
      throw pushDeniedError(ctx);
    }
    throw (
      commonStatusError(ctx, response.status, 'write') ??
      unexpectedStatusError(ctx, response.status, detail)
    );
  }

  // The update response carries no commit id: read the file back for its new version
  try {
    const { version } = await gitlabGetFile(fetchFn, params);
    return { version };
  } catch (e) {
    throw new ServiceUnavailableError(
      'Your changes were committed to GitLab, but the new version could not be read back. Use Reload to continue editing.',
      { cause: e as Error },
    );
  }
}
