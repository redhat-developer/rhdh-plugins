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
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { AdoptionInsightsPage } from '../AdoptionInsightsPage';

jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useTheme: jest.fn(),
}));

jest.mock('@mui/material/useMediaQuery', () => jest.fn());

jest.mock('../../Header', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-header">Header</div>,
}));

jest.mock('../../CatalogEntities', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-catalog-entities">CatalogEntities</div>,
}));

jest.mock('../../Templates', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-templates">Templates</div>,
}));

jest.mock('../../Techdocs', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-techdocs">Techdocs</div>,
}));

jest.mock('../../ActiveUsers', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-active-users">ActiveUsers</div>,
}));

jest.mock('../../Plugins', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-plugins">Plugins</div>,
}));

jest.mock('../../Searches', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-searches">Searches</div>,
}));

jest.mock('../../Users', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-users">Users</div>,
}));

jest.mock('@backstage/core-components', () => ({
  Content: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-content">{children}</div>
  ),
  Page: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-page">{children}</div>
  ),
}));

describe('AdoptionInsightsPage', () => {
  const mockTheme = {
    breakpoints: {
      down: jest.fn(),
    },
  };

  beforeEach(() => {
    (useTheme as jest.Mock).mockReturnValue(mockTheme);
  });

  it('should render all components in desktop layout', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(false);

    render(<AdoptionInsightsPage />);

    expect(screen.getByTestId('mock-page')).toBeInTheDocument();
    expect(screen.getByTestId('mock-content')).toBeInTheDocument();
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-active-users')).toBeInTheDocument();
    expect(screen.getByTestId('mock-users')).toBeInTheDocument();
    expect(screen.getByTestId('mock-templates')).toBeInTheDocument();
    expect(screen.getByTestId('mock-catalog-entities')).toBeInTheDocument();
    expect(screen.getByTestId('mock-plugins')).toBeInTheDocument();
    expect(screen.getByTestId('mock-techdocs')).toBeInTheDocument();
    expect(screen.getByTestId('mock-searches')).toBeInTheDocument();
  });

  it('should render all components in mobile layout', () => {
    (useMediaQuery as jest.Mock).mockReturnValue(true);

    render(<AdoptionInsightsPage />);

    expect(screen.getByTestId('mock-page')).toBeInTheDocument();
    expect(screen.getByTestId('mock-content')).toBeInTheDocument();
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-active-users')).toBeInTheDocument();
    expect(screen.getByTestId('mock-users')).toBeInTheDocument();
    expect(screen.getByTestId('mock-templates')).toBeInTheDocument();
    expect(screen.getByTestId('mock-catalog-entities')).toBeInTheDocument();
    expect(screen.getByTestId('mock-plugins')).toBeInTheDocument();
    expect(screen.getByTestId('mock-techdocs')).toBeInTheDocument();
    expect(screen.getByTestId('mock-searches')).toBeInTheDocument();
  });
});
