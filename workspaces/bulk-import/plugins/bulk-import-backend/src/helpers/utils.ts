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

import { parseEntityRef, stringifyEntityRef } from '@backstage/catalog-model';
import { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';

import gitUrlParse from 'git-url-parse';

export function getNestedValue<T>(obj: T, path: string): any {
  return path
    .split('.')
    .reduce(
      (acc, key) =>
        acc && (acc as Record<string, any>)[key]
          ? (acc as Record<string, any>)[key]
          : undefined,
      obj,
    );
}

export function extractLocationOwnerMap(locationUrls: string[]) {
  const locationGitOwnerMap = new Map<string, string>();
  for (const locationUrl of locationUrls) {
    const split = locationUrl.split('/blob/');
    if (split.length < 2) {
      continue;
    }
    locationGitOwnerMap.set(locationUrl, gitUrlParse(split[0]).owner);
  }
  return locationGitOwnerMap;
}

export function computeTotalCount<T>(
  data: T[],
  countList: number[],
  pageSize: number,
) {
  let totalCount = countList.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0,
  );
  if (totalCount < pageSize) {
    totalCount = data.length;
  }
  return totalCount;
}

export function parseGitURLForApprovalTool(
  repoUrl: string,
  config: Config,
): 'GIT' | 'GITLAB' {
  const parsedRepoUrl = new URL(repoUrl);

  const gitlabConfigs = config.getOptionalConfigArray('integrations.gitlab');
  if (gitlabConfigs) {
    const gitlabHosts = gitlabConfigs.map(c => c.getString('host'));
    if (gitlabHosts.includes(parsedRepoUrl.hostname)) {
      return 'GITLAB';
    }
  }

  const githubConfigs = config.getOptionalConfigArray('integrations.github');
  if (githubConfigs) {
    const githubHosts = githubConfigs.map(c => c.getString('host'));
    if (githubHosts.includes(parsedRepoUrl.hostname)) {
      return 'GIT';
    }
  }

  // Fallback for backward compatibility if integrations are not configured for the host
  if (parsedRepoUrl.hostname.includes('gitlab')) {
    return 'GITLAB';
  }

  return 'GIT';
}

export function getImportTemplateRef(templateRef: string): string {
  try {
    const { name, namespace, kind } = parseEntityRef(templateRef, {
      defaultKind: 'template',
      defaultNamespace: 'default',
    });

    if (kind !== 'template') {
      throw new InputError(
        `Invalid 'kind' in bulkImport.importTemplate: expected 'template' but got '${kind}'.`,
      );
    }

    return stringifyEntityRef({ kind, namespace, name });
  } catch (err) {
    throw new InputError(
      `Invalid scaffolder template entity reference in the configuration 'bulkImport.importTemplate': '${templateRef}'. ` +
        `Error: ${(err as Error).message}`,
    );
  }
}
