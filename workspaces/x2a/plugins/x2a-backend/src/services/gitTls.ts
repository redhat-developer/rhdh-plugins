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

export const GIT_CA_VOLUME_NAME = 'git-ca';
export const GIT_CA_MOUNT_PATH = '/config/git-ca';
export const GIT_CA_DATA_KEY = 'extra-ca.pem';
export const GIT_CA_BUNDLE_FILE_PATH = `${GIT_CA_MOUNT_PATH}/${GIT_CA_DATA_KEY}`;

export function trimGitCaBundle(caBundle?: string): string | undefined {
  const trimmed = caBundle?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!trimmed.includes('-----BEGIN CERTIFICATE-----')) {
    throw new Error(
      'X2A configuration error: x2a.git.caBundle is set but is not a PEM certificate (missing -----BEGIN CERTIFICATE-----)',
    );
  }
  return trimmed;
}

export function resolveGitTls(
  config: Pick<X2AConfig, 'git'>,
  jobId: string,
): {
  trimmedCa: string | undefined;
  gitCaConfigMapName: string | undefined;
  useSkip: boolean;
} {
  const trimmedCa = trimGitCaBundle(config.git?.caBundle);
  return {
    trimmedCa,
    gitCaConfigMapName: trimmedCa ? `x2a-git-ca-${jobId}` : undefined,
    useSkip: config.git?.skipSSLVerification === true && !trimmedCa,
  };
}
