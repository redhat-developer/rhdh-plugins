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

import type { Request } from 'express';

import { getIdentity } from './getIdentity';

describe('getIdentity', () => {
  it('returns credentials and userEntityRef when both are set', () => {
    const req = {
      credentials: { $$type: '@backstage/BackstageCredentials' },
      userEntityRef: 'user:default/guest',
    } as unknown as Request;

    const result = getIdentity(req);

    expect(result.credentials).toBe(req.credentials);
    expect(result.userEntityRef).toBe('user:default/guest');
  });

  it('throws when credentials is missing', () => {
    const req = {
      userEntityRef: 'user:default/guest',
    } as unknown as Request;

    expect(() => getIdentity(req)).toThrow('Identity middleware did not run');
  });

  it('throws when userEntityRef is missing', () => {
    const req = {
      credentials: { $$type: '@backstage/BackstageCredentials' },
    } as unknown as Request;

    expect(() => getIdentity(req)).toThrow('Identity middleware did not run');
  });

  it('throws when both credentials and userEntityRef are missing', () => {
    const req = {} as unknown as Request;

    expect(() => getIdentity(req)).toThrow('Identity middleware did not run');
  });
});
