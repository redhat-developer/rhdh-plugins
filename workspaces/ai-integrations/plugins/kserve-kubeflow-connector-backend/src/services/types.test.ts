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

import { sanitizeName } from './types';

describe('sanitizeName', () => {
  it('should convert uppercase to lowercase', () => {
    expect(sanitizeName('MyModel')).toBe('mymodel');
  });

  it('should replace special characters with hyphens', () => {
    expect(sanitizeName('my model!v2')).toBe('my-model-v2');
  });

  it('should leave already-clean input unchanged', () => {
    expect(sanitizeName('my-clean-name')).toBe('my-clean-name');
  });

  it('should handle empty string', () => {
    expect(sanitizeName('')).toBe('');
  });

  it('should replace multiple consecutive special chars with individual hyphens', () => {
    expect(sanitizeName('a..b//c')).toBe('a--b--c');
  });

  it('should handle mixed case with numbers and hyphens', () => {
    expect(sanitizeName('Granite-3.1-8B')).toBe('granite-3-1-8b');
  });
});
