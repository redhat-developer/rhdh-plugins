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

import { renderInTestApp } from '@backstage/frontend-test-utils';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { EntityContextMenu } from './EntityContextMenu';

jest.mock('@backstage/core-plugin-api/alpha', () => ({
  ...jest.requireActual('@backstage/core-plugin-api/alpha'),
  useTranslationRef: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@backstage/frontend-plugin-api', () => {
  const actual = jest.requireActual('@backstage/frontend-plugin-api');
  return {
    ...actual,
    useTranslationRef: () => ({
      t: (key: string) => key,
    }),
    dialogApiRef: { id: 'core.dialog' },
  };
});

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    useApi: (apiRef: { id: string }) => {
      if (apiRef.id === 'core.dialog') {
        return { open: jest.fn() };
      }
      if (apiRef.id === 'core.alert') {
        return { post: jest.fn() };
      }
      return actual.useApi(apiRef);
    },
    useRouteRef: () => () => '/catalog',
  };
});

jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  useEntity: () => ({
    entity: { kind: 'Component', metadata: { name: 'demo' } },
  }),
}));

jest.mock('@backstage/plugin-catalog-react/alpha', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react/alpha'),
  useEntityPermission: () => ({ allowed: true, loading: false }),
}));

describe('EntityContextMenu', () => {
  it('renders stock fallback actions when no extension items are provided', async () => {
    await renderInTestApp(<EntityContextMenu />);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'entityContextMenu.moreButtonAriaLabel',
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', {
          name: 'entityContextMenu.unregisterMenuTitle',
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', {
          name: 'entityContextMenu.inspectMenuTitle',
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', {
          name: 'entityContextMenu.copyURLMenuTitle',
        }),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText('No results found.')).not.toBeInTheDocument();
  });
});
