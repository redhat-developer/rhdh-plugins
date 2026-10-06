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

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { EntityHeaderBui } from './EntityHeaderBui';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: () => ({ getEntitiesByRefs: async () => ({ items: [] }) }),
  useRouteRefParams: () => ({ kind: 'component', name: 'component-1' }),
}));

jest.mock('@backstage/core-plugin-api/alpha', () => ({
  ...jest.requireActual('@backstage/core-plugin-api/alpha'),
  useTranslationRef: () => ({ t: (key: string) => key }),
}));

jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  useAsyncEntity: () => ({
    entity: { kind: 'Component', metadata: { name: 'component-1' } },
  }),
  useEntityPresentation: () => ({ primaryTitle: 'component-1' }),
  useEntityRefLink: () => () => '/catalog/default/component/component-1',
  useStarredEntity: () => ({
    isStarredEntity: false,
    toggleStarredEntity: jest.fn(),
  }),
}));

jest.mock('../EntityContextMenu/EntityContextMenu', () => ({
  EntityContextMenu: () => null,
}));

function CurrentPath() {
  return <output data-testid="current-path">{useLocation().pathname}</output>;
}

describe('EntityHeaderBui', () => {
  it('uses client-side routing when an entity tab is clicked', async () => {
    render(
      <MemoryRouter
        initialEntries={['/catalog/default/component/component-1']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <EntityHeaderBui
          tabs={[
            {
              id: 'docs',
              label: 'Docs',
              href: '/catalog/default/component/component-1/docs',
            },
          ]}
        />
        <CurrentPath />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Docs' }));

    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent(
        '/catalog/default/component/component-1/docs',
      ),
    );
  });
});
