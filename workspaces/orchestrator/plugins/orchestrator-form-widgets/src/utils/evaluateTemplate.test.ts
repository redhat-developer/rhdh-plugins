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

const unitEvaluator: evaluateTemplateProps['unitEvaluator'] = async (
  unit,
  _,
) => {
  if (!unit) {
    throw new Error('Template unit can not be empty');
  }

  // Just a copy for testing purposes
  return Promise.resolve(unit);
};

describe('evaluate template', () => {
  const props = { unitEvaluator, key: 'myKey', formData: {} };

  it('fails on incorrect input', async () => {
    const cases = [
      {
        input: undefined,
        throws: 'Template can be either a string or an array, key: myKey',
      },
      { input: '$${{}}', throws: 'Template unit can not be empty' },
      { input: '$${{foo', throws: 'Template unit is not closed by }}' },
      {
        input: ['constant', []],
        throws:
          'Items of array templates can be strings only, template: "["constant",[]]"',
      },
      {
        input: [[]],
        throws:
          'Items of array templates can be strings only, template: "[[]]"',
      },
      {
        input: [{}],
        throws:
          'Items of array templates can be strings only, template: "[{}]"',
      },
      {
        input: ['constant', {}],
        throws:
          'Items of array templates can be strings only, template: "["constant",{}]"',
      },
      {
        input: [undefined],
        throws:
          'Items of array templates can be strings only, template: "[null]"',
      },
      {
        input: ['constant', undefined],
        throws:
          'Items of array templates can be strings only, template: "["constant",null]"',
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
      { input: '$${{foo}} $${{bar}}', expected: 'foo bar' },
      { input: '$${{foo}}$${{bar}}', expected: 'foobar' },
      { input: ' $${{foo}}$${{bar}} ', expected: ' foobar ' },
      { input: 'a$${{foo}}$${{bar}} b', expected: 'afoobar b' },
      { input: 'a$${{foo}}$${{bar}} b$${{zz}}', expected: 'afoobar bzz' },
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
      evaluateTemplate({ ...props, template: 'a$${{foo}}$${{$${{xx}}}}b' }),
    ).resolves.toBe('afoo$${{xx}}b');
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
        expected: ['foo', 'constant', 'bar'],
      },
      { input: ['$${{foo}}$${{bar}}'], expected: ['foobar'] },
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
