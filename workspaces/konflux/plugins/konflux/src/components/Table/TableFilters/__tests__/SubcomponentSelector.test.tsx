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
import { SubcomponentSelector } from '../SubcomponentSelector';
import { waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useEntitySubcomponents } from '../../../../hooks/useEntitySubcomponents';
import { Entity } from '@backstage/catalog-model';

jest.mock('../../../../hooks/useEntitySubcomponents');
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

const mockUseEntity = useEntity as jest.MockedFunction<typeof useEntity>;

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-entity',
    namespace: 'default',
  },
};

describe('SubcomponentSelector', () => {
  beforeEach(() => {
    mockUseEntity.mockReturnValue({
      entity: mockEntity,
    });

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

  it('should return null if subcomponents array is empty', async () => {
    await renderInTestApp(
      <SubcomponentSelector
        subcomponents={[]}
        onSelectedSubcomponent={() => {}}
        selectedSubcomponent="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Subcomponent')).not.toBeInTheDocument();
    });
  });

  it('should return null if useEntitySubcomponents returns loading as true', async () => {
    mockUseEntitySubcomponents.mockReturnValue({
      subcomponentNames: ['test-entity'],
      subcomponentEntities: [mockEntity],
      loading: true,
      error: undefined,
    });

    await renderInTestApp(
      <SubcomponentSelector
        subcomponents={['sub1', 'sub2', 'sub3', 'sub4']}
        onSelectedSubcomponent={() => {}}
        selectedSubcomponent="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Subcomponent')).not.toBeInTheDocument();
    });
  });

  it('should return null if onSelectedSubcomponent callback is undefined', async () => {
    await renderInTestApp(
      <SubcomponentSelector
        subcomponents={['sub1', 'sub2', 'sub3', 'sub4']}
        onSelectedSubcomponent={undefined}
        selectedSubcomponent="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('sub2')).not.toBeInTheDocument();
    });
  });

  it('should always render All option', async () => {
    await renderInTestApp(
      <SubcomponentSelector
        subcomponents={['sub1', 'sub2', 'sub3', 'sub4']}
        onSelectedSubcomponent={() => {}}
        selectedSubcomponent="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });
  });

  it('should render subcomponent options', async () => {
    await renderInTestApp(
      <SubcomponentSelector
        subcomponents={['sub1', 'sub2', 'sub3', 'sub4']}
        onSelectedSubcomponent={() => {}}
        selectedSubcomponent="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('sub1')).toBeInTheDocument();
      expect(screen.getByText('sub4')).toBeInTheDocument();
    });
  });

  it('FormSelect should be disabled when isFetching is true', async () => {
    await renderInTestApp(
      <SubcomponentSelector
        subcomponents={['sub1', 'sub2', 'sub3', 'sub4']}
        onSelectedSubcomponent={() => {}}
        selectedSubcomponent="All"
        isFetching
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('subcomponent-selector');
    expect(selector).toBeDisabled();
  });

  it('FormSelect should not be disabled when isFetching is false', async () => {
    await renderInTestApp(
      <SubcomponentSelector
        subcomponents={['sub1', 'sub2', 'sub3', 'sub4']}
        onSelectedSubcomponent={() => {}}
        selectedSubcomponent="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('subcomponent-selector');
    expect(selector).not.toBeDisabled();
  });

  it('should set the correct selectedSubcomponent value', async () => {
    await renderInTestApp(
      <SubcomponentSelector
        subcomponents={['sub1', 'sub2', 'sub3', 'sub4']}
        onSelectedSubcomponent={() => {}}
        selectedSubcomponent="sub2"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId(
      'subcomponent-selector',
    ) as HTMLSelectElement;
    expect(selector.value).toBe('sub2');
  });

  it('should call onSelectedSubcomponent when an option is selected', async () => {
    const mockOnSelectedSubcomponent = jest.fn();
    const user = userEvent.setup();

    await renderInTestApp(
      <SubcomponentSelector
        subcomponents={['sub1', 'sub2', 'sub3', 'sub4']}
        onSelectedSubcomponent={mockOnSelectedSubcomponent}
        selectedSubcomponent="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('subcomponent-selector');
    await user.selectOptions(selector, 'sub3');

    expect(mockOnSelectedSubcomponent).toHaveBeenCalledWith('sub3');
  });

  it('should return null if subcomponents is undefined', async () => {
    await renderInTestApp(
      <SubcomponentSelector
        subcomponents={undefined}
        onSelectedSubcomponent={() => {}}
        selectedSubcomponent="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Subcomponent')).not.toBeInTheDocument();
    });
  });
});
