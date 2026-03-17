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
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';

import NotFoundState from '../NotFoundState';

jest.mock('../../../images/not-found.svg', () => 'mocked-not-found.svg');

jest.mock('@backstage/core-plugin-api', () => ({
  useApi: jest.fn(),
  configApiRef: 'configApiRef',
}));

const mockUseApi = require('@backstage/core-plugin-api')
  .useApi as jest.MockedFunction<any>;

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = createTheme();
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </BrowserRouter>
  );
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper });
};

describe('NotFoundState Component', () => {
  beforeEach(() => {
    mockUseApi.mockImplementation((apiRef: string) => {
      if (apiRef === 'configApiRef') {
        return {
          getOptionalString: jest.fn().mockReturnValue(undefined),
        };
      }
      return {};
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the default title', () => {
    renderWithProviders(<NotFoundState />);

    expect(
      screen.getByText("404 We couldn't find that page"),
    ).toBeInTheDocument();
  });

  it('should render the default description with index.md hint', () => {
    renderWithProviders(<NotFoundState />);

    expect(
      screen.getByText(
        /Try adding an .* file in the root of the docs directory of this repository\./,
      ),
    ).toBeInTheDocument();
  });

  it('should render custom title and description when provided', () => {
    renderWithProviders(
      <NotFoundState
        title="Custom 404"
        description="Custom not found message."
      />,
    );

    expect(screen.getByText('Custom 404')).toBeInTheDocument();
    expect(screen.getByText('Custom not found message.')).toBeInTheDocument();
  });

  it('should render the not-found image with alt text', () => {
    renderWithProviders(<NotFoundState />);

    const image = screen.getByAltText('Page not found');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'mocked-not-found.svg');
  });

  it('should render Go back link by default', () => {
    renderWithProviders(<NotFoundState />);

    const goBackLink = screen.getByRole('link', { name: /go back/i });
    expect(goBackLink).toBeInTheDocument();
    expect(goBackLink).toHaveAttribute('href', '/');
  });

  it('should render Contact support link by default', () => {
    renderWithProviders(<NotFoundState />);

    expect(
      screen.getByRole('link', { name: /contact support/i }),
    ).toBeInTheDocument();
  });

  it('should render Read more link when readMoreHref is provided', () => {
    renderWithProviders(
      <NotFoundState readMoreHref="https://example.com/docs" />,
    );

    const readMoreLink = screen.getByRole('link', { name: /read more/i });
    expect(readMoreLink).toBeInTheDocument();
    expect(readMoreLink).toHaveAttribute('href', 'https://example.com/docs');
  });

  it('should hide Go back link when showGoBack is false', () => {
    renderWithProviders(<NotFoundState showGoBack={false} />);

    expect(
      screen.queryByRole('link', { name: /go back/i }),
    ).not.toBeInTheDocument();
  });

  it('should hide Contact support when showContactSupport is false', () => {
    renderWithProviders(<NotFoundState showContactSupport={false} />);

    expect(
      screen.queryByRole('link', { name: /contact support/i }),
    ).not.toBeInTheDocument();
  });
});
