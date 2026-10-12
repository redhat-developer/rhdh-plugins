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

import { makeValidator } from '@backstage/catalog-model';

import { normalizeTags } from './catalog-helpers';
import { normalizeNpxMetadata, normalizeOciMetadata } from './normalizer';
import { npxTrustedInput, ociTrustedInput } from './fixtures';
import { CATALOG_TAG_PATTERN, MAX_TAG_LENGTH } from './tag-constants';

const validator = makeValidator();
const candidates = [
  'demo',
  'valid-tag',
  'rhdh:2',
  'c++',
  'c#',
  'a'.repeat(63),
  '',
  'a'.repeat(64),
  'rhdh:2.2',
  'has_underscore',
  'in--valid',
  '-invalid',
  'invalid-',
  'a.b',
  'has space',
  'bad@tag',
  'UPPER',
];

describe('catalog tag validator parity', () => {
  it.each(candidates)('matches Backstage for %j', tag => {
    expect(tag.length <= MAX_TAG_LENGTH && CATALOG_TAG_PATTERN.test(tag)).toBe(
      validator.isValidTag(tag),
    );
  });

  it('retains only catalog-valid tags through all three normalization paths', () => {
    const tags = [...candidates, ' Demo ', 'UPPER'];
    const expected = [
      ...new Set(tags.map(tag => tag.trim().toLocaleLowerCase('en-US'))),
    ].filter(tag => validator.isValidTag(tag));
    expect(normalizeTags(tags).tags).toEqual(expected);
    const oci = normalizeOciMetadata(
      { skillCard: { metadata: { name: 'Test', tags } } },
      ociTrustedInput,
    );
    const npx = normalizeNpxMetadata(
      { entry: { name: 'Test' }, frontmatter: { metadata: { tags } } },
      npxTrustedInput,
    );
    expect(oci.record?.tags).toEqual(expected);
    expect(npx.record?.tags).toEqual(expected);
  });
});
