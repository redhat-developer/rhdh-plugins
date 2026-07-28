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
import GitHubIcon from '@mui/icons-material/GitHub';
import HomeIcon from '@mui/icons-material/Home';

import { QuickAccessIcon } from './QuickAccessIcon';

const mockGetSystemIcon = jest.fn();

jest.mock('@backstage/core-plugin-api', () => ({
  useApp: jest.fn(() => ({
    getSystemIcon: mockGetSystemIcon,
  })),
}));

describe('QuickAccessIcon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSystemIcon.mockReturnValue(null);
  });

  it('should return null when icon is not provided', () => {
    const { container } = render(<QuickAccessIcon icon="" alt="test" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render React element directly', () => {
    render(
      <QuickAccessIcon
        icon={<GitHubIcon data-testid="github-icon" />}
        alt="GitHub"
      />,
    );
    expect(screen.getByTestId('github-icon')).toBeInTheDocument();
  });

  it('should render system icon when available', () => {
    mockGetSystemIcon.mockReturnValue(() => (
      <HomeIcon data-testid="system-home-icon" />
    ));

    render(<QuickAccessIcon icon="home" alt="Home" />);
    expect(screen.getByTestId('system-home-icon')).toBeInTheDocument();
    expect(mockGetSystemIcon).toHaveBeenCalledWith('home');
  });

  it('should render SVG string as base64 data URI', () => {
    const svgString = '<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>';
    render(<QuickAccessIcon icon={svgString} alt="SVG Icon" />);

    const img = screen.getByRole('img', { name: 'SVG Icon' });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it('should render HTTPS URL as image', () => {
    const url = 'https://example.com/icon.png';
    render(<QuickAccessIcon icon={url} alt="HTTPS Icon" />);

    const img = screen.getByRole('img', { name: 'HTTPS Icon' });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe(url);
  });

  it('should render HTTP URL as image', () => {
    const url = 'http://example.com/icon.png';
    render(<QuickAccessIcon icon={url} alt="HTTP Icon" />);

    const img = screen.getByRole('img', { name: 'HTTP Icon' });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe(url);
  });

  it('should render relative path as image', () => {
    const path = '/assets/icon.png';
    render(<QuickAccessIcon icon={path} alt="Relative Icon" />);

    const img = screen.getByRole('img', { name: 'Relative Icon' });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe(path);
  });

  it('should render data:image URI as image', () => {
    const dataUri =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    render(<QuickAccessIcon icon={dataUri} alt="Data URI Icon" />);

    const img = screen.getByRole('img', { name: 'Data URI Icon' });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe(dataUri);
  });

  it('should render material icon for plain string', () => {
    render(<QuickAccessIcon icon="settings" alt="Settings" />);

    const icon = screen.getByText('settings');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('material-icons-outlined');
  });
});
