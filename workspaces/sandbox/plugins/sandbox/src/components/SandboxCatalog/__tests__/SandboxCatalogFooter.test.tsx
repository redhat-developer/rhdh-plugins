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
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';

import { SandboxCatalogFooter } from '../SandboxCatalogFooter';

// Mock AccessCodeInputModal
jest.mock('../../Modals/AccessCodeInputModal', () => ({
  AccessCodeInputModal: jest.fn(({ modalOpen }) =>
    modalOpen ? <div data-testid="mock-modal">Modal Content</div> : null,
  ),
}));

describe('SandboxCatalogFooter', () => {
  const theme = createTheme();

  beforeEach(() => {
    jest.clearAllMocks();
    // Clean up any existing elements from previous tests
    document.body.innerHTML = '';
  });

  const renderFooter = async () => {
    let result: any;
    await act(async () => {
      result = render(
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ThemeProvider theme={theme}>
            <SandboxCatalogFooter />
          </ThemeProvider>
        </BrowserRouter>,
      );
    });
    return result!; // Non-null assertion since we know it's assigned
  };

  it('renders footer with activation code section', async () => {
    await renderFooter();

    expect(screen.getByText('Have an activation code?')).toBeInTheDocument();
    expect(screen.getByText('Click here')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
  });

  it('opens modal when the link is clicked', async () => {
    await renderFooter();

    const link = screen.getByText('Click here');
    await act(async () => {
      fireEvent.click(link);
    });

    expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
  });

  it('renders footer with correct styling', async () => {
    await renderFooter();

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveStyle('padding: 16px'); // theme.spacing(2) is typically 16px

    // In light mode, should have white background
    expect(footer).toHaveStyle('background-color: #fff');
  });

  it('renders text with center alignment', async () => {
    await renderFooter();

    const typography = screen
      .getByText('Have an activation code?')
      .closest('p');
    expect(typography).toHaveStyle('text-align: center');
  });

  it('renders Red Hat footer components', async () => {
    await renderFooter();

    expect(screen.getByTestId('rh-footer-universal')).toBeInTheDocument();
    expect(screen.getByTestId('rh-footer-copyright')).toBeInTheDocument();
  });

  it('renders footer links', async () => {
    await renderFooter();

    expect(screen.getByText('About Red Hat')).toBeInTheDocument();
    expect(screen.getByText('Privacy statement')).toBeInTheDocument();
    expect(screen.getByText('Terms of use')).toBeInTheDocument();
    expect(screen.getByText('© 2025 Red Hat, Inc.')).toBeInTheDocument();
  });

  it('renders About section links', async () => {
    await renderFooter();

    expect(screen.getByText('About Red Hat')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.getByText('Contact Red Hat')).toBeInTheDocument();
    expect(screen.getByText('Red Hat Blog')).toBeInTheDocument();
    expect(screen.getByText('Cool Stuff Store')).toBeInTheDocument();
    expect(screen.getByText('Red Hat Summit')).toBeInTheDocument();
  });

  it('renders Privacy and legal section links', async () => {
    await renderFooter();

    expect(screen.getByText('Privacy statement')).toBeInTheDocument();
    expect(screen.getByText('Terms of use')).toBeInTheDocument();
    expect(screen.getByText('All policies and guidelines')).toBeInTheDocument();
    expect(screen.getByText('Digital accessibility')).toBeInTheDocument();
  });

  describe('TrustArc Cookie Consent', () => {
    it('creates TrustArc span element with correct attributes', async () => {
      await renderFooter();

      const teconsentSpan = document.getElementById('teconsent');
      expect(teconsentSpan).toBeTruthy();
      expect(teconsentSpan?.tagName).toBe('SPAN');
      expect(teconsentSpan?.id).toBe('teconsent');
      expect(teconsentSpan?.style.display).toBe('none');
    });

    it('appends TrustArc element to the correct parent li', async () => {
      await renderFooter();

      const teconsentSpan = document.getElementById('teconsent');
      expect(teconsentSpan).toBeTruthy();

      // Check that the span is inside a li element
      const parentLi = teconsentSpan?.closest('li');
      expect(parentLi).toBeTruthy();
      expect(parentLi?.tagName).toBe('LI');
    });

    it('creates TrustArc element only once across multiple renders', async () => {
      // First render
      const { unmount } = await renderFooter();
      const firstSpan = document.getElementById('teconsent');
      expect(firstSpan).toBeTruthy();

      // Unmount and render again
      unmount();
      await renderFooter();

      const secondSpan = document.getElementById('teconsent');
      expect(secondSpan).toBeTruthy();
      expect(firstSpan).toBe(secondSpan); // Should be the same element
    });

    it('renders consent_blackbar div', async () => {
      await renderFooter();

      const consentBlackbar = document.getElementById('consent_blackbar');
      expect(consentBlackbar).toBeTruthy();
      expect(consentBlackbar?.tagName).toBe('DIV');
    });

    it('handles re-renders without losing TrustArc element', async () => {
      const { rerender } = await renderFooter();

      // Simulate TrustArc injecting content
      const teconsentSpan = document.getElementById('teconsent');
      expect(teconsentSpan).toBeTruthy();

      // Add mock TrustArc content
      if (teconsentSpan) {
        teconsentSpan.innerHTML =
          '<a href="#" id="cookie-preferences">Cookie preferences</a>';
        teconsentSpan.style.display = 'inline';
      }

      // Re-render the component
      await act(async () => {
        rerender(
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <ThemeProvider theme={theme}>
              <SandboxCatalogFooter />
            </ThemeProvider>
          </BrowserRouter>,
        );
      });

      // Check that TrustArc content is preserved
      const preservedSpan = document.getElementById('teconsent');
      expect(preservedSpan).toBeTruthy();
      expect(preservedSpan?.innerHTML).toContain('Cookie preferences');
      expect(preservedSpan?.style.display).toBe('inline');
    });
  });
});
