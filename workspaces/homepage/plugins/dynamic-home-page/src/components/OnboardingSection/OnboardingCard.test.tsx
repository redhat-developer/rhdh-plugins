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
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

import OnboardingCard from './OnboardingCard';

jest.mock('@backstage/core-components', () => ({
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('OnboardingCard', () => {
  const mockProps = {
    title: 'Get Started',
    description: 'This is a sample onboarding description to guide users.',
    buttonText: 'Learn More',
    buttonLink: '/docs',
    target: '_blank',
  };

  const renderWithTheme = (ui: React.ReactElement) => {
    const theme = createTheme();
    return render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
      </MemoryRouter>,
    );
  };

  it('should render title, description, and button text', () => {
    renderWithTheme(<OnboardingCard {...mockProps} />);

    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This is a sample onboarding description to guide users.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('should render a link with correct href and target', () => {
    renderWithTheme(<OnboardingCard {...mockProps} />);
    const link = screen.getByRole('link', { name: /Learn More/i });

    expect(link).toHaveAttribute('href', '/docs');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should render the ArrowForwardIcon', () => {
    renderWithTheme(<OnboardingCard {...mockProps} />);
    const icon = screen.getByTestId('ArrowForwardIcon');
    expect(icon).toBeInTheDocument();
  });
});
