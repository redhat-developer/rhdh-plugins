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
import { ValidationError } from './ValidationError';

describe('ValidationError', () => {
  it('should create an instance with a message and details', () => {
    const message = 'Invalid input';
    const details = { field: 'action', error: 'Action is Required' };

    const error = new ValidationError(message, details);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe(message);
    expect(error.details).toEqual(details);
    expect(error.name).toBe('ValidationError');
  });

  it('should have the correct prototype chain', () => {
    const error = new ValidationError('Error message', {});

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ValidationError);
    expect(Object.getPrototypeOf(error)).toBe(ValidationError.prototype);
  });

  // eslint-disable-next-line jest/no-conditional-expect
  it('should properly propagate in a try-catch block', () => {
    expect(() => {
      throw new ValidationError('Something went wrong', { field: 'username' });
    }).toThrow(ValidationError);

    expect(() => {
      throw new ValidationError('Something went wrong', { field: 'username' });
    }).toThrow('Something went wrong');
  });
});
