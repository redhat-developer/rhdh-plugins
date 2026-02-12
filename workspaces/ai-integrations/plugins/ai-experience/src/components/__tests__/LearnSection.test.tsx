/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * You may not use this file except in compliance with the License.
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
import { LearnSection } from '../LearnSection/LearnSection';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme } from '@backstage/theme';
import { mockUseTranslation } from '../../test-utils/mockTranslations';

jest.mock('../LearnSection/CardWrapper', () => ({
  __esModule: true,
  default: ({ title, description, buttonText, buttonLink, target }: any) => (
    <div data-testid="card-wrapper">
      <h3>{title}</h3>
      <p>{description}</p>
      <a href={buttonLink} target={target}>
        {buttonText}
      </a>
    </div>
  ),
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={lightTheme}>{component}</ThemeProvider>);
};

// Mock dependencies
jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));
describe('LearnSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all learning section items with translated content', () => {
    renderWithTheme(<LearnSection />);

    // Check that all three learning items are rendered
    const cardWrappers = screen.getAllByTestId('card-wrapper');
    expect(cardWrappers).toHaveLength(3);

    // Check translated content
    expect(screen.getByText('Get started')).toBeInTheDocument();
    expect(
      screen.getByText('Learn about Red Hat Developer Hub.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Go to Tech Docs')).toBeInTheDocument();

    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(
      screen.getByText('Explore AI models, servers and templates.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Go to Catalog')).toBeInTheDocument();

    expect(screen.getByText('Learn')).toBeInTheDocument();
    expect(
      screen.getByText('Explore and develop new skills in AI.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Go to Learning Paths')).toBeInTheDocument();
  });

  it('renders AI illustration with translated alt text', () => {
    renderWithTheme(<LearnSection />);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'AI illustration');
  });

  it('renders correct links for each learning item', () => {
    renderWithTheme(<LearnSection />);

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute(
      'href',
      'https://docs.redhat.com/en/documentation/red_hat_developer_hub/',
    );
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[1]).toHaveAttribute('href', '/catalog');
    expect(links[2]).toHaveAttribute('href', '/learning-paths');
  });
});
