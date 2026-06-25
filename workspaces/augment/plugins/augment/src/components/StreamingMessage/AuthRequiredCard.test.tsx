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
import { AuthRequiredCard } from './AuthRequiredCard';

const theme = createTheme();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('AuthRequiredCard', () => {
  describe('OAuth mode', () => {
    it('renders OAuth title and sign-in button', () => {
      renderWithTheme(
        <AuthRequiredCard authType="oauth" url="https://auth.example.com" />,
      );

      expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
        'href',
        'https://auth.example.com',
      );
    });

    it('shows confirm button after sign-in is clicked', () => {
      const onOAuthConfirm = jest.fn();
      renderWithTheme(
        <AuthRequiredCard
          authType="oauth"
          url="https://auth.example.com"
          onOAuthConfirm={onOAuthConfirm}
        />,
      );

      fireEvent.click(screen.getByRole('link', { name: /sign in/i }));

      const confirmBtn = screen.getByRole('button', {
        name: /signed in/i,
      });
      expect(confirmBtn).toBeInTheDocument();
    });

    it('calls onOAuthConfirm when confirm is clicked', () => {
      const onOAuthConfirm = jest.fn();
      renderWithTheme(
        <AuthRequiredCard
          authType="oauth"
          url="https://auth.example.com"
          onOAuthConfirm={onOAuthConfirm}
        />,
      );

      fireEvent.click(screen.getByRole('link', { name: /sign in/i }));
      fireEvent.click(screen.getByRole('button', { name: /signed in/i }));

      expect(onOAuthConfirm).toHaveBeenCalled();
    });

    it('shows hint text when no URL provided', () => {
      renderWithTheme(<AuthRequiredCard authType="oauth" />);

      expect(screen.queryByRole('link', { name: /sign in/i })).toBeNull();
    });
  });

  describe('Secret mode', () => {
    it('renders secret input fields', () => {
      renderWithTheme(
        <AuthRequiredCard
          authType="secret"
          demands={{
            secrets: [
              { name: 'API_KEY', description: 'Your API key' },
              { name: 'API_SECRET', description: 'Your API secret' },
            ],
          }}
        />,
      );

      expect(screen.getByLabelText('API_KEY *')).toBeInTheDocument();
      expect(screen.getByLabelText('API_SECRET *')).toBeInTheDocument();
      expect(screen.getByText('Your API key')).toBeInTheDocument();
    });

    it('disables submit when secrets are not filled', () => {
      renderWithTheme(
        <AuthRequiredCard
          authType="secret"
          demands={{
            secrets: [{ name: 'TOKEN' }],
          }}
          onSecretsSubmit={jest.fn()}
        />,
      );

      const submitBtn = screen.getByRole('button', { name: /submit/i });
      expect(submitBtn).toBeDisabled();
    });

    it('enables submit and calls onSecretsSubmit with values', () => {
      const onSecretsSubmit = jest.fn();
      renderWithTheme(
        <AuthRequiredCard
          authType="secret"
          demands={{
            secrets: [{ name: 'TOKEN' }],
          }}
          onSecretsSubmit={onSecretsSubmit}
        />,
      );

      fireEvent.change(screen.getByLabelText('TOKEN *'), {
        target: { value: 'sk-test-123' },
      });

      const submitBtn = screen.getByRole('button', { name: /submit/i });
      expect(submitBtn).not.toBeDisabled();

      fireEvent.click(submitBtn);
      expect(onSecretsSubmit).toHaveBeenCalledWith({ TOKEN: 'sk-test-123' });
    });

    it('renders credentials title', () => {
      renderWithTheme(
        <AuthRequiredCard authType="secret" demands={{ secrets: [] }} />,
      );

      expect(screen.getByText(/credentials required/i)).toBeInTheDocument();
    });
  });
});
