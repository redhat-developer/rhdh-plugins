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

import { resolvePackagePath } from '@backstage/backend-plugin-api';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const COMBINED_BUNDLE = '/tmp/x2a-ca-bundle.pem';

const ENV_KEYS = [
  'GIT_SSL_CAINFO',
  'SSL_CERT_FILE',
  'CURL_CA_BUNDLE',
  'REQUESTS_CA_BUNDLE',
] as const;

function extractSetupExtraCaBundle(script: string): string {
  const start = script.indexOf('setup_extra_ca_bundle() {');
  if (start < 0) {
    throw new Error('setup_extra_ca_bundle() not found in x2a-job-script.sh');
  }
  const end = script.indexOf('\n}\n', start);
  if (end < 0) {
    throw new Error(
      'Could not find column-0 closing brace for setup_extra_ca_bundle',
    );
  }
  return script.slice(start, end + 2);
}

function exportedVars(
  stdout: string,
): Record<(typeof ENV_KEYS)[number], string> {
  const out = {} as Record<(typeof ENV_KEYS)[number], string>;
  for (const key of ENV_KEYS) {
    const matches = [...stdout.matchAll(new RegExp(`^${key}=(.*)$`, 'gm'))];
    out[key] = matches.at(-1)?.[1] ?? '';
  }
  return out;
}

function runSetup(gitEnv: Record<string, string>) {
  const templatePath = resolvePackagePath(
    '@red-hat-developer-hub/backstage-plugin-x2a-backend',
    'templates',
    'x2a-job-script.sh',
  );
  const fn = extractSetupExtraCaBundle(fs.readFileSync(templatePath, 'utf8'));
  const wrapper = [
    'set -eo pipefail',
    fn,
    'setup_extra_ca_bundle',
    ...ENV_KEYS.map(key => `printf '${key}=%s\\n' "\${${key}-}"`),
  ].join('\n');

  return spawnSync('bash', ['-c', wrapper], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, ...gitEnv },
  });
}

describe('setup_extra_ca_bundle', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'x2a-ca-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    try {
      fs.unlinkSync(COMBINED_BUNDLE);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  });

  it('is a no-op when neither CA env is set', () => {
    const result = runSetup({});
    expect(result.status).toBe(0);
    const vars = exportedVars(result.stdout);
    for (const key of ENV_KEYS) {
      expect(vars[key]).toBe('');
    }
  });

  it('points git TLS env at the cluster CA file', () => {
    const clusterPem =
      '-----BEGIN CERTIFICATE-----\nCLUSTER\n-----END CERTIFICATE-----';
    const clusterPath = path.join(tmpDir, 'cluster.pem');
    fs.writeFileSync(clusterPath, clusterPem);

    const result = runSetup({ GIT_CLUSTER_CA_FILE: clusterPath });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Using cluster trusted CA bundle');
    const vars = exportedVars(result.stdout);
    for (const key of ENV_KEYS) {
      expect(vars[key]).toBe(clusterPath);
    }
  });

  it('concatenates extra CA after the cluster file', () => {
    const clusterPem =
      '-----BEGIN CERTIFICATE-----\nCLUSTER\n-----END CERTIFICATE-----';
    const extraPem =
      '-----BEGIN CERTIFICATE-----\nEXTRA\n-----END CERTIFICATE-----';
    const clusterPath = path.join(tmpDir, 'cluster.pem');
    const extraPath = path.join(tmpDir, 'extra.pem');
    fs.writeFileSync(clusterPath, clusterPem);
    fs.writeFileSync(extraPath, extraPem);

    const result = runSetup({
      GIT_CLUSTER_CA_FILE: clusterPath,
      GIT_CA_BUNDLE_FILE: extraPath,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Using extra CA bundle concatenated with');
    const vars = exportedVars(result.stdout);
    for (const key of ENV_KEYS) {
      expect(vars[key]).toBe(COMBINED_BUNDLE);
    }
    expect(fs.readFileSync(COMBINED_BUNDLE)).toEqual(
      Buffer.from(`${clusterPem}\n${extraPem}`),
    );
  });

  it('exits when GIT_CLUSTER_CA_FILE is missing', () => {
    const missing = path.join(tmpDir, 'missing-cluster.pem');
    const result = runSetup({ GIT_CLUSTER_CA_FILE: missing });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('GIT_CLUSTER_CA_FILE');
  });

  it('exits when GIT_CA_BUNDLE_FILE is missing', () => {
    const missing = path.join(tmpDir, 'missing-extra.pem');
    const result = runSetup({ GIT_CA_BUNDLE_FILE: missing });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('GIT_CA_BUNDLE_FILE');
  });
});
