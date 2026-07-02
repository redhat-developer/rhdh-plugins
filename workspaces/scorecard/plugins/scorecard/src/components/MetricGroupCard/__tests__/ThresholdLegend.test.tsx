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

import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { ThresholdLegend } from '../ThresholdLegend';
import type { ThresholdBucket } from '../types';

jest.mock('../../../utils', () => ({
  resolveStatusColor: () => '#2e7d32',
}));

jest.mock('@backstage/ui', () => ({
  Text: ({ children, ...props }: React.PropsWithChildren<{}>) => (
    <span {...props}>{children}</span>
  ),
}));

const theme = createTheme();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const mockBuckets: ThresholdBucket[] = [
  { key: 'pass', label: 'Pass', expression: '>= 80', count: 5, color: 'green' },
  {
    key: 'warn',
    label: 'Warning',
    expression: '>= 50',
    count: 3,
    color: 'orange',
  },
  { key: 'fail', label: 'Fail', expression: '< 50', count: 2, color: 'red' },
];

describe('ThresholdLegend', () => {
  it('should return null when buckets is empty', () => {
    const { container } = renderWithTheme(
      <ThresholdLegend
        buckets={[]}
        activeFilters={new Set()}
        onToggleFilter={jest.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render all bucket pills with label and expression', () => {
    renderWithTheme(
      <ThresholdLegend
        buckets={mockBuckets}
        activeFilters={new Set()}
        onToggleFilter={jest.fn()}
      />,
    );

    expect(screen.getByText('Pass >= 80')).toBeInTheDocument();
    expect(screen.getByText('Warning >= 50')).toBeInTheDocument();
    expect(screen.getByText('Fail < 50')).toBeInTheDocument();
  });

  it('should have role="button" and tabIndex=0 on each pill', () => {
    renderWithTheme(
      <ThresholdLegend
        buckets={mockBuckets}
        activeFilters={new Set()}
        onToggleFilter={jest.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    buttons.forEach(button => {
      expect(button).toHaveAttribute('tabindex', '0');
    });
  });

  it('should call onToggleFilter with the bucket key on click', () => {
    const onToggleFilter = jest.fn();
    renderWithTheme(
      <ThresholdLegend
        buckets={mockBuckets}
        activeFilters={new Set()}
        onToggleFilter={onToggleFilter}
      />,
    );

    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onToggleFilter).toHaveBeenCalledWith('pass');

    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(onToggleFilter).toHaveBeenCalledWith('fail');
  });

  it('should call onToggleFilter on Enter key press', () => {
    const onToggleFilter = jest.fn();
    renderWithTheme(
      <ThresholdLegend
        buckets={mockBuckets}
        activeFilters={new Set()}
        onToggleFilter={onToggleFilter}
      />,
    );

    fireEvent.keyDown(screen.getAllByRole('button')[1], { key: 'Enter' });
    expect(onToggleFilter).toHaveBeenCalledWith('warn');
  });

  it('should call onToggleFilter on Space key press', () => {
    const onToggleFilter = jest.fn();
    renderWithTheme(
      <ThresholdLegend
        buckets={mockBuckets}
        activeFilters={new Set()}
        onToggleFilter={onToggleFilter}
      />,
    );

    fireEvent.keyDown(screen.getAllByRole('button')[0], { key: ' ' });
    expect(onToggleFilter).toHaveBeenCalledWith('pass');
  });

  it('should set aria-pressed="true" for active filters', () => {
    renderWithTheme(
      <ThresholdLegend
        buckets={mockBuckets}
        activeFilters={new Set(['pass', 'fail'])}
        onToggleFilter={jest.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'true');
  });

  it('should set aria-pressed="false" for inactive filters', () => {
    renderWithTheme(
      <ThresholdLegend
        buckets={mockBuckets}
        activeFilters={new Set(['pass'])}
        onToggleFilter={jest.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'false');
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'false');
  });
});
