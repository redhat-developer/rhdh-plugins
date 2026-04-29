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

import { globToRegex, matchesApplicationPattern } from '../patterns';

describe('globToRegex', () => {
  it('should match exact string when no wildcard', () => {
    const regex = globToRegex('my-app');
    expect(regex.test('my-app')).toBe(true);
    expect(regex.test('my-app-extra')).toBe(false);
    expect(regex.test('prefix-my-app')).toBe(false);
  });

  it('should match prefix wildcard', () => {
    const regex = globToRegex('my-app-*');
    expect(regex.test('my-app-frontend')).toBe(true);
    expect(regex.test('my-app-backend')).toBe(true);
    expect(regex.test('my-app-')).toBe(true);
    expect(regex.test('other-app')).toBe(false);
  });

  it('should match suffix wildcard', () => {
    const regex = globToRegex('*-backend');
    expect(regex.test('my-app-backend')).toBe(true);
    expect(regex.test('other-backend')).toBe(true);
    expect(regex.test('backend')).toBe(false);
    expect(regex.test('my-app-frontend')).toBe(false);
  });

  it('should match contains wildcard', () => {
    const regex = globToRegex('*-api-*');
    expect(regex.test('my-api-service')).toBe(true);
    expect(regex.test('test-api-backend')).toBe(true);
    expect(regex.test('my-app')).toBe(false);
  });

  it('should match all with single wildcard', () => {
    const regex = globToRegex('*');
    expect(regex.test('anything')).toBe(true);
    expect(regex.test('')).toBe(true);
  });

  it('should escape regex special characters', () => {
    const regex = globToRegex('my.app*');
    expect(regex.test('my.app-frontend')).toBe(true);
    expect(regex.test('myXapp-frontend')).toBe(false);
  });
});

describe('matchesApplicationPattern', () => {
  it('should match exact names', () => {
    expect(matchesApplicationPattern('app1', ['app1', 'app2'])).toBe(true);
    expect(matchesApplicationPattern('app3', ['app1', 'app2'])).toBe(false);
  });

  it('should match glob patterns', () => {
    expect(matchesApplicationPattern('my-app-frontend', ['my-app-*'])).toBe(
      true,
    );
    expect(matchesApplicationPattern('other-app', ['my-app-*'])).toBe(false);
  });

  it('should match mix of exact and glob patterns', () => {
    expect(
      matchesApplicationPattern('special-app', ['my-app-*', 'special-app']),
    ).toBe(true);
    expect(
      matchesApplicationPattern('my-app-backend', ['my-app-*', 'special-app']),
    ).toBe(true);
    expect(
      matchesApplicationPattern('other-app', ['my-app-*', 'special-app']),
    ).toBe(false);
  });

  it('should return false for empty patterns', () => {
    expect(matchesApplicationPattern('app1', [])).toBe(false);
  });

  it('should be case sensitive', () => {
    expect(matchesApplicationPattern('App1', ['app1'])).toBe(false);
  });
});
