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

import { ERRORS_KEY } from '@rjsf/utils';

import { validateSingleField } from './validateSingleField';

jest.mock('./evaluateTemplate', () => ({
  evaluateTemplateString: jest.fn(),
}));

jest.mock('./useRequestInit', () => ({
  getRequestInit: jest.fn().mockResolvedValue({}),
}));

const { evaluateTemplateString } = jest.requireMock('./evaluateTemplate');

describe('validateSingleField', () => {
  const mockUnitEvaluator = jest.fn().mockResolvedValue(undefined);
  const mockFetch = jest.fn();
  const mockFetchApi = { fetch: mockFetch };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty errors when field has no validate:url', async () => {
    const result = await validateSingleField({
      formData: { userId: 'test' },
      fieldPath: 'userId',
      uiSchemaProperty: {
        'ui:widget': 'ActiveTextInput',
        'ui:props': {},
      },
      unitEvaluator: mockUnitEvaluator,
      fetchApi: mockFetchApi,
    });

    expect(result).toEqual({});
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns empty errors when widget type is not in allowed list', async () => {
    const result = await validateSingleField({
      formData: { userId: 'test' },
      fieldPath: 'userId',
      uiSchemaProperty: {
        'ui:widget': 'SomeOtherWidget',
        'ui:props': { 'validate:url': 'http://example.com/validate' },
      },
      unitEvaluator: mockUnitEvaluator,
      fetchApi: mockFetchApi,
    });

    expect(result).toEqual({});
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns empty errors when field value is undefined', async () => {
    const result = await validateSingleField({
      formData: {},
      fieldPath: 'userId',
      uiSchemaProperty: {
        'ui:widget': 'ActiveTextInput',
        'ui:props': { 'validate:url': 'http://example.com/validate' },
      },
      unitEvaluator: mockUnitEvaluator,
      fetchApi: mockFetchApi,
    });

    expect(result).toEqual({});
  });

  it('returns errors when validate endpoint returns non-200', async () => {
    evaluateTemplateString.mockResolvedValue(
      'http://example.com/validate/test',
    );
    mockFetch.mockResolvedValue({
      status: 400,
      json: async () => ({}),
      text: async () => '',
    });

    const result = await validateSingleField({
      formData: { userId: 'test' },
      fieldPath: 'userId',
      uiSchemaProperty: {
        'ui:widget': 'ActiveTextInput',
        'ui:props': { 'validate:url': 'http://example.com/validate/${userId}' },
      },
      unitEvaluator: mockUnitEvaluator,
      fetchApi: mockFetchApi,
    });

    expect(result.userId).toBeDefined();
    expect(result.userId?.[ERRORS_KEY]).toBeDefined();
  });

  it('returns empty errors when validate endpoint returns 200', async () => {
    evaluateTemplateString.mockResolvedValue(
      'http://example.com/validate/test',
    );
    mockFetch.mockResolvedValue({ status: 200 });

    const result = await validateSingleField({
      formData: { userId: 'test' },
      fieldPath: 'userId',
      uiSchemaProperty: {
        'ui:widget': 'ActiveTextInput',
        'ui:props': { 'validate:url': 'http://example.com/validate/${userId}' },
      },
      unitEvaluator: mockUnitEvaluator,
      fetchApi: mockFetchApi,
    });

    expect(result).toEqual({});
  });

  it('collects all error messages from multiple keys in response body', async () => {
    evaluateTemplateString.mockResolvedValue(
      'http://example.com/validate/test',
    );
    const body = {
      name: ['Name is required', 'Name must be alphanumeric'],
      format: 'Invalid format',
    };
    mockFetch.mockResolvedValue({
      status: 422,
      json: async () => body,
      text: async () => JSON.stringify(body),
    });

    const result = await validateSingleField({
      formData: { userId: 'test' },
      fieldPath: 'userId',
      uiSchemaProperty: {
        'ui:widget': 'ActiveTextInput',
        'ui:props': { 'validate:url': 'http://example.com/validate/${userId}' },
      },
      unitEvaluator: mockUnitEvaluator,
      fetchApi: mockFetchApi,
    });

    expect(result.userId?.[ERRORS_KEY]).toEqual([
      'Name is required',
      'Name must be alphanumeric',
      'Invalid format',
    ]);
  });

  it('returns network error when fetch throws', async () => {
    evaluateTemplateString.mockResolvedValue(
      'http://example.com/validate/test',
    );
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await validateSingleField({
      formData: { userId: 'test' },
      fieldPath: 'userId',
      uiSchemaProperty: {
        'ui:widget': 'ActiveTextInput',
        'ui:props': { 'validate:url': 'http://example.com/validate/${userId}' },
      },
      unitEvaluator: mockUnitEvaluator,
      fetchApi: mockFetchApi,
    });

    expect(result.userId?.[ERRORS_KEY]).toEqual([
      'Validation request failed: unable to reach the server',
    ]);
  });

  it('returns error when validate:url fails to evaluate to a string', async () => {
    evaluateTemplateString.mockResolvedValue(42);

    const result = await validateSingleField({
      formData: { userId: 'test' },
      fieldPath: 'userId',
      uiSchemaProperty: {
        'ui:widget': 'ActiveTextInput',
        'ui:props': { 'validate:url': '${invalid}' },
      },
      unitEvaluator: mockUnitEvaluator,
      fetchApi: mockFetchApi,
    });

    expect(result.userId?.[ERRORS_KEY]).toEqual(
      expect.arrayContaining([
        expect.stringContaining('not evaluated to a string'),
      ]),
    );
  });
});
