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
import { NameSearch } from '../NameSearch';
import { waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('NameSearch', () => {
  it('should render search input with placeholder', async () => {
    await renderInTestApp(
      <NameSearch
        nameSearch=""
        onNameSearch={() => {}}
        isFetching={false}
        placeholder="Search by name"
      />,
    );

    await waitFor(() => {
      const input = screen.getByPlaceholderText('Search by name');
      expect(input).toBeInTheDocument();
    });
  });

  it('should set the value from nameSearch prop', async () => {
    await renderInTestApp(
      <NameSearch
        nameSearch="test-search"
        onNameSearch={() => {}}
        isFetching={false}
        placeholder="Search by name"
      />,
    );

    await waitFor(() => {
      const input = screen.getByPlaceholderText(
        'Search by name',
      ) as HTMLInputElement;
      expect(input.value).toBe('test-search');
    });
  });

  it('should handle undefined nameSearch prop', async () => {
    await renderInTestApp(
      <NameSearch
        nameSearch={undefined}
        onNameSearch={() => {}}
        isFetching={false}
        placeholder="Search by name"
      />,
    );

    await waitFor(() => {
      const input = screen.getByPlaceholderText(
        'Search by name',
      ) as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  it('should call onNameSearch when user types', async () => {
    jest.useFakeTimers();
    const mockOnNameSearch = jest.fn();
    const user = userEvent.setup({ delay: null });

    await renderInTestApp(
      <NameSearch
        nameSearch=""
        onNameSearch={mockOnNameSearch}
        isFetching={false}
        placeholder="Search by name"
      />,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by name')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Search by name');
    await user.type(input, 'test');

    // Before debounce delay, callback should not be called
    expect(mockOnNameSearch).not.toHaveBeenCalled();

    // Fast-forward time to trigger debounced callback
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockOnNameSearch).toHaveBeenCalledTimes(1);
      expect(mockOnNameSearch).toHaveBeenCalledWith('test');
    });

    jest.useRealTimers();
  });

  it('should be disabled when isFetching is true', async () => {
    await renderInTestApp(
      <NameSearch
        nameSearch=""
        onNameSearch={() => {}}
        isFetching
        placeholder="Search by name"
      />,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by name')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Search by name');
    expect(input).toBeDisabled();
  });

  it('should not be disabled when isFetching is false', async () => {
    await renderInTestApp(
      <NameSearch
        nameSearch=""
        onNameSearch={() => {}}
        isFetching={false}
        placeholder="Search by name"
      />,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by name')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Search by name');
    expect(input).not.toBeDisabled();
  });

  it('should initialize with nameSearch prop value', async () => {
    await renderInTestApp(
      <NameSearch
        nameSearch="initial"
        onNameSearch={() => {}}
        isFetching={false}
        placeholder="Search by name"
      />,
    );

    await waitFor(() => {
      const input = screen.getByPlaceholderText(
        'Search by name',
      ) as HTMLInputElement;
      expect(input.value).toBe('initial');
    });
  });
});
