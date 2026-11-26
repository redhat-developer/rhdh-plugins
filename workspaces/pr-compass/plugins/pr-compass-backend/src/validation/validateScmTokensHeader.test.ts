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

import { InputError } from '@backstage/errors';
import { SCM_TOKENS_MAX_BYTES } from './constants';
import { validateScmTokensHeader } from './validateScmTokensHeader';

describe('validateScmTokensHeader', () => {
  it('parses a source ID to token map', () => {
    expect(validateScmTokensHeader('{"github:github.com":"ghu_abc"}')).toEqual({
      'github:github.com': 'ghu_abc',
    });
  });

  it('accepts several sources', () => {
    expect(
      validateScmTokensHeader(
        '{"github:github.com":"ghu_abc","gitlab:gitlab.corp":"glpat_xyz"}',
      ),
    ).toEqual({
      'github:github.com': 'ghu_abc',
      'gitlab:gitlab.corp': 'glpat_xyz',
    });
  });

  it('accepts a header at the size limit', () => {
    const prefix = '{"github:github.com":"';
    const suffix = '"}';
    const token = 'x'.repeat(
      SCM_TOKENS_MAX_BYTES - prefix.length - suffix.length,
    );

    expect(validateScmTokensHeader(`${prefix}${token}${suffix}`)).toEqual({
      'github:github.com': token,
    });
  });

  it('rejects an oversized header without exposing its contents', () => {
    const prefix = '{"github:github.com":"ghu_secret';
    const suffix = '"}';
    const oversized = `${prefix}${'x'.repeat(
      SCM_TOKENS_MAX_BYTES - prefix.length - suffix.length + 1,
    )}${suffix}`;

    expect(() => validateScmTokensHeader(oversized)).toThrow(InputError);
    expect(() => validateScmTokensHeader(oversized)).toThrow(
      `Invalid 'x-scm-tokens' header: must not exceed ${SCM_TOKENS_MAX_BYTES} bytes`,
    );
    expect(() => validateScmTokensHeader(oversized)).not.toThrow('ghu_secret');
  });

  it('rejects invalid JSON', () => {
    expect(() => validateScmTokensHeader('{')).toThrow(InputError);
    expect(() => validateScmTokensHeader('{')).toThrow(
      "Invalid 'x-scm-tokens' header: must be a JSON object",
    );
  });

  it.each([
    ['a bare string', '"ghu_abc"'],
    ['a number', '42'],
    ['a non-string value', '{"github:github.com":42}'],
    ['an empty token', '{"github:github.com":""}'],
  ])('rejects %s', (_name, raw) => {
    expect(() => validateScmTokensHeader(raw)).toThrow(InputError);
    expect(() => validateScmTokensHeader(raw)).toThrow(
      "Invalid 'x-scm-tokens' header: must be an object mapping source IDs to non-empty token strings",
    );
  });

  it.each([
    'ghu_secret',
    '{"github:github.com":"ghu_secret"',
    '{"github:github.com":42,"gitlab:gitlab.com":"ghu_secret"}',
  ])('does not expose tokens', raw => {
    expect(() => validateScmTokensHeader(raw)).toThrow(
      "Invalid 'x-scm-tokens' header",
    );
    expect(() => validateScmTokensHeader(raw)).not.toThrow('ghu_secret');
  });
});
