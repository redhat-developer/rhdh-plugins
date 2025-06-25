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

import { JsonValue } from '@backstage/types/index';
import { evaluateTemplate, evaluateTemplateProps } from './evaluateTemplate';
import get from 'lodash/get';

const unitEvaluator: evaluateTemplateProps['unitEvaluator'] = async (
  unit,
  formData,
) => {
  if (!unit) {
    throw new Error('Template unit can not be empty');
  }

  // Just a copy for testing purposes
  return Promise.resolve(get(formData, unit));
};

describe('evaluate template', () => {
  const props = {
    unitEvaluator,
    key: 'myKey',
    formData: { foo: 'foo', bar: 'BAR', current: { bar: 'CURRENT_BAR' } },
  };

  it('fails on incorrect input', async () => {
    const cases = [
      {
        input: undefined,
        throws: 'Template can be either a string or an array, key: myKey',
      },
      { input: '$${{}}', throws: 'Template unit can not be empty' },
      { input: '$${{foo', throws: 'Template unit is not closed by }}' },
      {
        input: [undefined],
        throws: 'Template can not be undefined, key: myKey',
      },
      {
        input: ['constant', undefined],
        throws: 'Template can not be undefined, key: myKey',
      },
    ];

    await Promise.all(
      cases.map(c =>
        expect(
          evaluateTemplate({
            ...props,
            template:
              c.input as JsonValue /* retype since we are testing malformed inputs */,
          }),
        ).rejects.toThrow(c.throws),
      ),
    );
  });

  it('can parse input template to units', async () => {
    const cases = [
      { input: 'zz', expected: 'zz' },
      { input: '}}', expected: '}}' },
      { input: '${{foo}}', expected: '${{foo}}' },
      { input: '$${{foo}}', expected: 'foo' },
      { input: '$${{foo}} $${{current.bar}}', expected: 'foo CURRENT_BAR' },
      { input: '$${{foo}}$${{bar}}', expected: 'fooBAR' },
      { input: ' $${{foo}}$${{bar}} ', expected: ' fooBAR ' },
      { input: 'a$${{foo}}$${{bar}} b', expected: 'afooBAR b' },
      {
        input: 'a$${{foo}}$${{bar}} b$${{zz}}',
        expected: 'afooBAR b___undefined___',
      },
    ];

    await Promise.all(
      cases.map(c =>
        expect(evaluateTemplate({ ...props, template: c.input })).resolves.toBe(
          c.expected,
        ),
      ),
    );
  });

  it('can parse input template to units without nesting', async () => {
    await expect(
      evaluateTemplate({ ...props, template: 'a$${{foo}}$${{$${{foo}}}}b' }),
    ).resolves.toBe('afoo___undefined___}}b');
  });

  it('can parse array templates', async () => {
    const cases = [
      { input: [], expected: [] },
      { input: [''], expected: [''] },
      {
        input: ['constantA', 'constantB'],
        expected: ['constantA', 'constantB'],
      },
      { input: ['$${{foo}}'], expected: ['foo'] },
      {
        input: ['$${{foo}}', 'constant', '$${{bar}}'],
        expected: ['foo', 'constant', 'BAR'],
      },
      { input: ['$${{foo}}$${{bar}}'], expected: ['fooBAR'] },
      {
        input: ['constantA', { foo: 'fff', zz: '$${{foo}}', aa: ['aaValue'] }],
        expected: ['constantA', { foo: 'fff', zz: 'foo', aa: ['aaValue'] }],
      },
      {
        input: ['constant', []],
        expected: ['constant', []],
      },
      {
        input: [[]],
        expected: [[]],
      },
      {
        input: [{}],
        expected: [{}],
      },
      {
        input: ['constant', {}],
        expected: ['constant', {}],
      },
    ];

    await Promise.all(
      cases.map(c =>
        expect(
          evaluateTemplate({ ...props, template: c.input }),
        ).resolves.toStrictEqual(c.expected),
      ),
    );
  });

  it('can parse object templates', async () => {
    const cases = [
      { input: {}, expected: {} },
      { input: { foo: 'bar' }, expected: { foo: 'bar' } },
      {
        input: { foo: 'bar', zz: '$${{foo}}' },
        expected: { foo: 'bar', zz: 'foo' },
      },
      {
        input: { foo: 'bar', zz: 'Hi$${{foo}}$${{bar}}' },
        expected: { foo: 'bar', zz: 'HifooBAR' },
      },
      {
        input: { foo: 'bar', zz: '$${{foo}}', nested: {} },
        expected: { foo: 'bar', zz: 'foo', nested: {} },
      },
      {
        input: { foo: 'bar', zz: '$${{foo}}', nested: { aa: 'aa' } },
        expected: { foo: 'bar', zz: 'foo', nested: { aa: 'aa' } },
      },
      {
        input: { foo: 'bar', zz: '$${{foo}}', nested: { aa: '$${{foo}}' } },
        expected: { foo: 'bar', zz: 'foo', nested: { aa: 'foo' } },
      },
      {
        input: {
          foo: 'bar',
          zz: '$${{foo}}',
          nested: { aa: '$${{foo}}', bb: ['bbValue'] },
        },
        expected: {
          foo: 'bar',
          zz: 'foo',
          nested: { aa: 'foo', bb: ['bbValue'] },
        },
      },
      {
        input: {
          foo: 'bar',
          zz: '$${{foo}}',
          nested: {
            aa: '$${{foo}}',
            bb: ['bbValue'],
            nestedNested: { cc: 'ccValue' },
          },
        },
        expected: {
          foo: 'bar',
          zz: 'foo',
          nested: {
            aa: 'foo',
            bb: ['bbValue'],
            nestedNested: { cc: 'ccValue' },
          },
        },
      },
    ];

    await Promise.all(
      cases.map(c =>
        expect(
          evaluateTemplate({ ...props, template: c.input }),
        ).resolves.toStrictEqual(c.expected),
      ),
    );
  });
});
