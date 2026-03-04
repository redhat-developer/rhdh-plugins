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
import { ThresholdResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { useTheme } from '@mui/material/styles';
import CustomLegend from '../CustomLegend';

jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useTheme: jest.fn(),
}));

const useThemeMock = jest.mocked(useTheme);

const mockTheme = {
  palette: {
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    error: {
      main: '#d32f2f',
    },
  },
};

describe('CustomLegend', () => {
  beforeEach(() => {
    useThemeMock.mockReturnValue(mockTheme);
  });

  const thresholds: ThresholdResult = {
    definition: {
      rules: [
        { key: 'custom', expression: '<=10', color: '#add8e6' },
        { key: 'success', expression: '<=20' },
        { key: 'warning', expression: '<=40' },
        { key: 'error', expression: '>40' },
      ],
    },
    status: 'success',
    evaluation: 'custom',
  };

  it('should render threshold labels and expressions', () => {
    render(<CustomLegend thresholds={thresholds} />);

    expect(screen.getByText(/Custom/)).toBeInTheDocument();
    expect(screen.getByText(/<=10/)).toBeInTheDocument();

    expect(screen.getByText(/Success/)).toBeInTheDocument();
    expect(screen.getByText(/<=20/)).toBeInTheDocument();

    expect(screen.getByText(/Warning/)).toBeInTheDocument();
    expect(screen.getByText(/<=40/)).toBeInTheDocument();

    expect(screen.getByText(/Error/)).toBeInTheDocument();
    expect(screen.getByText(/>40/)).toBeInTheDocument();
  });

  it('should render color boxes', () => {
    const { container } = render(<CustomLegend thresholds={thresholds} />);

    const colorBoxes = container.querySelectorAll(
      '[data-testid^="legend-colorbox-"]',
    );
    expect(colorBoxes).toHaveLength(4);

    expect(screen.getByTestId('legend-colorbox-custom')).toHaveStyle(
      'background-color: #add8e6',
    );
    expect(screen.getByTestId('legend-colorbox-success')).toHaveStyle(
      'background-color: #2e7d32',
    );
    expect(screen.getByTestId('legend-colorbox-warning')).toHaveStyle(
      'background-color: #ed6c02',
    );
    expect(screen.getByTestId('legend-colorbox-error')).toHaveStyle(
      'background-color: #d32f2f',
    );
  });
});
