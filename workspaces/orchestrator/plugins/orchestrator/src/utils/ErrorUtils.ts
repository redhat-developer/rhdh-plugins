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

import { isError } from '@backstage/errors';

export const getErrorObject = (err: unknown): Error => {
  if (isError(err)) {
    return err;
  }
  if (typeof err === 'string') {
    return new Error(err);
  }
  return new Error('Unexpected error');
};

const SAML_SSO_INDICATORS = [
  'saml sso session expired',
  'x-github-sso',
  're-authorize at:',
  'saml session',
  'saml re-authorization',
  'organization saml enforcement',
  'grant your oauth token access',
  'saml enforcement',
];

export const isSamlSsoError = (error: Error | undefined): boolean => {
  if (!error?.message) return false;
  const message = error.message.toLowerCase();
  if (!message.includes('github')) return false;
  return SAML_SSO_INDICATORS.some(indicator => message.includes(indicator));
};

export const extractSsoReauthorizeUrl = (
  error: Error | undefined,
): string | undefined => {
  if (!error?.message) return undefined;
  const match = error.message.match(/Re-authorize at:\s*(\S+)/i);
  return match?.[1];
};
