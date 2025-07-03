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
import { QuickstartFooter } from './QuickstartFooter';

describe('QuickstartFooter', () => {
  const mockClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Not started" when progress is 0', () => {
    render(<QuickstartFooter handleDrawerClose={mockClose} progress={0} />);
    expect(screen.getByText('Not started')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });

  it('renders progress text when progress is greater than 0', () => {
    render(<QuickstartFooter handleDrawerClose={mockClose} progress={75} />);
    expect(screen.getByText('75% progress')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '75',
    );
  });

  it('calls handleDrawerClose when Hide button is clicked', () => {
    render(<QuickstartFooter handleDrawerClose={mockClose} progress={50} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
