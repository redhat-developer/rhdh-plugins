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

import {
  ErrorBuilder,
  NO_CLIENT_PROVIDED,
  NO_DATA_INDEX_URL,
  NO_LOG_STORAGE_URL,
  SWF_BACKEND_NOT_INITED,
} from './errorBuilder';

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

  describe('GET_NO_LOG_STORAGE_URL_ERR', () => {
    it('should return an error with NO_LOG_STORAGE_URL name', () => {
      const error = ErrorBuilder.GET_NO_LOG_STORAGE_URL_ERR();

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe(NO_LOG_STORAGE_URL);
      expect(error.message).toBe('No log storage url specified or found');
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

  describe('GET_NO_CLIENT_PROVIDED_ERR', () => {
    it('should return an error with NO_CLIENT_PROVIDED name', () => {
      const error = ErrorBuilder.GET_NO_CLIENT_PROVIDED_ERR();

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe(NO_CLIENT_PROVIDED);
      expect(error.message).toBe('No or null graphql client');
    });
  });

  describe('GET_SWF_BACKEND_NOT_INITED', () => {
    it('should return an error with SWF_BACKEND_NOT_INITED name', () => {
      const error = ErrorBuilder.GET_SWF_BACKEND_NOT_INITED();

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe(SWF_BACKEND_NOT_INITED);
      expect(error.message).toBe(
        'The SonataFlow backend is not initialized, call initialize() method before trying to get the workflows.',
      );
    });
  });
});
