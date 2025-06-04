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
import { screen } from '@testing-library/react';
import type { CatalogApi } from '@backstage/catalog-client';
import { useUserProfile } from '@backstage/plugin-user-settings';
import { catalogApiRef } from '@backstage/plugin-catalog-react';

import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { ProfileDropdown } from './ProfileDropdown';

jest.mock('@backstage/plugin-user-settings', () => ({
  useUserProfile: jest.fn(),
}));

jest.mock('../../hooks/useProfileDropdownMountPoints', () => ({
  useProfileDropdownMountPoints: () => [
    {
      Component: jest.fn(),
      config: {
        props: {
          icon: 'someicon',
          title: 'sometitle',
          link: 'somelink',
        },
        priority: '100',
      },
    },
  ],
}));

describe('ProfileDropdown', () => {
  it('should render the configured profile displayname', async () => {
    (useUserProfile as jest.Mock).mockReturnValue({
      displayName: 'Test User',
      backstageIdentity: { userEntityRef: 'user:default/test-user' },
      profile: { picture: 'picture' },
      loading: false,
    });
    const mockCatalogApi = {
      getEntityByRef: () => ({
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'User',
        metadata: {
          name: 'test-user',
          title: 'Test User',
        },
        spec: {
          profile: { displayName: 'Test User DN' },
          memberOf: ['janus-authors'],
        },
      }),
    } as any as CatalogApi;

    await renderInTestApp(
      <TestApiProvider apis={[[catalogApiRef, mockCatalogApi]]}>
        <ProfileDropdown />
      </TestApiProvider>,
    );

    expect(screen.getByText(/Test User DN/i)).toBeInTheDocument();
  });

  it('should render the title if profile displayname is not configured', async () => {
    (useUserProfile as jest.Mock).mockReturnValue({
      displayName: 'testuser1',
      backstageIdentity: { userEntityRef: 'user:default/test-user' },
      profile: { picture: 'picture' },
      loading: false,
    });
    const mockCatalogApi = {
      getEntityByRef: () => ({
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'User',
        metadata: {
          name: 'test-user',
          title: 'Test User',
        },
        spec: {
          memberOf: ['janus-authors'],
        },
      }),
    } as any as CatalogApi;

    await renderInTestApp(
      <TestApiProvider apis={[[catalogApiRef, mockCatalogApi]]}>
        <ProfileDropdown />
      </TestApiProvider>,
    );

    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  it('should render the user entity ref when user is not configured in the catalog', async () => {
    (useUserProfile as jest.Mock).mockReturnValue({
      displayName: 'user:default/test',
      backstageIdentity: { userEntityRef: 'user:default/test' },
      profile: { picture: 'picture' },
      loading: false,
    });
    const mockCatalogApi = {
      getEntityByRef: () => ({
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'User',
        metadata: {
          name: 'test-user',
        },
        spec: {
          memberOf: ['janus-authors'],
        },
      }),
    } as any as CatalogApi;

    await renderInTestApp(
      <TestApiProvider apis={[[catalogApiRef, mockCatalogApi]]}>
        <ProfileDropdown />
      </TestApiProvider>,
    );

    expect(screen.getByText(/Test/i)).toBeInTheDocument();
  });
});
