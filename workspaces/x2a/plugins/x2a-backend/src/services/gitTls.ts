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

export const CLUSTER_CA_CONFIG_MAP_NAME = 'x2a-cluster-trusted-ca';
export const CLUSTER_CA_VOLUME_NAME = 'cluster-ca';
export const CLUSTER_CA_MOUNT_PATH = '/config/cluster-ca';
export const CLUSTER_CA_DATA_KEY = 'ca-bundle.crt';
export const CLUSTER_CA_BUNDLE_FILE_PATH = `${CLUSTER_CA_MOUNT_PATH}/${CLUSTER_CA_DATA_KEY}`;
export const INJECT_TRUSTED_CABUNDLE_LABEL =
  'config.openshift.io/inject-trusted-cabundle';
export const X2A_MANAGED_BY_LABEL = 'app.kubernetes.io/managed-by';
export const X2A_MANAGED_BY_VALUE = 'x2a-backend-plugin';

export const CLUSTER_CA_WAIT_TIMEOUT_MS = 30_000;
export const CLUSTER_CA_POLL_INTERVAL_MS = 250;

export const CLUSTER_CA_PEM_MARKER = '-----BEGIN CERTIFICATE-----';

export const CLUSTER_CA_LABELS: Record<string, string> = {
  'app.kubernetes.io/name': CLUSTER_CA_CONFIG_MAP_NAME,
  'app.kubernetes.io/component': 'cluster-trusted-ca',
  [X2A_MANAGED_BY_LABEL]: X2A_MANAGED_BY_VALUE,
  [INJECT_TRUSTED_CABUNDLE_LABEL]: 'true',
};

const CLUSTER_CA_OPERATOR_HINT = `This requires OpenShift Cluster Network Operator (label ${INJECT_TRUSTED_CABUNDLE_LABEL}=true). Vanilla Kubernetes never populates ConfigMap ${CLUSTER_CA_CONFIG_MAP_NAME}. The service account needs get, create, and patch on configmaps in the job namespace. Retry once CNO has filled ca-bundle.crt.`;

export const CLUSTER_CA_TIMEOUT_MESSAGE = `Timed out waiting for ${CLUSTER_CA_CONFIG_MAP_NAME} key ${CLUSTER_CA_DATA_KEY}. ${CLUSTER_CA_OPERATOR_HINT}`;

export const CLUSTER_CA_FORBIDDEN_MESSAGE = `Forbidden while ensuring ${CLUSTER_CA_CONFIG_MAP_NAME}. ${CLUSTER_CA_OPERATOR_HINT}`;

export function clusterCaForeignMessage(namespace: string): string {
  return `ConfigMap ${CLUSTER_CA_CONFIG_MAP_NAME} already exists in namespace ${namespace} but is not managed by ${X2A_MANAGED_BY_VALUE}. Refusing to add ${INJECT_TRUSTED_CABUNDLE_LABEL} (Cluster Network Operator would delete other keys). Remove the foreign ConfigMap or leave x2a.git.useClusterTrustedCABundle unset.`;
}

export function trimGitCaBundle(caBundle?: string): string | undefined {
  const trimmed = caBundle?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!trimmed.includes(CLUSTER_CA_PEM_MARKER)) {
    throw new Error(
      'X2A configuration error: x2a.git.caBundle is set but is not a PEM certificate (missing -----BEGIN CERTIFICATE-----)',
    );
  }
  return trimmed;
}

export function isClusterCaBundlePopulated(
  data?: Record<string, string>,
): boolean {
  return Boolean(data?.[CLUSTER_CA_DATA_KEY]?.includes(CLUSTER_CA_PEM_MARKER));
}

export function hasInjectTrustedCaBundleLabel(
  labels?: Record<string, string>,
): boolean {
  return labels?.[INJECT_TRUSTED_CABUNDLE_LABEL] === 'true';
}

export function isX2aManagedConfigMap(
  labels?: Record<string, string>,
): boolean {
  return labels?.[X2A_MANAGED_BY_LABEL] === X2A_MANAGED_BY_VALUE;
}

export function skipSslIgnoredWarning(gitTls: {
  trimmedCa: string | undefined;
  useClusterTrustedCABundle: boolean;
}): string | undefined {
  if (!gitTls.trimmedCa && !gitTls.useClusterTrustedCABundle) {
    return undefined;
  }
  const reasons: string[] = [];
  if (gitTls.useClusterTrustedCABundle) {
    reasons.push('x2a.git.useClusterTrustedCABundle is set');
  }
  if (gitTls.trimmedCa) {
    reasons.push('x2a.git.caBundle is set');
  }
  return `x2a.git.skipSSLVerification is ignored because ${reasons.join(
    ' and ',
  )}`;
}

export function resolveGitTls(
  config: Pick<X2AConfig, 'git'>,
  jobId: string,
): {
  trimmedCa: string | undefined;
  gitCaConfigMapName: string | undefined;
  useClusterTrustedCABundle: boolean;
  clusterCaConfigMapName: string | undefined;
  useSkip: boolean;
} {
  const trimmedCa = trimGitCaBundle(config.git?.caBundle);
  const useClusterTrustedCABundle =
    config.git?.useClusterTrustedCABundle === true;
  return {
    trimmedCa,
    gitCaConfigMapName: trimmedCa ? `x2a-git-ca-${jobId}` : undefined,
    useClusterTrustedCABundle,
    clusterCaConfigMapName: useClusterTrustedCABundle
      ? CLUSTER_CA_CONFIG_MAP_NAME
      : undefined,
    useSkip:
      config.git?.skipSSLVerification === true &&
      !trimmedCa &&
      !useClusterTrustedCABundle,
  };
}
