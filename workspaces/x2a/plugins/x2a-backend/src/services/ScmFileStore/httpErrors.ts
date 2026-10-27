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
  AuthenticationError,
  ConflictError,
  NotAllowedError,
  NotFoundError,
  ServiceUnavailableError,
} from '@backstage/errors';

/** Human readable context of a failed SCM call, used to compose the messages. */
export interface ScmErrorContext {
  /** E.g. "GitHub". */
  providerLabel: string;
  repoUrl: string;
  branch: string;
  path: string;
}

export const staleVersionError = (ctx: ScmErrorContext) =>
  new ConflictError(
    `"${ctx.path}" was changed in ${ctx.providerLabel} after you opened it, so your changes were not saved. ` +
      'Copy your changes somewhere safe, use Reload to get the latest version and apply them again.',
  );

export const pushDeniedError = (ctx: ScmErrorContext) =>
  new NotAllowedError(
    `You are not allowed to push to branch "${ctx.branch}" of ${ctx.repoUrl}. ` +
      'The branch may be protected. Ask a repository administrator for write access to the branch, ' +
      `or edit the document directly in ${ctx.providerLabel}.`,
  );

export const networkError = (ctx: ScmErrorContext, cause: unknown) =>
  new ServiceUnavailableError(
    `Could not reach ${ctx.providerLabel} (${
      cause instanceof Error ? cause.message : String(cause)
    }). Try again in a moment. If the problem persists, contact your administrator.`,
  );

export const unexpectedStatusError = (
  ctx: ScmErrorContext,
  status: number,
  detail?: string,
) =>
  new ServiceUnavailableError(
    `${ctx.providerLabel} answered with an unexpected status ${status}${
      detail ? `: ${detail}` : ''
    }. Try again in a moment. If the problem persists, contact your administrator.`,
  );

/**
 * Maps the statuses all the providers share. Returns undefined for the statuses
 * where the providers differ, so the caller can handle them first.
 */
export function commonStatusError(
  ctx: ScmErrorContext,
  status: number,
  mode: 'read' | 'write',
): Error | undefined {
  switch (status) {
    case 401:
      return new AuthenticationError(
        `${ctx.providerLabel} rejected the access token. Sign in to ${ctx.providerLabel} again and retry.`,
      );
    case 403:
      return mode === 'write'
        ? pushDeniedError(ctx)
        : new NotAllowedError(
            `Your ${ctx.providerLabel} account is not allowed to read ${ctx.repoUrl}. ` +
              'Ask a repository administrator for access.',
          );
    case 404:
      return new NotFoundError(
        `"${ctx.path}" was not found on branch "${ctx.branch}" of ${ctx.repoUrl}. ` +
          'The file, branch or repository may have been moved or deleted, or your account may not have access to the repository. ' +
          `Check them in ${ctx.providerLabel}.`,
      );
    default:
      return status >= 500 ? unexpectedStatusError(ctx, status) : undefined;
  }
}

export async function errorDetail(
  response: Response,
): Promise<string | undefined> {
  try {
    const body = await response.json();
    const message = body?.message ?? body?.error ?? body?.error_description;
    return typeof message === 'string' ? message : undefined;
  } catch {
    return undefined;
  }
}
