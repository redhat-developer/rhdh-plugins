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
  extractRequiredPermission,
  isAccessDeniedError,
} from './PermissionDeniedPanel';

describe('isAccessDeniedError', () => {
  it('returns false for undefined errors', () => {
    expect(isAccessDeniedError(undefined)).toBe(false);
  });

  it.each([
    'Access denied for user',
    'Unauthorized request',
    'Action is not allowed',
    'Missing permission to view',
  ])('detects access denial phrasing: %s', message => {
    expect(isAccessDeniedError(new Error(message))).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isAccessDeniedError(new Error('Network timeout'))).toBe(false);
  });
});

describe('extractRequiredPermission', () => {
  it('returns undefined when there is no error message', () => {
    expect(extractRequiredPermission(undefined)).toBeUndefined();
    expect(extractRequiredPermission(new Error(''))).toBeUndefined();
  });

  it('extracts a quoted permission name from the message', () => {
    expect(
      extractRequiredPermission(
        new Error(
          "User lacks 'orchestrator.workflow.use.permission' to continue",
        ),
      ),
    ).toBe('orchestrator.workflow.use.permission');
  });

  it('returns undefined when no permission token is quoted', () => {
    expect(
      extractRequiredPermission(new Error('Access denied')),
    ).toBeUndefined();
  });
});
