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

import { renderInTestApp } from '@backstage/test-utils';
import { screen } from '@testing-library/react';
import { useEntitySubcomponents } from '../../../hooks/useEntitySubcomponents';
import { Entity } from '@backstage/catalog-model';
import { SubcommponentLinkTableCell } from '../SubcomponentLinkTableCell';

jest.mock('../../../hooks/useEntitySubcomponents');
jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  useEntity: jest.fn(),
  useRelatedEntities: jest.fn().mockReturnValue({
    entities: [],
    loading: false,
    error: undefined,
  }),
}));

const mockUseEntitySubcomponents =
  useEntitySubcomponents as jest.MockedFunction<typeof useEntitySubcomponents>;

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-entity',
    namespace: 'default',
    title: 'Test Entity',
  },
};

// return - if subcomponentName is undefined
// return - if currentEntity is null/undefined
// render link with currentEntity.metadata.title
// render link with subcomponentName when currentEntity.metadata?.title is not defined

describe('SubcomponentLinkTableCell', () => {
  beforeEach(() => {
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['test-entity'],
      subcomponentEntities: [mockEntity],
      loading: false,
      error: undefined,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('return dash (-) if subcomponentName is undefined', async () => {
    await renderInTestApp(
      <SubcommponentLinkTableCell
        entity={mockEntity}
        subcomponentName={undefined}
      />,
    );

    const tableCell = screen.queryByTestId('subcomponent-link-table-cell');

    expect(tableCell).not.toBeInTheDocument();
  });

  it('return dash (-) if currentEntity is undefined', async () => {
    await renderInTestApp(
      <SubcommponentLinkTableCell
        entity={mockEntity}
        subcomponentName="non-existing-entity"
      />,
    );

    const tableCell = screen.queryByTestId('subcomponent-link-table-cell');

    expect(tableCell).not.toBeInTheDocument();
  });

  it('render link with currentEntity.metadata.title', async () => {
    await renderInTestApp(
      <SubcommponentLinkTableCell
        entity={mockEntity}
        subcomponentName="test-entity"
      />,
    );

    const tableCell = screen.queryByTestId('subcomponent-link-table-cell');

    expect(tableCell).toBeInTheDocument();
    expect(
      screen.queryByText(mockEntity.metadata?.title || ''),
    ).toBeInTheDocument();
  });

  it('render link with subcomponentName when currentEntity.metadata?.title is not defined', async () => {
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['test-entity'],
      subcomponentEntities: [
        {
          ...mockEntity,
          metadata: { ...mockEntity.metadata, title: undefined },
        },
      ],
      loading: false,
      error: undefined,
    });
    await renderInTestApp(
      <SubcommponentLinkTableCell
        entity={mockEntity}
        subcomponentName="test-entity"
      />,
    );

    const tableCell = screen.queryByTestId('subcomponent-link-table-cell');

    expect(tableCell).toBeInTheDocument();
    expect(screen.queryByText('test-entity')).toBeInTheDocument();
  });
});
