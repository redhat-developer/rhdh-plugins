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
import React from 'react';
import { SandboxHeader } from '../SandboxHeader';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { wrapInTestApp } from '@backstage/test-utils';

describe('SandboxHeader', () => {
  const renderComponent = (pageTitle = 'My Page Title') => {
    const theme = createTheme();
    return render(
      wrapInTestApp(
        <ThemeProvider theme={theme}>
          <SandboxHeader pageTitle={pageTitle} />
        </ThemeProvider>,
      ),
    );
  };

  test('renders the header with the correct title', () => {
    renderComponent();
    expect(screen.getByText('My Page Title')).toBeInTheDocument();
  });

  test('renders the subtitle with Red Hat Developer Hub text', () => {
    renderComponent();
    expect(screen.getByText(/powered by/i)).toBeInTheDocument();
    expect(screen.getByText(/Red Hat Developer Hub/i)).toBeInTheDocument();
  });

  test('renders the Red Hat Developer Hub link with correct URL', () => {
    renderComponent();
    const link = screen.getByText('Red Hat Developer Hub');
    expect(link.closest('a')).toHaveAttribute(
      'href',
      'https://developers.redhat.com/rhdh/overview',
    );
  });

  test('renders the Contact Red Hat Sales button', () => {
    renderComponent();
    const button = screen.getByText('Contact Red Hat Sales');
    expect(button).toBeInTheDocument();
    expect(button.closest('a')).toHaveAttribute(
      'href',
      'https://www.redhat.com/en/contact',
    );
    expect(button.closest('a')).toHaveAttribute('target', '_blank');
  });

  test('renders icons in the component', () => {
    renderComponent();
    // Check for SupportAgentIcon and OpenInNewIcon
    // Since icons don't have text, we need to check for their presence indirectly
    const contactButton = screen.getByText('Contact Red Hat Sales');
    expect(
      contactButton.parentElement?.querySelector('svg'),
    ).toBeInTheDocument();

    // Check for OpenInNewIcon near the Red Hat Developer Hub text
    const subtitle = screen.getByText(/powered by/i).parentElement;
    expect(subtitle?.querySelector('svg')).toBeInTheDocument();
  });
});
