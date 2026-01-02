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

import { JsonValue } from '@backstage/types';
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
    formData: {
      foo: 'foo',
      bar: 'BAR',
      fooTrue: true,
      barFalse: false,
      current: { bar: 'CURRENT_BAR' },
    },
  };

  it('fails on incorrect template', async () => {
    const cases = [
      {
        template: undefined,
        throws:
          'Template can be either a string, number, boolean, object or an array, key: myKey',
      },
      { template: '$${{}}', throws: 'Template unit can not be empty' },
      { template: '$${{foo', throws: 'Template unit is not closed by }}' },
      {
        template: [undefined],
        throws: 'Template can not be undefined, key: myKey',
      },
      {
        template: ['constant', undefined],
        throws: 'Template can not be undefined, key: myKey',
      },
    ];

    await Promise.all(
      cases.map(c =>
        expect(
          evaluateTemplate({
            ...props,
            template:
              c.template as JsonValue /* retype since we are testing malformed templates */,
          }),
        ).rejects.toThrow(c.throws),
      ),
    );
  });

  it('can parse template template to units', async () => {
    const cases = [
      { template: '', expected: '' },
      { template: 'zz', expected: 'zz' },
      { template: '}}', expected: '}}' },
      { template: '${{foo}}', expected: '${{foo}}' },
      { template: '$${{foo}}', expected: 'foo' },
      { template: '$${{foo}} $${{current.bar}}', expected: 'foo CURRENT_BAR' },
      { template: '$${{foo}}$${{bar}}', expected: 'fooBAR' },
      { template: ' $${{foo}}$${{bar}} ', expected: ' fooBAR ' },
      { template: 'a$${{foo}}$${{bar}} b', expected: 'afooBAR b' },
      {
        template: 'a$${{foo}}$${{bar}} b$${{zz}}',
        expected: 'afooBAR b___undefined___',
      },
    ];

    await Promise.all(
      cases.map(c =>
        expect(
          evaluateTemplate({ ...props, template: c.template }),
        ).resolves.toBe(c.expected),
      ),
    );
  });

  it('can parse template template to units without nesting', async () => {
    await expect(
      evaluateTemplate({ ...props, template: 'a$${{foo}}$${{$${{foo}}}}b' }),
    ).resolves.toBe('afoo___undefined___}}b');
  });

  it('can parse array templates', async () => {
    const cases = [
      { template: [], expected: [] },
      { template: [''], expected: [''] },
      {
        template: ['constantA', 'constantB'],
        expected: ['constantA', 'constantB'],
      },
      { template: ['$${{foo}}'], expected: ['foo'] },
      {
        template: ['$${{foo}}', 'constant', '$${{bar}}'],
        expected: ['foo', 'constant', 'BAR'],
      },
      { template: ['$${{foo}}$${{bar}}'], expected: ['fooBAR'] },
      {
        template: [
          'constantA',
          { foo: 'fff', zz: '$${{foo}}', aa: ['aaValue'] },
        ],
        expected: ['constantA', { foo: 'fff', zz: 'foo', aa: ['aaValue'] }],
      },
      {
        template: ['constant', []],
        expected: ['constant', []],
      },
      {
        template: [[]],
        expected: [[]],
      },
      {
        template: [{}],
        expected: [{}],
      },
      {
        template: ['constant', {}],
        expected: ['constant', {}],
      },
      {
        template: ['constant', true, false],
        expected: ['constant', true, false],
      },
    ];

    await Promise.all(
      cases.map(c =>
        expect(
          evaluateTemplate({ ...props, template: c.template }),
        ).resolves.toStrictEqual(c.expected),
      ),
    );
  });

  it('can parse object templates', async () => {
    const cases = [
      { template: {}, expected: {} },
      { template: { foo: 'bar' }, expected: { foo: 'bar' } },
      {
        template: { foo: 'bar', zz: '$${{foo}}' },
        expected: { foo: 'bar', zz: 'foo' },
      },
      {
        template: { foo: 'bar', zz: 'Hi$${{foo}}$${{bar}}' },
        expected: { foo: 'bar', zz: 'HifooBAR' },
      },
      {
        template: { myBool: true, myAnotherBool: false },
        expected: { myBool: true, myAnotherBool: false },
      },
      {
        template: { fooTrue: '$${{fooTrue}}', barFalse: '$${{barFalse}}' },
        expected: { fooTrue: true, barFalse: false },
      },
      {
        template: {
          fooTrue: 'something $${{fooTrue}}',
          barFalse: '$${{barFalse}} something',
        },
        expected: { fooTrue: 'something true', barFalse: 'false something' },
      },
      {
        template: { foo: 'bar', zz: '$${{foo}}', nested: {} },
        expected: { foo: 'bar', zz: 'foo', nested: {} },
      },
      {
        template: { foo: 'bar', zz: '$${{foo}}', nested: { aa: 'aa' } },
        expected: { foo: 'bar', zz: 'foo', nested: { aa: 'aa' } },
      },
      {
        template: { foo: 'bar', zz: '$${{foo}}', nested: { aa: '$${{foo}}' } },
        expected: { foo: 'bar', zz: 'foo', nested: { aa: 'foo' } },
      },
      {
        template: {
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
        template: {
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
          evaluateTemplate({ ...props, template: c.template }),
        ).resolves.toStrictEqual(c.expected),
      ),
    );
  });
});
