/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

import { bitbucketProvider } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

export const CREATE_AAP_CONFIG_TEMPLATE_PATH =
  '/create/templates/default/x2a-publish-aap-config-template';

export type AapConfigTemplateValues = {
  sourceRepository: string;
  sourceBranch: string;
  sourceCommit: string;
  artifactPath: string;
  projectName: string;
  projectDirName: string;
  moduleName: string;
};

function toRepoPickerValue(repositoryUrl: string): string {
  try {
    const parsed = new URL(repositoryUrl);
    const parts = parsed.pathname
      .replace(/^\/+|\/+$/g, '')
      .replace(/\.git$/i, '')
      .split('/');
    const repository = parts.pop();
    const owner = parts.join('/');
    if (parsed.protocol !== 'https:' || !owner || !repository) {
      return repositoryUrl;
    }

    const query = new URLSearchParams(
      bitbucketProvider.matches(repositoryUrl)
        ? { workspace: owner, repo: repository }
        : { owner, repo: repository },
    );
    return `${parsed.host}?${query.toString()}`;
  } catch {
    return repositoryUrl;
  }
}

export const buildAapConfigTemplateUrl = (
  values: AapConfigTemplateValues,
): string =>
  `${CREATE_AAP_CONFIG_TEMPLATE_PATH}?formData=${encodeURIComponent(
    JSON.stringify({
      ...values,
      sourceRepository: toRepoPickerValue(values.sourceRepository),
    }),
  )}`;
