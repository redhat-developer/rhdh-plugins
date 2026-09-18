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

import { trimGitCaBundle } from './gitTls';

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
