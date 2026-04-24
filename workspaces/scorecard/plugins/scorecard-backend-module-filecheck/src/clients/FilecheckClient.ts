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

import type { UrlReaderService } from '@backstage/backend-plugin-api';
import { getEntitySourceLocation, type Entity } from '@backstage/catalog-model';
import { NotFoundError } from '@backstage/errors';
import { type ScmIntegration, ScmIntegrations } from '@backstage/integration';

const BRANCH_REF_PATTERNS: Record<string, RegExp> = {
  github: /\/(blob|tree|edit)\//,
  gitlab: /\/\-\/(blob|tree|edit)\//,
  bitbucketCloud: /\/(src|raw)\//,
  bitbucketServer: /\/browse\//,
};

const DEFAULT_REF_SUFFIXES: Record<string, string> = {
  github: '/blob/HEAD/',
  gitlab: '/-/blob/HEAD/',
  bitbucketCloud: '/src/HEAD/',
  bitbucketServer: '/browse/',
};

/**
 * Bare repo URLs (e.g. "https://github.com/org/repo") lack a branch reference,
 * which causes `resolveUrl` to produce URLs like "/org/repo/README.md" that the
 * UrlReader cannot parse. This function appends a default branch ref (HEAD) when
 * the URL doesn't already contain one.
 */
function ensureBranchRef(target: string, integration: ScmIntegration): string {
  const pattern = BRANCH_REF_PATTERNS[integration.type];
  if (pattern && pattern.test(target)) {
    return target;
  }

  const suffix = DEFAULT_REF_SUFFIXES[integration.type] ?? '/blob/HEAD/';
  return `${target.replace(/\/$/, '')}${suffix}`;
}

export class FilecheckClient {
  private readonly urlReader: UrlReaderService;
  private readonly integrations: ScmIntegrations;

  constructor(urlReader: UrlReaderService, integrations: ScmIntegrations) {
    this.urlReader = urlReader;
    this.integrations = integrations;
  }

  /**
   * Returns true if the given file path exists in the entity's source repository.
   */
  async fileExists(entity: Entity, filePath: string): Promise<boolean> {
    const { target } = getEntitySourceLocation(entity);
    const integration = this.integrations.byUrl(target);

    if (!integration) {
      throw new Error(`No SCM integration found for URL '${target}'`);
    }

    const baseUrl = ensureBranchRef(target, integration);
    const fileUrl = integration.resolveUrl({
      url: `/${filePath}`,
      base: baseUrl,
    });

    try {
      await this.urlReader.readUrl(fileUrl);
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }
}
