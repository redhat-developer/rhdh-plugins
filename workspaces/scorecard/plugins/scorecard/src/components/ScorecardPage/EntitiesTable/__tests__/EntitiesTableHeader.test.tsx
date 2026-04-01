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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EntitiesTableHeader } from '../EntitiesTableHeader';

const mockT = jest.fn((key: string) => key);
jest.mock('../../../../hooks/useTranslation', () => ({
  useTranslation: () => ({ t: mockT }),
}));

describe('EntitiesTableHeader', () => {
  const defaultProps = {
    orderBy: null as string | null,
    order: 'asc' as const,
    onSortRequest: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all table headers from SCORECARD_ENTITIES_TABLE_HEADERS', () => {
    render(
      <table>
        <EntitiesTableHeader {...defaultProps} />
      </table>,
    );

    expect(
      screen.getByText('entitiesPage.entitiesTable.header.status'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('entitiesPage.entitiesTable.header.value'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('entitiesPage.entitiesTable.header.entity'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('entitiesPage.entitiesTable.header.owner'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('entitiesPage.entitiesTable.header.kind'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('entitiesPage.entitiesTable.header.lastUpdated'),
    ).toBeInTheDocument();
  });

  it('should call onSortRequest when sortable header is clicked', async () => {
    const onSortRequest = jest.fn();
    render(
      <table>
        <EntitiesTableHeader {...defaultProps} onSortRequest={onSortRequest} />
      </table>,
    );

    const statusHeader = screen.getByText(
      'entitiesPage.entitiesTable.header.status',
    );
    await userEvent.click(statusHeader);

    expect(onSortRequest).toHaveBeenCalledWith('status');
  });

  it('should pass orderBy and order to sortable column', () => {
    render(
      <table>
        <EntitiesTableHeader {...defaultProps} orderBy="status" order="desc" />
      </table>,
    );

    const sortLabel = screen.getByRole('button', {
      name: /entitiesPage.entitiesTable.header.status/i,
    });
    expect(sortLabel).toBeInTheDocument();
  });

  it('should call onSortRequest with the correct column id when a different sortable header is clicked', async () => {
    const onSortRequest = jest.fn();
    render(
      <table>
        <EntitiesTableHeader {...defaultProps} onSortRequest={onSortRequest} />
      </table>,
    );

    await userEvent.click(
      screen.getByText('entitiesPage.entitiesTable.header.entity'),
    );
    expect(onSortRequest).toHaveBeenCalledWith('entityName');

    await userEvent.click(
      screen.getByText('entitiesPage.entitiesTable.header.lastUpdated'),
    );
    expect(onSortRequest).toHaveBeenCalledWith('timestamp');
  });

  it('should call onSortRequest again when clicking the already-active sorted column', async () => {
    const onSortRequest = jest.fn();
    render(
      <table>
        <EntitiesTableHeader
          orderBy="status"
          order="asc"
          onSortRequest={onSortRequest}
        />
      </table>,
    );

    const statusHeader = screen.getByText(
      'entitiesPage.entitiesTable.header.status',
    );
    await userEvent.click(statusHeader);
    await userEvent.click(statusHeader);

    expect(onSortRequest).toHaveBeenCalledTimes(2);
    expect(onSortRequest).toHaveBeenCalledWith('status');
  });
});
