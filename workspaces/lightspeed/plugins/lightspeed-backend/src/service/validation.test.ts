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

import { isAllowedProxyPath } from './validation';

describe('isAllowedProxyPath', () => {
  it.each(['/v1/models', '/v1/shields', '/v2/conversations', '/v1/feedback'])(
    'should allow exact match for %s',
    path => {
      expect(isAllowedProxyPath(path)).toBe(true);
    },
  );

  it.each([
    ['/v2/conversations/conv-123', '/v2/conversations'],
    ['/v1/feedback/status', '/v1/feedback'],
  ])('should allow sub-path %s under prefix %s', path => {
    expect(isAllowedProxyPath(path)).toBe(true);
  });

  it.each([
    '/v1/admin',
    '/internal/config',
    '/metrics',
    '/v3/something',
    '/debug',
    '',
  ])('should reject arbitrary path %s', path => {
    expect(isAllowedProxyPath(path)).toBe(false);
  });

  it.each([
    '/v1/models-secret',
    '/v1/shieldsadmin',
    '/v2/conversationsextra',
    '/v1/feedbackextra',
  ])('should reject prefix false match %s', path => {
    expect(isAllowedProxyPath(path)).toBe(false);
  });
});
