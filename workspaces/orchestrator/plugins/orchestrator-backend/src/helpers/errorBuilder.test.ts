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

import { ErrorBuilder, NO_DATA_INDEX_URL } from './errorBuilder';

describe('ErrorBuilder', () => {
  describe('NewBackendError', () => {
    it('should create an Error with custom name and message', () => {
      const errorName = 'CUSTOM_ERROR';
      const errorMessage = 'This is a custom error message';

      const error = ErrorBuilder.NewBackendError(errorName, errorMessage);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe(errorName);
      expect(error.message).toBe(errorMessage);
    });

    it('should create an Error with empty message', () => {
      const errorName = 'EMPTY_MESSAGE_ERROR';
      const errorMessage = '';

      const error = ErrorBuilder.NewBackendError(errorName, errorMessage);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe(errorName);
      expect(error.message).toBe('');
    });
  });

  describe('GET_NO_DATA_INDEX_URL_ERR', () => {
    it('should return an error with NO_DATA_INDEX_URL name', () => {
      const error = ErrorBuilder.GET_NO_DATA_INDEX_URL_ERR();

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe(NO_DATA_INDEX_URL);
      expect(error.message).toBe('No data index url specified or found');
    });
  });
});
