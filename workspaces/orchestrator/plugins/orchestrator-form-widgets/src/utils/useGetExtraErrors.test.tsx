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
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { renderHook } from '@testing-library/react';

import { JsonObject } from '@backstage/types';
import { ERRORS_KEY } from '@rjsf/utils';

import { useGetExtraErrors } from './useGetExtraErrors';

jest.mock('./evaluateTemplate', () => ({
  evaluateTemplateString: jest
    .fn()
    .mockResolvedValue('https://example.com/validate'),
}));

jest.mock('./useRequestInit', () => ({
  getRequestInit: jest.fn().mockResolvedValue({}),
}));

jest.mock('./useTemplateUnitEvaluator', () => ({
  useTemplateUnitEvaluator: jest.fn(() => async () => undefined),
}));

const mockFetch = jest.fn();

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    useApi: (ref: unknown) => {
      if (ref === actual.fetchApiRef) {
        return { fetch: mockFetch };
      }
      throw new Error(
        `useGetExtraErrors.test: unmocked api ref: ${String(ref)}`,
      );
    },
  };
});

describe('useGetExtraErrors', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('aggregates async validation errors for all nested fields under a shared path prefix', async () => {
    let fetchCall = 0;
    mockFetch.mockImplementation(async () => {
      const n = ++fetchCall;
      return {
        status: 422,
        json: async () => ({ issues: [`validation failed for request ${n}`] }),
      };
    });

    const { result } = renderHook(() => useGetExtraErrors());

    const uiSchema: JsonObject = {
      'my-solution': {
        xParams: {
          fieldA: {
            'ui:widget': 'ActiveTextInput',
            'ui:props': { 'validate:url': 'https://example.com/validate' },
          },
          fieldB: {
            'ui:widget': 'ActiveTextInput',
            'ui:props': { 'validate:url': 'https://example.com/validate' },
          },
          fieldC: {
            'ui:widget': 'ActiveTextInput',
            'ui:props': { 'validate:url': 'https://example.com/validate' },
          },
        },
      },
    };

    const formData: JsonObject = {
      'my-solution': {
        xParams: {
          fieldA: '',
          fieldB: '',
          fieldC: '',
        },
      },
    };

    const errors = await result.current(formData, uiSchema);

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(errors).toEqual({
      'my-solution': {
        xParams: {
          fieldA: {
            [ERRORS_KEY]: ['validation failed for request 1'],
          },
          fieldB: {
            [ERRORS_KEY]: ['validation failed for request 2'],
          },
          fieldC: {
            [ERRORS_KEY]: ['validation failed for request 3'],
          },
        },
      },
    });
  });
});
