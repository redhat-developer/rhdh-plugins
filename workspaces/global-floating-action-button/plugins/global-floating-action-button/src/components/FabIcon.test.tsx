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

import { FabIcon } from './FabIcon';

const mockGetSystemIcon = jest.fn();

jest.mock('@backstage/core-plugin-api', () => ({
  useApp: jest.fn(() => ({
    getSystemIcon: mockGetSystemIcon,
  })),
}));

describe('FabIcon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSystemIcon.mockReturnValue(null);
  });

  it('should return null when icon is not provided', () => {
    const { container } = render(<FabIcon icon="" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render React element directly', () => {
    render(<FabIcon icon={<GitHubIcon data-testid="github-icon" />} />);
    expect(screen.getByTestId('github-icon')).toBeInTheDocument();
  });

  it('should render system icon when available', () => {
    mockGetSystemIcon.mockReturnValue(() => (
      <HomeIcon data-testid="system-home-icon" />
    ));

    render(<FabIcon icon="home" />);
    expect(screen.getByTestId('system-home-icon')).toBeInTheDocument();
    expect(mockGetSystemIcon).toHaveBeenCalledWith('home');
  });

  it('should render SVG string as base64 data URI', () => {
    const svgString = '<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>';
    render(<FabIcon icon={svgString} />);

    const img = screen.getByRole('img', { hidden: true });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it('should render HTTPS URL as image', () => {
    const url = 'https://example.com/icon.png';
    render(<FabIcon icon={url} />);

    const img = screen.getByRole('img', { hidden: true });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe(url);
  });

  it('should render HTTP URL as image', () => {
    const url = 'http://example.com/icon.png';
    render(<FabIcon icon={url} />);

    const img = screen.getByRole('img', { hidden: true });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe(url);
  });

  it('should render relative path as image', () => {
    const path = '/assets/icon.png';
    render(<FabIcon icon={path} />);

    const img = screen.getByRole('img', { hidden: true });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe(path);
  });

  it('should render data:image URI as image', () => {
    const dataUri =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    render(<FabIcon icon={dataUri} />);

    const img = screen.getByRole('img', { hidden: true });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe(dataUri);
  });

  it('should render material icon for plain string', () => {
    render(<FabIcon icon="settings" />);

    const icon = screen.getByText('settings');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('material-icons-outlined');
  });
});
