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

import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import Tooltip from '../Tooltip';

describe('Tooltip Component', () => {
  const theme = createTheme();

  it('should not render when active is false', () => {
    render(
      <ThemeProvider theme={theme}>
        <Tooltip active={false} payload={[]} licensed_users={100} />
      </ThemeProvider>,
    );

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('should not render when payload is empty', () => {
    render(
      <ThemeProvider theme={theme}>
        <Tooltip active payload={[]} licensed_users={100} />
      </ThemeProvider>,
    );

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('should display value and percentage when active and payload are provided', () => {
    const mockPayload = [{ value: 50, name: 'Active' }];
    const licensed_users = 100;
    const logged_in_users = 25;

    render(
      <ThemeProvider theme={theme}>
        <Tooltip
          active
          payload={mockPayload}
          licensed_users={licensed_users}
          logged_in_users={logged_in_users}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should correctly round percentages', () => {
    const mockPayload = [{ value: 33, name: 'Active' }];
    const licensed_users = 100;

    render(
      <ThemeProvider theme={theme}>
        <Tooltip active payload={mockPayload} licensed_users={licensed_users} />
      </ThemeProvider>,
    );

    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('should handle large numbers and display commas', () => {
    const mockPayload = [{ value: 1000, name: 'Active' }];
    const licensed_users = 5000;

    render(
      <ThemeProvider theme={theme}>
        <Tooltip active payload={mockPayload} licensed_users={licensed_users} />
      </ThemeProvider>,
    );

    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('should correctly calculate percentage when name is "Licensed"', () => {
    const mockPayload = [{ value: 500, name: 'Licensed' }];
    const licensed_users = 1000;
    const logged_in_users = 200;

    render(
      <ThemeProvider theme={theme}>
        <Tooltip
          active
          payload={mockPayload}
          licensed_users={licensed_users}
          logged_in_users={logged_in_users}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('300')).toBeInTheDocument(); // 500 - 200
    expect(screen.getByText('30%')).toBeInTheDocument(); // (300/1000) * 100
  });

  it('should return null if no valid payload exists', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Tooltip active payload={null as any} licensed_users={100} />
      </ThemeProvider>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('should handle 0 values correctly', () => {
    const mockPayload = [{ value: 0, name: 'Active' }];
    const licensed_users = 100;

    render(
      <ThemeProvider theme={theme}>
        <Tooltip active payload={mockPayload} licensed_users={licensed_users} />
      </ThemeProvider>,
    );

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
