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
import { render, screen, cleanup } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  MockTrans,
  mockUseTranslation,
} from '../../../test-utils/mockTranslations';
import { useUsers } from '../../../hooks/useUsers';
import Users from '../Users';

// Mock translation hooks
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../Trans', () => ({
  Trans: MockTrans,
})); // Adjust path as needed

jest.mock('../../../hooks/useUsers', () => ({
  useUsers: jest.fn(),
}));

jest.mock('../../CardWrapper', () => ({ title, children }: any) => (
  <div data-testid="card-wrapper">
    <h1>{title}</h1>
    {children}
  </div>
));

const theme = createTheme();

describe('Users Component', () => {
  beforeAll(() => {
    global.ResizeObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('should display "No results for this date range." when users data is empty', () => {
    (useUsers as jest.Mock).mockReturnValue({
      users: { data: [] },
      loading: false,
    });

    render(
      <ThemeProvider theme={theme}>
        <Users />
      </ThemeProvider>,
    );

    expect(
      screen.getByText('No results for this date range.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('card-wrapper')).toBeInTheDocument();
  });

  it('should calculate and display the correct logged-in percentage', () => {
    (useUsers as jest.Mock).mockReturnValue({
      users: { data: [{ logged_in_users: 25, licensed_users: 100 }] },
      loading: false,
    });

    render(
      <ThemeProvider theme={theme}>
        <Users />
      </ThemeProvider>,
    );

    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('have logged in')).toBeInTheDocument();
  });

  it('should display "0%" when no users have logged in', () => {
    (useUsers as jest.Mock).mockReturnValue({
      users: { data: [{ logged_in_users: 0, licensed_users: 100 }] },
      loading: false,
    });

    render(
      <ThemeProvider theme={theme}>
        <Users />
      </ThemeProvider>,
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('have logged in')).toBeInTheDocument();
  });

  it('should handle missing or zero licensed users gracefully', () => {
    (useUsers as jest.Mock).mockReturnValue({
      users: { data: [{ logged_in_users: 10, licensed_users: 0 }] },
      loading: false,
    });

    render(
      <ThemeProvider theme={theme}>
        <Users />
      </ThemeProvider>,
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
