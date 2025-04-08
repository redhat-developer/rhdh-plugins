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

import { errorMessage } from '../common';

describe('errorMessage', () => {
  it('should return the string directly when input is a string', () => {
    const error = 'test error message';
    expect(errorMessage(error)).toBe('test error message');
  });

  it('should return message from Error object', () => {
    const error = new Error('test error');
    expect(errorMessage(error)).toBe('test error');
  });

  it('should return message from object with message property', () => {
    const error = { message: 'test error from object' };
    expect(errorMessage(error)).toBe('test error from object');
  });

  it('should return stringified object when object has no message property', () => {
    const error = { code: 404, details: 'not found' };
    expect(errorMessage(error)).toBe('{"code":404,"details":"not found"}');
  });

  it('should return fallback message for null input', () => {
    expect(errorMessage(null)).toBe('An unknown error occurred');
  });

  it('should return fallback message for undefined input', () => {
    expect(errorMessage(undefined)).toBe('An unknown error occurred');
  });

  it('should return fallback message for non-string message property', () => {
    const error = { message: 123 };
    expect(errorMessage(error)).toBe('{"message":123}');
  });
});
