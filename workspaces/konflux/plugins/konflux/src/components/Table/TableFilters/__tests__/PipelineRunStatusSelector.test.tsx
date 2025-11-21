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
import { PipelineRunStatusSelector } from '../PipelineRunStatusSelector';
import { waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('PipelineRunStatusSelector', () => {
  it('should return null if pipelineRunStatuses array is empty', async () => {
    await renderInTestApp(
      <PipelineRunStatusSelector
        pipelineRunStatuses={[]}
        onSelectedPipelineRunStatus={() => {}}
        selectedPipelineRunStatus="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Status')).not.toBeInTheDocument();
    });
  });

  it('should return null if onSelectedPipelineRunStatus callback is undefined', async () => {
    await renderInTestApp(
      <PipelineRunStatusSelector
        pipelineRunStatuses={['Cancelled', 'Failed', 'Success']}
        onSelectedPipelineRunStatus={undefined}
        selectedPipelineRunStatus="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Cancelled')).not.toBeInTheDocument();
    });
  });

  it('should always render All option', async () => {
    await renderInTestApp(
      <PipelineRunStatusSelector
        pipelineRunStatuses={['Cancelled', 'Failed', 'Success']}
        onSelectedPipelineRunStatus={() => {}}
        selectedPipelineRunStatus="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });
  });

  it('should render pipeline run status options', async () => {
    await renderInTestApp(
      <PipelineRunStatusSelector
        pipelineRunStatuses={['Cancelled', 'Failed', 'Success']}
        onSelectedPipelineRunStatus={() => {}}
        selectedPipelineRunStatus="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  it('FormSelect should be disabled when isFetching is true', async () => {
    await renderInTestApp(
      <PipelineRunStatusSelector
        pipelineRunStatuses={['Cancelled', 'Failed', 'Success']}
        onSelectedPipelineRunStatus={() => {}}
        selectedPipelineRunStatus="All"
        isFetching
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('status-selector');
    expect(selector).toBeDisabled();
  });

  it('FormSelect should not be disabled when isFetching is false', async () => {
    await renderInTestApp(
      <PipelineRunStatusSelector
        pipelineRunStatuses={['Cancelled', 'Failed', 'Success']}
        onSelectedPipelineRunStatus={() => {}}
        selectedPipelineRunStatus="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('status-selector');
    expect(selector).not.toBeDisabled();
  });

  it('should set the correct selectedPipelineRunStatus value', async () => {
    await renderInTestApp(
      <PipelineRunStatusSelector
        pipelineRunStatuses={['Cancelled', 'Failed', 'Success']}
        onSelectedPipelineRunStatus={() => {}}
        selectedPipelineRunStatus="Success"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('status-selector') as HTMLSelectElement;
    expect(selector.value).toBe('Success');
  });

  it('should call onSelectedPipelineRunStatus when an option is selected', async () => {
    const mockOnSelectedPipelineRunStatus = jest.fn();
    const user = userEvent.setup();

    await renderInTestApp(
      <PipelineRunStatusSelector
        pipelineRunStatuses={['Cancelled', 'Failed', 'Success']}
        onSelectedPipelineRunStatus={mockOnSelectedPipelineRunStatus}
        selectedPipelineRunStatus="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('status-selector');
    await user.selectOptions(selector, 'Failed');

    expect(mockOnSelectedPipelineRunStatus).toHaveBeenCalledWith('Failed');
  });

  it('should return null if pipelineRunStatuses is undefined', async () => {
    await renderInTestApp(
      <PipelineRunStatusSelector
        pipelineRunStatuses={undefined}
        onSelectedPipelineRunStatus={() => {}}
        selectedPipelineRunStatus="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Status')).not.toBeInTheDocument();
    });
  });
});
