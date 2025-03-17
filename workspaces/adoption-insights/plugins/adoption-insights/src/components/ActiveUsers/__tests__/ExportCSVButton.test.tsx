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
import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useApi } from '@backstage/core-plugin-api';
import { useDateRange } from '../../Header/DateRangeContext';
import ExportCSVButton from '../ExportCSVButton';

jest.mock('@backstage/core-plugin-api', () => ({
  useApi: jest.fn(),
  createApiRef: jest.fn(() => ({})),
}));
jest.mock('../../Header/DateRangeContext', () => ({
  useDateRange: jest.fn(),
}));

describe('ExportCSVButton', () => {
  const mockDownloadBlob = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useApi as jest.Mock).mockReturnValue({ downloadBlob: mockDownloadBlob });
    (useDateRange as jest.Mock).mockReturnValue({
      startDateRange: new Date(2025, 0, 1),
      endDateRange: new Date(2025, 0, 31),
    });
  });

  it('should render the Export CSV button', () => {
    render(<ExportCSVButton />);

    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('should call downloadBlob with correct parameters on click', async () => {
    render(<ExportCSVButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockDownloadBlob).toHaveBeenCalledWith({
        type: 'active_users',
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        format: 'csv',
      });
    });
  });

  it('should shows "Downloading..." text while downloading', async () => {
    render(<ExportCSVButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() =>
      expect(screen.getByText('Downloading...')).toBeInTheDocument(),
    );
  });

  it('should restore button text after API call completes', async () => {
    render(<ExportCSVButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => expect(mockDownloadBlob).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByText('Export CSV')).toBeInTheDocument(),
    );
  });
});
