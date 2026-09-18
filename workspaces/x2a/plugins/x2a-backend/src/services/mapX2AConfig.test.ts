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

import { mapX2AConfig } from './mapX2AConfig';
import type { X2AConfig } from './types';

const rawBase: X2AConfig = {
  kubernetes: {
    namespace: 'from-raw',
    image: 'quay.io/x2ansible/x2a-convertor',
    imageTag: 'latest',
    ttlSecondsAfterFinished: 86400,
    resources: {
      requests: { cpu: '500m', memory: '1Gi' },
      limits: { cpu: '2000m', memory: '4Gi' },
    },
  },
  credentials: {
    llm: { LLM_MODEL: 'anthropic.claude-v2' },
  },
};

describe('mapX2AConfig', () => {
  it('copies git.caBundle and defaults skipSSLVerification to false', () => {
    const pem = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';
    const mapped = mapX2AConfig(
      {
        ...rawBase,
        git: { caBundle: `  ${pem}  ` },
      },
      'mapped-ns',
    );

    expect(mapped.git?.caBundle).toBe(pem);
    expect(mapped.git?.skipSSLVerification).toBe(false);
    expect(mapped.git?.useClusterTrustedCABundle).toBe(false);
    expect(mapped.kubernetes.namespace).toBe('mapped-ns');
  });

  it('does not drop git fields the way a reconstruct-author-only mapper would', () => {
    const mapped = mapX2AConfig(
      {
        ...rawBase,
        git: {
          author: { name: 'Bot', email: 'bot@example.com' },
          caBundle: '-----BEGIN CERTIFICATE-----\nX\n-----END CERTIFICATE-----',
          skipSSLVerification: true,
          useClusterTrustedCABundle: true,
        },
      },
      'ns',
    );

    expect(mapped.git?.author).toEqual({
      name: 'Bot',
      email: 'bot@example.com',
    });
    expect(mapped.git?.caBundle).toContain('BEGIN CERTIFICATE');
    expect(mapped.git?.skipSSLVerification).toBe(true);
    expect(mapped.git?.useClusterTrustedCABundle).toBe(true);
  });

  it('treats whitespace-only caBundle as unset', () => {
    const mapped = mapX2AConfig(
      { ...rawBase, git: { caBundle: ' \n ' } },
      'ns',
    );
    expect(mapped.git?.caBundle).toBeUndefined();
  });
});
