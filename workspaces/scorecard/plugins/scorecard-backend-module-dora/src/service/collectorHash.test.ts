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

import { collectorInputHash } from './collectorHash';

describe('collectorInputHash', () => {
  it('is independent of object key order', () => {
    expect(collectorInputHash({ b: 1, a: 2 })).toBe(
      collectorInputHash({ a: 2, b: 1 }),
    );
  });

  it('treats array order as significant', () => {
    expect(collectorInputHash({ tags: ['a', 'b'] })).not.toBe(
      collectorInputHash({ tags: ['b', 'a'] }),
    );
  });

  it('hashes nested objects and arrays including all JSON primitives', () => {
    expect(
      collectorInputHash({
        workflowName: 'Deploy',
        filters: {
          env: 'prod',
          extra: ['x', 'y'],
          count: 3,
          enabled: true,
          flag: false,
          missing: null,
          custom: {
            other: true,
            array: ['a', 'b'],
          },
        },
      }),
    ).toBe('bec696e31ced290114415ef939a58739d35a14067c2b52e9ef769b20c45f280a');
  });

  it.each([
    [
      'number',
      { n: 1 },
      '2bfd14f43d17fc7cea24e0917a8879b4b2f880b8baeec1b9d90fbaad655e71bd',
    ],
    [
      'string',
      { s: 'hello' },
      'aa2a66ada1633cb40b81191752d22a004787247afec983bfaabc99e7b1397639',
    ],
    [
      'boolean true',
      { b: true },
      'fc0f22db8e47986f86d54c2b86fd77d7c92813b0d7f9bdab47ac855a2fd3e6ad',
    ],
    [
      'boolean false',
      { b: false },
      '7d1ec4641ee2937691ed338d652893a8b736b66e05a3b95439aea5d7ec4a9ff4',
    ],
    [
      'null',
      { n: null },
      '5b4da02351c1c20974b216a5e3a4edb59ac51cbda6be3e9d82952b4f5beea463',
    ],
  ])('hashes JSON primitive %s', (_name, input, expected) => {
    expect(collectorInputHash(input)).toBe(expected);
  });

  it('hashes {} and undefined identically', () => {
    expect(collectorInputHash({})).toBe(collectorInputHash(undefined));
  });

  it('is stable for the same input', () => {
    expect(collectorInputHash({ workflowName: 'Deploy to prod' })).toBe(
      '889b8440c6a4d8a3f5e8214dc29fe9ddcebe2f7d65a511e6047e124430e9b56c',
    );
  });

  it('differs when static input differs', () => {
    expect(collectorInputHash({ workflowName: 'A' })).toBe(
      '126230efe17333d6498ee26e0d4168e4a665816e507e325cfeafd0bb117c522d',
    );
    expect(collectorInputHash({ workflowName: 'B' })).toBe(
      'a79b15c3a3893673be3df707eecd4722e64375f48934ca9f97fb004747bcf381',
    );
  });
});
