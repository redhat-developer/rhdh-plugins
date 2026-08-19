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
  buildTechDocsMetadataUrl,
  isSafeTechDocsEntitySegment,
} from './techdocsMetadata';

const TECHDOCS_BASE = 'http://example.com/api/techdocs';

describe('isSafeTechDocsEntitySegment', () => {
  it.each(['default', 'component', 'my-doc', 'example.go', 'a', 'doc_1'])(
    'accepts catalog-like segment %j',
    value => {
      expect(isSafeTechDocsEntitySegment(value)).toBe(true);
    },
  );

  it.each([
    '',
    '.',
    '..',
    '../',
    'foo/bar',
    'foo\\bar',
    'foo/../bar',
    '%2e%2e',
    ' has space',
    'foo bar',
    '-leading-dash',
    'trailing-dash-',
    'bad:colon',
  ])('rejects unsafe segment %j', value => {
    expect(isSafeTechDocsEntitySegment(value)).toBe(false);
  });

  it('rejects over-long segments', () => {
    expect(isSafeTechDocsEntitySegment(`a${'b'.repeat(256)}`)).toBe(false);
  });
});

describe('buildTechDocsMetadataUrl', () => {
  it('builds a metadata URL under the discovery base', () => {
    expect(
      buildTechDocsMetadataUrl(TECHDOCS_BASE, {
        namespace: 'default',
        kind: 'component',
        name: 'test-component',
      }),
    ).toBe(
      'http://example.com/api/techdocs/metadata/techdocs/default/component/test-component',
    );
  });

  it('strips a trailing slash on the discovery base', () => {
    expect(
      buildTechDocsMetadataUrl(`${TECHDOCS_BASE}/`, {
        namespace: 'default',
        kind: 'component',
        name: 'docs',
      }),
    ).toBe(
      'http://example.com/api/techdocs/metadata/techdocs/default/component/docs',
    );
  });

  it.each([
    { namespace: '..', kind: 'component', name: 'docs' },
    { namespace: 'default', kind: '..', name: 'docs' },
    { namespace: 'default', kind: 'component', name: '..' },
    { namespace: 'default', kind: 'component', name: 'foo/bar' },
    { namespace: 'ns/../other', kind: 'component', name: 'docs' },
    { namespace: 'default', kind: 'kind\\x', name: 'docs' },
  ])('returns undefined for unsafe parts %j', parts => {
    expect(buildTechDocsMetadataUrl(TECHDOCS_BASE, parts)).toBeUndefined();
  });

  it('does not allow path traversal to escape the metadata prefix', () => {
    const url = buildTechDocsMetadataUrl(TECHDOCS_BASE, {
      namespace: '..',
      kind: '..',
      name: 'catalog',
    });
    expect(url).toBeUndefined();
  });
});
