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

import PermissionRequiredState from '../PermissionRequiredState';

// Mock the SVG import
jest.mock(
  '../../../images/permission-required.svg',
  () => 'mocked-permission-required.svg',
);

// Mock the EmptyState component from Backstage
jest.mock('@backstage/core-components', () => ({
  EmptyState: function MockEmptyState(props: any) {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'empty-state' }, [
      React.createElement(
        'div',
        { 'data-testid': 'empty-state-title', key: 'title' },
        props.title,
      ),
      React.createElement(
        'div',
        { 'data-testid': 'empty-state-description', key: 'description' },
        props.description,
      ),
      React.createElement(
        'div',
        { 'data-testid': 'empty-state-missing', key: 'missing' },
        props.missing && props.missing.customImage,
      ),
      React.createElement(
        'div',
        { 'data-testid': 'empty-state-action', key: 'action' },
        props.action,
      ),
    ]);
  },
}));

// Mock the OpenInNew icon
jest.mock('@mui/icons-material/OpenInNew', () => {
  return function MockOpenInNewIcon() {
    const React = require('react');
    return React.createElement(
      'span',
      { 'data-testid': 'OpenInNewIcon' },
      'OpenInNew',
    );
  };
});

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

describe('PermissionRequiredState Component', () => {
  it('should render the main title', () => {
    renderWithProviders(<PermissionRequiredState />);

    expect(screen.getByText('Missing permission')).toBeInTheDocument();
  });

  it('should render the description text with permission name', () => {
    renderWithProviders(<PermissionRequiredState />);

    expect(
      screen.getByText(
        /To view Scorecard plugin, contact your administrator to give the/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/permission\./)).toBeInTheDocument();
  });

  it('should render the read more link button with correct text', () => {
    renderWithProviders(<PermissionRequiredState />);

    const linkButton = screen.getByRole('link', { name: /read more/i });
    expect(linkButton).toBeInTheDocument();
  });

  it('should render the OpenInNew icon in the link button', () => {
    renderWithProviders(<PermissionRequiredState />);

    const linkButton = screen.getByRole('link', { name: /read more/i });
    expect(linkButton).toBeInTheDocument();

    const icon = linkButton.querySelector('[data-testid="OpenInNewIcon"]');
    expect(icon).toBeInTheDocument();
  });

  it('should have correct href for the read more button', () => {
    renderWithProviders(<PermissionRequiredState />);

    const linkButton = screen.getByRole('link', { name: /read more/i });
    expect(linkButton).toHaveAttribute(
      'href',
      'https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/scorecard/plugins/scorecard/README.md#permission-framework-support',
    );
    expect(linkButton).toHaveAttribute('target', '_blank');
  });
});
