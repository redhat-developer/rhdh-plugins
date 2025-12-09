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
import HomeIcon from '@mui/icons-material/Home';

import { QuickstartItemIcon } from './QuickstartItemIcon';

const mockGetSystemIcon = jest.fn();

jest.mock('@backstage/core-plugin-api', () => ({
  useApp: jest.fn(() => ({
    getSystemIcon: mockGetSystemIcon,
  })),
}));

describe('QuickstartItemIcon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSystemIcon.mockReturnValue(null);
  });

  it('should return null when icon is not provided', () => {
    const { container } = render(<QuickstartItemIcon />);
    expect(container.firstChild).toBeNull();
  });

  it('should return null when icon is empty string', () => {
    const { container } = render(<QuickstartItemIcon icon="" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render system icon when available', () => {
    mockGetSystemIcon.mockReturnValue(() => (
      <HomeIcon data-testid="system-home-icon" />
    ));

    render(<QuickstartItemIcon icon="home" />);
    expect(screen.getByTestId('system-home-icon')).toBeInTheDocument();
    expect(mockGetSystemIcon).toHaveBeenCalledWith('home');
  });

  it('should render SVG string as base64 data URI', () => {
    const svgString = '<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>';
    render(<QuickstartItemIcon icon={svgString} />);

    const img = screen.getByRole('img', { hidden: true });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it('should render HTTPS URL as image', () => {
    const url = 'https://example.com/icon.png';
    render(<QuickstartItemIcon icon={url} />);

    const img = screen.getByRole('img', { hidden: true });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe(url);
  });

  it('should render HTTP URL as image', () => {
    const url = 'http://example.com/icon.png';
    render(<QuickstartItemIcon icon={url} />);

    const img = screen.getByRole('img', { hidden: true });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe(url);
  });

  it('should render relative path as image', () => {
    const path = '/assets/icon.png';
    render(<QuickstartItemIcon icon={path} />);

    const img = screen.getByRole('img', { hidden: true });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe(path);
  });

  it('should render data:image URI as image', () => {
    const dataUri =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    render(<QuickstartItemIcon icon={dataUri} />);

    const img = screen.getByRole('img', { hidden: true });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe(dataUri);
  });

  it('should render Admin common icon', () => {
    render(<QuickstartItemIcon icon="Admin" />);
    expect(
      screen.getByTestId('AdminPanelSettingsOutlinedIcon'),
    ).toBeInTheDocument();
  });

  it('should render Rbac common icon', () => {
    render(<QuickstartItemIcon icon="Rbac" />);
    expect(screen.getByTestId('VpnKeyOutlinedIcon')).toBeInTheDocument();
  });

  it('should render Git common icon', () => {
    render(<QuickstartItemIcon icon="Git" />);
    expect(screen.getByTestId('FileCopyOutlinedIcon')).toBeInTheDocument();
  });

  it('should render Plugins common icon', () => {
    render(<QuickstartItemIcon icon="Plugins" />);
    expect(screen.getByTestId('PowerOutlinedIcon')).toBeInTheDocument();
  });

  it('should render Import common icon', () => {
    render(<QuickstartItemIcon icon="Import" />);
    expect(screen.getByTestId('LoginIcon')).toBeInTheDocument();
  });

  it('should render Catalog common icon', () => {
    render(<QuickstartItemIcon icon="Catalog" />);
    expect(screen.getByTestId('CategoryOutlinedIcon')).toBeInTheDocument();
  });

  it('should render SelfService common icon', () => {
    render(<QuickstartItemIcon icon="SelfService" />);
    expect(screen.getByTestId('ControlPointOutlinedIcon')).toBeInTheDocument();
  });

  it('should render Learning common icon', () => {
    render(<QuickstartItemIcon icon="Learning" />);
    expect(screen.getByTestId('SchoolOutlinedIcon')).toBeInTheDocument();
  });

  it('should render material icon for unknown string', () => {
    render(<QuickstartItemIcon icon="settings" />);

    const icon = screen.getByText('settings');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('material-icons-outlined');
  });

  it('should apply custom sx prop', () => {
    mockGetSystemIcon.mockReturnValue(() => (
      <HomeIcon data-testid="system-icon" />
    ));

    const { container } = render(
      <QuickstartItemIcon icon="home" sx={{ color: 'red' }} />,
    );

    const box = container.firstChild;
    expect(box).toBeInTheDocument();
  });
});
