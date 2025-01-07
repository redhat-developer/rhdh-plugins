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

import { useApi } from '@backstage/core-plugin-api';

import { renderHook, waitFor } from '@testing-library/react';

import { useBackstageUserIdentity } from '../useBackstageUserIdentity';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const identityMock = jest.fn();
const identityApi = {
  getBackstageIdentity: identityMock,
};

(useApi as jest.Mock).mockReturnValue(identityApi);

describe('useBackstageUserIdentity', () => {
  it('should return undefined when there is no user data available', async () => {
    const { result } = renderHook(() => useBackstageUserIdentity());

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });

  it('should return user identity', async () => {
    identityMock.mockReturnValue({
      userEntityRef: 'user:default/guest',
    });
    const { result } = renderHook(() => useBackstageUserIdentity());

    await waitFor(() => {
      expect(result.current).not.toBeUndefined();
    });
  });
});
