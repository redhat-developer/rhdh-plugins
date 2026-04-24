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

import { resolveMetricTranslation } from '../translationUtils';

type MockT = (key: string, params?: Record<string, string>) => string;

const createMockT = (translations: Record<string, string>): MockT => {
  return (key: string, params?: Record<string, string>) => {
    let value = translations[key];
    if (value === undefined) return key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{{${k}}}`, v);
      }
    }
    return value;
  };
};

describe('resolveMetricTranslation', () => {
  it('returns exact translation when key exists', () => {
    const t = createMockT({
      'metric.github.open_prs.title': 'GitHub open PRs',
    });

    expect(resolveMetricTranslation(t as any, 'github.open_prs', 'title')).toBe(
      'GitHub open PRs',
    );
  });

  it('returns parent translation with name param for 2-segment metric IDs', () => {
    const t = createMockT({
      'metric.filecheck.title': 'File check: {{name}}',
    });

    expect(
      resolveMetricTranslation(t as any, 'filecheck.readme', 'title'),
    ).toBe('File check: readme');
  });

  it('returns parent translation for description field', () => {
    const t = createMockT({
      'metric.filecheck.description':
        'Checks whether the {{name}} file exists in the repository.',
    });

    expect(
      resolveMetricTranslation(t as any, 'filecheck.readme', 'description'),
    ).toBe('Checks whether the readme file exists in the repository.');
  });

  it('prefers exact match over parent match', () => {
    const t = createMockT({
      'metric.filecheck.readme.title': 'README file check',
      'metric.filecheck.title': 'File check: {{name}}',
    });

    expect(
      resolveMetricTranslation(t as any, 'filecheck.readme', 'title'),
    ).toBe('README file check');
  });

  it('uses first segment as template namespace with the rest as name', () => {
    const t = createMockT({
      'metric.some.title': 'Provider: {{name}}',
    });

    expect(
      resolveMetricTranslation(t as any, 'some.provider.deep.nested', 'title'),
    ).toBe('Provider: provider.deep.nested');
  });

  it('returns raw key when no translation matches for 2-segment metric ID', () => {
    const t = createMockT({});

    expect(resolveMetricTranslation(t as any, 'unknown.metric', 'title')).toBe(
      'metric.unknown.metric.title',
    );
  });

  it('returns raw key when neither exact nor parent translation matches', () => {
    const t = createMockT({});

    expect(
      resolveMetricTranslation(t as any, 'unknown.metric.instance', 'title'),
    ).toBe('metric.unknown.metric.instance.title');
  });

  it('attempts parent lookup for 2-segment metric IDs', () => {
    const t = createMockT({
      'metric.unknown.title': 'Resolved via parent: {{name}}',
    });

    expect(
      resolveMetricTranslation(t as any, 'unknown.something', 'title'),
    ).toBe('Resolved via parent: something');
  });

  it('does not attempt parent lookup for 1-segment metric IDs', () => {
    const t = createMockT({});

    expect(resolveMetricTranslation(t as any, 'single', 'title')).toBe(
      'metric.single.title',
    );
  });

  it('returns fallback when no translation matches and fallback is provided', () => {
    const t = createMockT({});

    expect(
      resolveMetricTranslation(
        t as any,
        'unknown.metric',
        'title',
        'API Title',
      ),
    ).toBe('API Title');
  });

  it('returns fallback for 3-segment ID when neither exact nor parent matches', () => {
    const t = createMockT({});

    expect(
      resolveMetricTranslation(
        t as any,
        'unknown.metric.instance',
        'description',
        'API description text',
      ),
    ).toBe('API description text');
  });

  it('prefers translation over fallback when translation exists', () => {
    const t = createMockT({
      'metric.github.open_prs.title': 'GitHub open PRs',
    });

    expect(
      resolveMetricTranslation(
        t as any,
        'github.open_prs',
        'title',
        'Fallback Title',
      ),
    ).toBe('GitHub open PRs');
  });

  it('prefers parent translation over fallback', () => {
    const t = createMockT({
      'metric.filecheck.title': 'File check: {{name}}',
    });

    expect(
      resolveMetricTranslation(
        t as any,
        'filecheck.readme',
        'title',
        'Fallback Title',
      ),
    ).toBe('File check: readme');
  });
});
