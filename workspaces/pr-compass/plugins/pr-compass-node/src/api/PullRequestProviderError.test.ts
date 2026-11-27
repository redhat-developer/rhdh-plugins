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

import { SourceErrorCodes } from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';
import { PullRequestProviderError } from './PullRequestProviderError';

describe('PullRequestProviderError', () => {
  describe('is', () => {
    it.each([
      SourceErrorCodes.UNAUTHORISED,
      SourceErrorCodes.FORBIDDEN,
      SourceErrorCodes.RATE_LIMITED,
      SourceErrorCodes.FETCH_FAILED,
    ])('recognizes an instance with code %s', code => {
      expect(
        PullRequestProviderError.is(new PullRequestProviderError(code)),
      ).toBe(true);
    });

    it('recognizes an error-shaped object with a valid code', () => {
      expect(
        PullRequestProviderError.is({
          name: 'PullRequestProviderError',
          message: 'rate limited',
          code: SourceErrorCodes.RATE_LIMITED,
        }),
      ).toBe(true);
    });

    it('rejects an unrecognized code', () => {
      expect(
        PullRequestProviderError.is({
          name: 'PullRequestProviderError',
          message: 'leaked github-token',
          code: 'github-token',
        }),
      ).toBe(false);
    });

    it('rejects the SCM_SESSION_REQUIRED code', () => {
      expect(
        PullRequestProviderError.is({
          name: 'PullRequestProviderError',
          message: 'session required',
          code: SourceErrorCodes.SCM_SESSION_REQUIRED,
        }),
      ).toBe(false);
    });

    it('rejects a missing code', () => {
      expect(
        PullRequestProviderError.is({
          name: 'PullRequestProviderError',
          message: 'no code',
        }),
      ).toBe(false);
    });

    it('rejects other errors', () => {
      expect(PullRequestProviderError.is(new Error('boom'))).toBe(false);
      expect(
        PullRequestProviderError.is(
          Object.assign(new Error('boom'), {
            code: SourceErrorCodes.FORBIDDEN,
          }),
        ),
      ).toBe(false);
    });

    it('rejects non-error values', () => {
      expect(PullRequestProviderError.is(undefined)).toBe(false);
      expect(PullRequestProviderError.is(null)).toBe(false);
      expect(PullRequestProviderError.is('PullRequestProviderError')).toBe(
        false,
      );
      expect(
        PullRequestProviderError.is({ code: SourceErrorCodes.FORBIDDEN }),
      ).toBe(false);
    });
  });
});
