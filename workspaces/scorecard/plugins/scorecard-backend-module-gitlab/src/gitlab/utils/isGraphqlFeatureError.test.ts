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

import { isGraphqlFeatureError } from './isGraphqlFeatureError';

describe('isGraphqlFeatureError', () => {
  it('should match unknown closedAfter argument errors', () => {
    expect(
      isGraphqlFeatureError(
        new Error(
          'GitLab GraphQL errors: Unknown argument "closedAfter" on field "mergeRequests" of type "Project"',
        ),
      ),
    ).toBe(true);
  });

  it('should match undefined closedAfter field errors', () => {
    expect(
      isGraphqlFeatureError(
        new Error('GitLab GraphQL errors: Field closedAfter is not defined'),
      ),
    ).toBe(true);
  });

  it('should match unknown mergedAfter argument errors', () => {
    expect(
      isGraphqlFeatureError(
        new Error(
          'GitLab GraphQL errors: Argument "mergedAfter" doesn\'t exist on type Project',
        ),
      ),
    ).toBe(true);
  });

  it('should not match auth or generic GraphQL failures', () => {
    expect(
      isGraphqlFeatureError(
        new Error('GitLab GraphQL request failed with status 401 Unauthorized'),
      ),
    ).toBe(false);
    expect(isGraphqlFeatureError(new Error('timeout'))).toBe(false);
    expect(
      isGraphqlFeatureError(
        new Error('GitLab GraphQL errors: Internal server error'),
      ),
    ).toBe(false);
  });
});
