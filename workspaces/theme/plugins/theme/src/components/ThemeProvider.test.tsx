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
import { useApi } from '@backstage/core-plugin-api';
import { themes } from '@backstage/theme';
import { createSharedThemeProvider } from './ThemeProvider';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

jest.mock('@backstage/theme', () => ({
  ...jest.requireActual('@backstage/theme'),
  UnifiedThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  StyledEngineProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock('../hooks/useThemeConfig', () => ({
  useThemeConfig: (name: string) => ({
    mode: name.includes('dark') ? 'dark' : 'light',
  }),
}));

jest.mock('../hooks/useTheme', () => ({
  useTheme: () => themes.light,
}));

const mockAppThemeApi = (activeThemeId?: string) => {
  (useApi as jest.Mock).mockReturnValue({
    getActiveThemeId: () => activeThemeId,
  });
};

describe('createSharedThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the same Provider function reference for all entries', () => {
    const provider = createSharedThemeProvider({
      light: { name: 'light' },
      dark: { name: 'dark' },
      'backstage-light': { theme: themes.light },
    });

    // The return value is a single function, not one per entry
    expect(typeof provider).toBe('function');
    expect(provider.name).toBe('RHDHSharedThemeProvider');
  });

  it('renders children when a matching theme ID is active', () => {
    mockAppThemeApi('dark');
    const Provider = createSharedThemeProvider({
      light: { name: 'light' },
      dark: { name: 'dark' },
    });

    render(
      <Provider>
        <span>Hello</span>
      </Provider>,
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('falls back to light theme when no explicit theme is selected and system prefers light', () => {
    mockAppThemeApi(undefined);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockReturnValue({ matches: false }),
    });

    const Provider = createSharedThemeProvider({
      light: { name: 'light' },
      dark: { name: 'dark' },
    });

    render(
      <Provider>
        <span>Light fallback</span>
      </Provider>,
    );

    expect(screen.getByText('Light fallback')).toBeInTheDocument();
  });

  it('handles pre-built theme entries', () => {
    mockAppThemeApi('backstage-light');
    const Provider = createSharedThemeProvider({
      'backstage-light': { theme: themes.light },
      'backstage-dark': { theme: themes.dark },
    });

    render(
      <Provider>
        <span>Backstage theme</span>
      </Provider>,
    );

    expect(screen.getByText('Backstage theme')).toBeInTheDocument();
  });

  it('renders when appThemeApi is unavailable', () => {
    (useApi as jest.Mock).mockImplementation(() => {
      throw new Error('No API context');
    });

    const Provider = createSharedThemeProvider({
      light: { name: 'light' },
      dark: { name: 'dark' },
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockReturnValue({ matches: false }),
    });

    render(
      <Provider>
        <span>No API</span>
      </Provider>,
    );

    expect(screen.getByText('No API')).toBeInTheDocument();
  });
});
