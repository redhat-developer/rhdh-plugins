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

import { validateJiraConfig, validateJiraOptions } from './jiraIntegration';

describe('jiraIntegration', () => {
  describe('validateJiraConfig', () => {
    const objectError = 'Jira integration config must be an object';
    const baseUrlError = 'Missing "baseUrl" for Jira integration config';
    const tokenError = 'Missing "token" for Jira integration config';
    const productError = 'Missing "product" for Jira integration config';
    const apiVersionError = 'The "apiVersion" has invalid value format';

    it.each([
      { message: 'config is null', config: null, error: objectError },
      {
        message: 'config is not an object',
        config: 'not-an-object',
        error: objectError,
      },
      {
        message: 'baseUrl is missing',
        config: { tmp: 'tmp' },
        error: baseUrlError,
      },
      {
        message: 'baseUrl is not a string',
        config: { baseUrl: 2 },
        error: baseUrlError,
      },
      {
        message: 'baseUrl is empty',
        config: { baseUrl: '' },
        error: baseUrlError,
      },
      {
        message: 'token is missing',
        config: { baseUrl: 'https://example.com' },
        error: tokenError,
      },
      {
        message: 'token is not a string',
        config: { baseUrl: 'https://example.com', token: 1 },
        error: tokenError,
      },
      {
        message: 'token is empty',
        config: { baseUrl: 'https://example.com', token: '' },
        error: tokenError,
      },
      {
        message: 'product is missing',
        config: { baseUrl: 'https://example.com', token: 'asd213wC' },
        error: productError,
      },
      {
        message: 'product is not a string',
        config: {
          baseUrl: 'https://example.com',
          token: 'asd213wC',
          product: 1,
        },
        error: productError,
      },
      {
        message: 'product is empty',
        config: {
          baseUrl: 'https://example.com',
          token: 'asd213wC',
          product: '',
        },
        error: productError,
      },
      {
        message: 'product is not datacenter or cloud',
        config: {
          baseUrl: 'https://example.com',
          token: 'asd213wC',
          product: 'invalid',
        },
        error: productError,
      },
      {
        message: 'apiVersion is not a string',
        config: {
          baseUrl: 'https://example.com',
          token: 'asd213wC',
          product: 'datacenter',
          apiVersion: 12,
        },
        error: apiVersionError,
      },
      {
        message: 'apiVersion is empty',
        config: {
          baseUrl: 'https://example.com',
          token: 'asd213wC',
          product: 'datacenter',
          apiVersion: '',
        },
        error: apiVersionError,
      },
    ])('should throw validation error when $message', ({ config, error }) => {
      expect(() => validateJiraConfig(config)).toThrow(error);
    });

    it('should passed validation when apiVersion is not provided', () => {
      const config = {
        baseUrl: 'https://example.com',
        token: 'asd213wC',
        product: 'datacenter',
      };
      expect(() => validateJiraConfig(config)).not.toThrow();
    });
  });

  describe('validateJiraOptions', () => {
    describe('when options is not provided', () => {
      it('should passed validation', () => {
        const options = null;
        expect(() => validateJiraOptions(options)).not.toThrow();
      });
    });
    describe('when options is provided', () => {
      const objectError = 'Jira options must be an object';
      const mandatoryFilterError =
        'Jira options must have a mandatoryFilter property';
      const customFilterError =
        'Jira options must have a customFilter property';

      describe('when mandatoryFilter and customFilter are provided', () => {
        it.each([
          {
            message: 'options is not an object',
            options: 'not-an-object',
            error: objectError,
          },
          {
            message: 'mandatoryFilter option is not a string',
            options: { mandatoryFilter: 1 },
            error: mandatoryFilterError,
          },
          {
            message: 'customFilter option is not a string',
            options: { customFilter: 1 },
            error: customFilterError,
          },
        ])(
          'should throw validation error when $message',
          ({ options, error }) => {
            expect(() => validateJiraOptions(options)).toThrow(error);
          },
        );
      });
      describe('when mandatoryFilter is empty string', () => {
        it('should not validate mandatoryFilter', () => {
          const options = { mandatoryFilter: '', customFilter: '' };
          expect(() => validateJiraOptions(options)).not.toThrow();
        });
      });
      describe('when customFilter is empty string', () => {
        it('should not validate customFilter', () => {
          const options = { mandatoryFilter: '', customFilter: '' };
          expect(() => validateJiraOptions(options)).not.toThrow();
        });
      });
    });
  });
});
