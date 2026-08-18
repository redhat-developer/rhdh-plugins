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
  extractSsoReauthorizeUrl,
  getErrorObject,
  isSamlSsoError,
} from './ErrorUtils';

describe('getErrorObject', () => {
  it('returns the same Error instance', () => {
    const err = new Error('boom');
    expect(getErrorObject(err)).toBe(err);
  });

  it('wraps string errors', () => {
    expect(getErrorObject('string failure')).toEqual(
      new Error('string failure'),
    );
  });

  it('falls back for unexpected values', () => {
    expect(getErrorObject({ nope: true })).toEqual(
      new Error('Unexpected error'),
    );
  });
});

describe('isSamlSsoError', () => {
  it('returns true for GitHub SAML SSO expired message', () => {
    expect(isSamlSsoError(new Error('GitHub SAML SSO session expired.'))).toBe(
      true,
    );
  });

  it('returns true for GitHub organization SAML enforcement message', () => {
    expect(
      isSamlSsoError(
        new Error('GitHub resource protected by organization SAML enforcement'),
      ),
    ).toBe(true);
  });

  it('returns false for non-GitHub SAML errors', () => {
    expect(
      isSamlSsoError(
        new Error('Resource protected by organization SAML enforcement'),
      ),
    ).toBe(false);
  });

  it('returns false for unrelated errors', () => {
    expect(isSamlSsoError(new Error('Network timeout'))).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isSamlSsoError(undefined)).toBe(false);
  });

  it('returns false for empty error message', () => {
    expect(isSamlSsoError(new Error(''))).toBe(false);
  });

  it('is case-insensitive for github keyword', () => {
    expect(isSamlSsoError(new Error('GITHUB SAML SSO session expired.'))).toBe(
      true,
    );
  });

  it('returns true for x-github-sso header indicator', () => {
    expect(
      isSamlSsoError(
        new Error('GitHub request failed with x-github-sso header'),
      ),
    ).toBe(true);
  });

  it('returns true for grant oauth token access on GitHub', () => {
    expect(
      isSamlSsoError(
        new Error(
          'GitHub: You must grant your OAuth token access to this organization',
        ),
      ),
    ).toBe(true);
  });
});

describe('extractSsoReauthorizeUrl', () => {
  it('extracts URL from error message', () => {
    const err = new Error(
      'GitHub SAML SSO session expired. Re-authorize at: https://github.com/orgs/acme/sso?sso=abc',
    );
    expect(extractSsoReauthorizeUrl(err)).toBe(
      'https://github.com/orgs/acme/sso?sso=abc',
    );
  });

  it('returns undefined when no URL present', () => {
    expect(
      extractSsoReauthorizeUrl(new Error('Some other error')),
    ).toBeUndefined();
  });

  it('returns undefined for undefined error', () => {
    expect(extractSsoReauthorizeUrl(undefined)).toBeUndefined();
  });

  it('returns undefined when message has no Re-authorize prefix', () => {
    expect(
      extractSsoReauthorizeUrl(new Error('GitHub SAML SSO session expired.')),
    ).toBeUndefined();
  });
});
