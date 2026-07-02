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

import { ThresholdBucketTile } from '../ThresholdBucketTile';

jest.mock('../../../utils', () => ({
  resolveStatusColor: () => '#2e7d32',
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

const baseBucket = {
  key: 'passing',
  label: 'Passing',
  expression: '>= 80',
  count: 42,
  color: 'success',
};

describe('ThresholdBucketTile', () => {
  it('should render bucket count and label', () => {
    render(<ThresholdBucketTile bucket={baseBucket} />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Passing')).toBeInTheDocument();
  });

  it('should have role="button" and tabIndex=0 when onClick is provided', () => {
    const onClick = jest.fn();
    const { container } = render(
      <ThresholdBucketTile bucket={baseBucket} onClick={onClick} />,
      { wrapper: TestWrapper },
    );
    const tile = container.firstChild as HTMLElement;
    expect(tile).toHaveAttribute('role', 'button');
    expect(tile).toHaveAttribute('tabindex', '0');
  });

  it('should not have role="button" when onClick is undefined', () => {
    const { container } = render(<ThresholdBucketTile bucket={baseBucket} />, {
      wrapper: TestWrapper,
    });
    const tile = container.firstChild as HTMLElement;
    expect(tile).not.toHaveAttribute('role');
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    const { container } = render(
      <ThresholdBucketTile bucket={baseBucket} onClick={onClick} />,
      { wrapper: TestWrapper },
    );
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should call onClick on Enter key', () => {
    const onClick = jest.fn();
    const { container } = render(
      <ThresholdBucketTile bucket={baseBucket} onClick={onClick} />,
      { wrapper: TestWrapper },
    );
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should call onClick on Space key', () => {
    const onClick = jest.fn();
    const { container } = render(
      <ThresholdBucketTile bucket={baseBucket} onClick={onClick} />,
      { wrapper: TestWrapper },
    );
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should have aria-label with count and label when interactive', () => {
    const onClick = jest.fn();
    const { container } = render(
      <ThresholdBucketTile bucket={baseBucket} onClick={onClick} />,
      { wrapper: TestWrapper },
    );
    const tile = container.firstChild as HTMLElement;
    expect(tile).toHaveAttribute('aria-label', '42 Passing');
  });
});
