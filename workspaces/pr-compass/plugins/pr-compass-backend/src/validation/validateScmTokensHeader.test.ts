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

import { mockServices } from '@backstage/backend-test-utils';
import { InputError } from '@backstage/errors';
import { validateScmTokensHeader } from './validateScmTokensHeader';

const logger = mockServices.logger.mock();

describe('validateScmTokensHeader', () => {
  it('parses a source ID to token map', () => {
    expect(
      validateScmTokensHeader('{"github:github.com":"ghu_abc"}', logger),
    ).toEqual({ 'github:github.com': 'ghu_abc' });
  });

  it('accepts several sources', () => {
    expect(
      validateScmTokensHeader(
        '{"github:github.com":"ghu_abc","gitlab:gitlab.corp":"glpat_xyz"}',
        logger,
      ),
    ).toEqual({
      'github:github.com': 'ghu_abc',
      'gitlab:gitlab.corp': 'glpat_xyz',
    });
  });

  it('returns undefined when the header is absent', () => {
    expect(validateScmTokensHeader(undefined, logger)).toBeUndefined();
  });

  it('ignores an oversized header rather than parsing it', () => {
    const oversized = JSON.stringify({ 'github:github.com': 'x'.repeat(5000) });

    expect(validateScmTokensHeader(oversized, logger)).toBeUndefined();
  });

  it('rejects invalid JSON', () => {
    expect(() => validateScmTokensHeader('{', logger)).toThrow(InputError);
    expect(() => validateScmTokensHeader('{', logger)).toThrow(
      "Invalid 'x-scm-tokens' header: must be a JSON object",
    );
  });

  it.each([
    ['a bare string', '"ghu_abc"'],
    ['a number', '42'],
    ['a non-string value', '{"github:github.com":42}'],
    ['an empty token', '{"github:github.com":""}'],
  ])('rejects %s', (_name, raw) => {
    expect(() => validateScmTokensHeader(raw, logger)).toThrow(InputError);
    expect(() => validateScmTokensHeader(raw, logger)).toThrow(
      "Invalid 'x-scm-tokens' header: must be an object mapping source IDs to non-empty token strings",
    );
  });

  it.each([
    'ghu_secret',
    '{"github:github.com":"ghu_secret"',
    '{"github:github.com":42,"gitlab:gitlab.com":"ghu_secret"}',
  ])('does not expose tokens', raw => {
    expect(() => validateScmTokensHeader(raw, logger)).toThrow(
      "Invalid 'x-scm-tokens' header",
    );
    expect(() => validateScmTokensHeader(raw, logger)).not.toThrow(
      'ghu_secret',
    );
  });
});
