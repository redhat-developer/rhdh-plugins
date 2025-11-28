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
import { PipelineRunTypeSelector } from '../PipelineRunTypeSelector';
import { waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('PipelineRunTypeSelector', () => {
  it('should return null if pipelineRunTypes array is empty', async () => {
    await renderInTestApp(
      <PipelineRunTypeSelector
        pipelineRunTypes={[]}
        onSelectedPipelineRunType={() => {}}
        selectedPipelineRunType="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Type')).not.toBeInTheDocument();
    });
  });

  it('should return null if onSelectedPipelineRunType callback is undefined', async () => {
    await renderInTestApp(
      <PipelineRunTypeSelector
        pipelineRunTypes={['build', 'test']}
        onSelectedPipelineRunType={undefined}
        selectedPipelineRunType="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('build')).not.toBeInTheDocument();
    });
  });

  it('should always render All option', async () => {
    await renderInTestApp(
      <PipelineRunTypeSelector
        pipelineRunTypes={['build', 'test']}
        onSelectedPipelineRunType={() => {}}
        selectedPipelineRunType="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });
  });

  it('should render pipeline run type options', async () => {
    await renderInTestApp(
      <PipelineRunTypeSelector
        pipelineRunTypes={['build', 'test']}
        onSelectedPipelineRunType={() => {}}
        selectedPipelineRunType="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('build')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });

  it('FormSelect should be disabled when isFetching is true', async () => {
    await renderInTestApp(
      <PipelineRunTypeSelector
        pipelineRunTypes={['build', 'test']}
        onSelectedPipelineRunType={() => {}}
        selectedPipelineRunType="All"
        isFetching
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('type-selector');
    expect(selector).toBeDisabled();
  });

  it('FormSelect should not be disabled when isFetching is false', async () => {
    await renderInTestApp(
      <PipelineRunTypeSelector
        pipelineRunTypes={['build', 'test']}
        onSelectedPipelineRunType={() => {}}
        selectedPipelineRunType="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('type-selector');
    expect(selector).not.toBeDisabled();
  });

  it('should set the correct selectedPipelineRunType value', async () => {
    await renderInTestApp(
      <PipelineRunTypeSelector
        pipelineRunTypes={['build', 'test']}
        onSelectedPipelineRunType={() => {}}
        selectedPipelineRunType="build"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('type-selector') as HTMLSelectElement;
    expect(selector.value).toBe('build');
  });

  it('should call onSelectedPipelineRunType when an option is selected', async () => {
    const mockOnSelectedPipelineRunType = jest.fn();
    const user = userEvent.setup();

    await renderInTestApp(
      <PipelineRunTypeSelector
        pipelineRunTypes={['build', 'test']}
        onSelectedPipelineRunType={mockOnSelectedPipelineRunType}
        selectedPipelineRunType="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('type-selector');
    await user.selectOptions(selector, 'test');

    expect(mockOnSelectedPipelineRunType).toHaveBeenCalledWith('test');
  });

  it('should return null if pipelineRunTypes is undefined', async () => {
    await renderInTestApp(
      <PipelineRunTypeSelector
        pipelineRunTypes={undefined}
        onSelectedPipelineRunType={() => {}}
        selectedPipelineRunType="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Type')).not.toBeInTheDocument();
    });
  });
});
