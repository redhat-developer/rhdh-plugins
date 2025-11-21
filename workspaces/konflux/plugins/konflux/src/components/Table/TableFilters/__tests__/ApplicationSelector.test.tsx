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
import { ApplicationSelector } from '../ApplicationSelector';
import { waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ApplicationSelector', () => {
  it('should return null if applications array is empty', async () => {
    await renderInTestApp(
      <ApplicationSelector
        applications={[]}
        onSelectedApplication={() => {}}
        selectedApplication="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Application')).not.toBeInTheDocument();
    });
  });

  it('should return null if onSelectedApplication callback is undefined', async () => {
    await renderInTestApp(
      <ApplicationSelector
        applications={['app1', 'app2', 'app3']}
        onSelectedApplication={undefined}
        selectedApplication="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('app1')).not.toBeInTheDocument();
    });
  });

  it('should always render All option', async () => {
    await renderInTestApp(
      <ApplicationSelector
        applications={['app1', 'app2', 'app3']}
        onSelectedApplication={() => {}}
        selectedApplication="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });
  });

  it('should render applications options', async () => {
    await renderInTestApp(
      <ApplicationSelector
        applications={['app1', 'app2', 'app3']}
        onSelectedApplication={() => {}}
        selectedApplication="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('app1')).toBeInTheDocument();
      expect(screen.getByText('app2')).toBeInTheDocument();
      expect(screen.getByText('app3')).toBeInTheDocument();
    });
  });

  it('FormSelect should be disabled when isFetching is true', async () => {
    await renderInTestApp(
      <ApplicationSelector
        applications={['app1', 'app2', 'app3']}
        onSelectedApplication={() => {}}
        selectedApplication="All"
        isFetching
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('application-selector');
    expect(selector).toBeDisabled();
  });

  it('FormSelect should not be disabled when isFetching is false', async () => {
    await renderInTestApp(
      <ApplicationSelector
        applications={['app1', 'app2', 'app3']}
        onSelectedApplication={() => {}}
        selectedApplication="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('application-selector');
    expect(selector).not.toBeDisabled();
  });

  it('should set the correct selectedApplication value', async () => {
    await renderInTestApp(
      <ApplicationSelector
        applications={['app1', 'app2', 'app3']}
        onSelectedApplication={() => {}}
        selectedApplication="app2"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId(
      'application-selector',
    ) as HTMLSelectElement;
    expect(selector.value).toBe('app2');
  });

  it('should call onSelectedApplication when an option is selected', async () => {
    const mockOnSelectedApplication = jest.fn();
    const user = userEvent.setup();

    await renderInTestApp(
      <ApplicationSelector
        applications={['app1', 'app2', 'app3']}
        onSelectedApplication={mockOnSelectedApplication}
        selectedApplication="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('application-selector');
    await user.selectOptions(selector, 'app1');

    expect(mockOnSelectedApplication).toHaveBeenCalledWith('app1');
  });

  it('should return null if applications is undefined', async () => {
    await renderInTestApp(
      <ApplicationSelector
        applications={undefined}
        onSelectedApplication={() => {}}
        selectedApplication="All"
        isFetching={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Application')).not.toBeInTheDocument();
    });
  });
});
