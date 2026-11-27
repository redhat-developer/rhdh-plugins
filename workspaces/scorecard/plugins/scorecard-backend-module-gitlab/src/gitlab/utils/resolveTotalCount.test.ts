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

import { resolveTotalCount } from './resolveTotalCount';

describe('resolveTotalCount', () => {
  it('should throw when total is undefined', () => {
    expect(() => resolveTotalCount(undefined, 'issues')).toThrow(
      'GitLab did not return a pagination total for issues. ' +
        'Counts cannot be derived from a single page when X-Total is absent.',
    );
  });

  it('should throw when total is NaN', () => {
    expect(() => resolveTotalCount(Number.NaN, 'pipelines')).toThrow(
      'GitLab did not return a pagination total for pipelines. ' +
        'Counts cannot be derived from a single page when X-Total is absent.',
    );
  });

  it('should return a finite total', () => {
    expect(resolveTotalCount(42, 'issues')).toBe(42);
    expect(resolveTotalCount(0, 'merge requests')).toBe(0);
  });
});
