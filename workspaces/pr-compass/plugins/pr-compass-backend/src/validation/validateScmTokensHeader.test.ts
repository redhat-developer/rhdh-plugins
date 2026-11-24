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

  it.each([
    ['not json', 'nonsense'],
    ['a bare string', '"ghu_abc"'],
    ['a number', '42'],
    ['a non-string value', '{"github:github.com":42}'],
    ['an empty token', '{"github:github.com":""}'],
  ])('rejects %s', (_name, raw) => {
    expect(() => validateScmTokensHeader(raw, logger)).toThrow(InputError);
  });

  it('never echoes a token back in the error', () => {
    const validate = () =>
      validateScmTokensHeader(
        '{"github:github.com":42,"gitlab:gitlab.com":"ghu_secret"}',
        logger,
      );

    expect(validate).toThrow("Invalid 'x-scm-tokens' header");
    expect(validate).not.toThrow('42');
    expect(validate).not.toThrow('ghu_secret');
  });
});
