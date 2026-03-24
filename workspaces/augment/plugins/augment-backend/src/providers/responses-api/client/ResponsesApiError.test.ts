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

import { ResponsesApiError } from './ResponsesApiClient';

describe('ResponsesApiError', () => {
  it('extracts detail from JSON body', () => {
    const err = new ResponsesApiError(
      400,
      'Bad Request',
      JSON.stringify({ detail: 'unsupported tool type: function' }),
    );
    expect(err.statusCode).toBe(400);
    expect(err.detail).toBe('unsupported tool type: function');
    expect(err.message).toContain('unsupported tool type: function');
  });

  it('falls back to raw body when not JSON', () => {
    const err = new ResponsesApiError(500, 'Server Error', 'raw text error');
    expect(err.detail).toBe('raw text error');
  });

  it('truncates long raw body', () => {
    const longBody = 'x'.repeat(500);
    const err = new ResponsesApiError(500, 'Error', longBody);
    expect(err.detail.length).toBeLessThanOrEqual(303);
    expect(err.detail).toContain('...');
  });

  it('isValidationError returns true for 400 and 422', () => {
    expect(new ResponsesApiError(400, '', '').isValidationError()).toBe(true);
    expect(new ResponsesApiError(422, '', '').isValidationError()).toBe(true);
    expect(new ResponsesApiError(500, '', '').isValidationError()).toBe(false);
  });

  it('mentionsToolType detects tool-related errors', () => {
    const err = new ResponsesApiError(
      400,
      '',
      JSON.stringify({ detail: 'unsupported tool type: function' }),
    );
    expect(err.mentionsToolType()).toBe(true);
  });

  it('mentionsToolType returns false for unrelated errors', () => {
    const err = new ResponsesApiError(
      400,
      '',
      JSON.stringify({ detail: 'invalid model name' }),
    );
    expect(err.mentionsToolType()).toBe(false);
  });

  it('mentionsStrictField detects strict-related errors with field context', () => {
    const err = new ResponsesApiError(
      422,
      '',
      JSON.stringify({ detail: 'unexpected field strict in schema' }),
    );
    expect(err.mentionsStrictField()).toBe(true);
  });

  it('has correct name property', () => {
    const err = new ResponsesApiError(400, '', '');
    expect(err.name).toBe('ResponsesApiError');
    expect(err instanceof Error).toBe(true);
  });

  it('message uses Responses API prefix', () => {
    const err = new ResponsesApiError(400, 'Bad Request', '{}');
    expect(err.message).toContain('Responses API error');
  });

  it('instanceof works correctly after Object.setPrototypeOf', () => {
    const err = new ResponsesApiError(422, 'Unprocessable Entity', '{}');
    expect(err instanceof ResponsesApiError).toBe(true);
    expect(err instanceof Error).toBe(true);
    expect(err.isValidationError()).toBe(true);
  });

  it('extracts error from different JSON field names', () => {
    expect(
      new ResponsesApiError(400, '', JSON.stringify({ error: 'err1' })).detail,
    ).toBe('err1');
    expect(
      new ResponsesApiError(400, '', JSON.stringify({ message: 'msg1' }))
        .detail,
    ).toBe('msg1');
  });

  it('extracts detail from Pydantic array-style validation errors', () => {
    const pydanticBody = JSON.stringify({
      detail: [
        {
          msg: 'extra inputs are not permitted',
          loc: ['body', 'tools', 0, 'strict'],
        },
        { msg: 'value is not valid', loc: ['body', 'tools', 0, 'type'] },
      ],
    });
    const err = new ResponsesApiError(
      422,
      'Unprocessable Entity',
      pydanticBody,
    );
    expect(err.detail).toContain('extra inputs are not permitted');
    expect(err.detail).toContain('strict');
    expect(err.detail).toContain('value is not valid');
  });

  it('mentionsStrictField avoids false positives on unrelated use', () => {
    const err = new ResponsesApiError(
      400,
      '',
      JSON.stringify({ detail: 'strict mode is enabled for safety' }),
    );
    expect(err.mentionsStrictField()).toBe(false);
  });

  it('mentionsStrictField detects Pydantic-style strict field errors', () => {
    const err = new ResponsesApiError(
      422,
      '',
      JSON.stringify({
        detail: 'extra inputs are not permitted: strict field',
      }),
    );
    expect(err.mentionsStrictField()).toBe(true);
  });
});
