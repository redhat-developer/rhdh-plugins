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
  CLUSTER_CA_CONFIG_MAP_NAME,
  CLUSTER_CA_PEM_MARKER,
  isClusterCaBundlePopulated,
  resolveGitTls,
  skipSslIgnoredWarning,
  trimGitCaBundle,
} from './gitTls';

const pem = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';

describe('trimGitCaBundle', () => {
  it('returns a trimmed valid PEM', () => {
    expect(trimGitCaBundle(`  ${pem}  `)).toBe(pem);
  });

  it('treats whitespace-only caBundle as unset', () => {
    expect(trimGitCaBundle(' \n ')).toBeUndefined();
  });

  it('throws when a non-empty blob is not a PEM certificate', () => {
    expect(() => trimGitCaBundle('not-a-cert')).toThrow(
      'X2A configuration error: x2a.git.caBundle is set but is not a PEM certificate (missing -----BEGIN CERTIFICATE-----)',
    );
  });
});

describe('isClusterCaBundlePopulated', () => {
  it('requires the PEM BEGIN marker', () => {
    expect(
      isClusterCaBundlePopulated({ 'ca-bundle.crt': CLUSTER_CA_PEM_MARKER }),
    ).toBe(true);
    expect(
      isClusterCaBundlePopulated({ 'ca-bundle.crt': 'BEGIN CERTIFICATE' }),
    ).toBe(false);
    expect(isClusterCaBundlePopulated({})).toBe(false);
  });
});

describe('resolveGitTls', () => {
  it('defaults cluster flag off and skip off', () => {
    const gitTls = resolveGitTls({}, 'job-1');
    expect(gitTls.useClusterTrustedCABundle).toBe(false);
    expect(gitTls.clusterCaConfigMapName).toBeUndefined();
    expect(gitTls.useSkip).toBe(false);
  });

  it('names the long-lived cluster ConfigMap when the flag is true', () => {
    const gitTls = resolveGitTls(
      { git: { useClusterTrustedCABundle: true } },
      'job-1',
    );
    expect(gitTls.useClusterTrustedCABundle).toBe(true);
    expect(gitTls.clusterCaConfigMapName).toBe(CLUSTER_CA_CONFIG_MAP_NAME);
    expect(gitTls.useSkip).toBe(false);
  });

  it('ignores skip when the cluster flag is set without extra CA', () => {
    const gitTls = resolveGitTls(
      {
        git: { useClusterTrustedCABundle: true, skipSSLVerification: true },
      },
      'job-1',
    );
    expect(gitTls.useSkip).toBe(false);
  });

  it('sets skip only when neither CA source is active', () => {
    expect(
      resolveGitTls({ git: { skipSSLVerification: true } }, 'job-1').useSkip,
    ).toBe(true);
  });
});

describe('skipSslIgnoredWarning', () => {
  it('names caBundle only', () => {
    expect(
      skipSslIgnoredWarning({
        trimmedCa: pem,
        useClusterTrustedCABundle: false,
      }),
    ).toBe(
      'x2a.git.skipSSLVerification is ignored because x2a.git.caBundle is set',
    );
  });

  it('names the cluster flag only', () => {
    expect(
      skipSslIgnoredWarning({
        trimmedCa: undefined,
        useClusterTrustedCABundle: true,
      }),
    ).toBe(
      'x2a.git.skipSSLVerification is ignored because x2a.git.useClusterTrustedCABundle is set',
    );
  });

  it('names both the cluster flag and caBundle', () => {
    expect(
      skipSslIgnoredWarning({
        trimmedCa: pem,
        useClusterTrustedCABundle: true,
      }),
    ).toBe(
      'x2a.git.skipSSLVerification is ignored because x2a.git.useClusterTrustedCABundle is set and x2a.git.caBundle is set',
    );
  });
});
