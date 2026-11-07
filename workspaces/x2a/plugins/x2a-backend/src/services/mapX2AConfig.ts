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

import type { X2AConfig } from './types';
import { trimGitCaBundle } from './gitTls';
import {
  DEFAULT_LLM_MODEL,
  DEFAULT_KUBERNETES_IMAGE,
  DEFAULT_KUBERNETES_IMAGE_TAG,
  DEFAULT_TTL_SECONDS_AFTER_FINISHED,
  DEFAULT_CPU_REQUEST,
  DEFAULT_MEMORY_REQUEST,
  DEFAULT_CPU_LIMIT,
  DEFAULT_MEMORY_LIMIT,
  DEFAULT_GIT_AUTHOR_NAME,
  DEFAULT_GIT_AUTHOR_EMAIL,
} from './constants';

/**
 * Maps raw `x2a` app-config onto runtime `X2AConfig`.
 * `kubeServiceFactory` must use this (it does not spread `rawConfig.git`).
 */
export function mapX2AConfig(
  rawConfig: X2AConfig,
  namespace: string,
): X2AConfig {
  const x2aConfig: X2AConfig = {
    kubernetes: {
      namespace,
      image: rawConfig?.kubernetes?.image ?? DEFAULT_KUBERNETES_IMAGE,
      imageTag: rawConfig?.kubernetes?.imageTag ?? DEFAULT_KUBERNETES_IMAGE_TAG,
      imagePullPolicy: rawConfig?.kubernetes?.imagePullPolicy,
      ttlSecondsAfterFinished:
        rawConfig?.kubernetes?.ttlSecondsAfterFinished ??
        DEFAULT_TTL_SECONDS_AFTER_FINISHED,
      resources: {
        requests: {
          cpu:
            rawConfig?.kubernetes?.resources?.requests?.cpu ??
            DEFAULT_CPU_REQUEST,
          memory:
            rawConfig?.kubernetes?.resources?.requests?.memory ??
            DEFAULT_MEMORY_REQUEST,
        },
        limits: {
          cpu:
            rawConfig?.kubernetes?.resources?.limits?.cpu ?? DEFAULT_CPU_LIMIT,
          memory:
            rawConfig?.kubernetes?.resources?.limits?.memory ??
            DEFAULT_MEMORY_LIMIT,
        },
      },
    },
    git: {
      author: {
        name: rawConfig?.git?.author?.name ?? DEFAULT_GIT_AUTHOR_NAME,
        email: rawConfig?.git?.author?.email ?? DEFAULT_GIT_AUTHOR_EMAIL,
      },
      caBundle: trimGitCaBundle(rawConfig?.git?.caBundle),
      useClusterTrustedCABundle:
        rawConfig?.git?.useClusterTrustedCABundle === true,
      skipSSLVerification: rawConfig?.git?.skipSSLVerification === true,
    },
    credentials: {
      llm: rawConfig?.credentials?.llm ?? {},
      aap: rawConfig?.credentials?.aap,
    },
  };

  if (!x2aConfig.credentials.llm.LLM_MODEL) {
    x2aConfig.credentials.llm.LLM_MODEL = DEFAULT_LLM_MODEL;
  }

  return x2aConfig;
}
