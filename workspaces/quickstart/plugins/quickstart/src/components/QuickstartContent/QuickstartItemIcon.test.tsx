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

  it('should render legacy Rbac icon as VpnKeyOutlined', () => {
    const { container } = render(<QuickstartItemIcon icon="Rbac" />);
    expect(
      container.querySelector('[data-testid="VpnKeyOutlinedIcon"]'),
    ).toBeInTheDocument();
  });

  it('should render legacy Git icon as FileCopyOutlined', () => {
    const { container } = render(<QuickstartItemIcon icon="Git" />);
    expect(
      container.querySelector('[data-testid="FileCopyOutlinedIcon"]'),
    ).toBeInTheDocument();
  });

  it('should render legacy Plugins icon as PowerOutlined', () => {
    const { container } = render(<QuickstartItemIcon icon="Plugins" />);
    expect(
      container.querySelector('[data-testid="PowerOutlinedIcon"]'),
    ).toBeInTheDocument();
  });

  it('should render legacy Import icon as Login', () => {
    const { container } = render(<QuickstartItemIcon icon="Import" />);
    expect(
      container.querySelector('[data-testid="LoginIcon"]'),
    ).toBeInTheDocument();
  });

  it('should render legacy Catalog icon as CategoryOutlined', () => {
    const { container } = render(<QuickstartItemIcon icon="Catalog" />);
    expect(
      container.querySelector('[data-testid="CategoryOutlinedIcon"]'),
    ).toBeInTheDocument();
  });

  it('should render legacy SelfService icon as ControlPointOutlined', () => {
    const { container } = render(<QuickstartItemIcon icon="SelfService" />);
    expect(
      container.querySelector('[data-testid="ControlPointOutlinedIcon"]'),
    ).toBeInTheDocument();
  });

  it('should render legacy Learning icon as SchoolOutlined', () => {
    const { container } = render(<QuickstartItemIcon icon="Learning" />);
    expect(
      container.querySelector('[data-testid="SchoolOutlinedIcon"]'),
    ).toBeInTheDocument();
  });

  it('should render legacy Admin icon as AdminPanelSettingsOutlined', () => {
    const { container } = render(<QuickstartItemIcon icon="Admin" />);
    expect(
      container.querySelector('[data-testid="AdminPanelSettingsOutlinedIcon"]'),
    ).toBeInTheDocument();
  });

  it('should render Lightspeed common icon', () => {
    const { container } = render(<QuickstartItemIcon icon="Lightspeed" />);
    const svg = container.querySelector('svg.pf-v6-svg');
    expect(svg).toBeInTheDocument();
  });

  it('should fall back to material ligature for lowercase config ids', () => {
    render(<QuickstartItemIcon icon="settings" />);
    expect(screen.getByText('settings')).toHaveClass('material-icons-outlined');
  });

  it('should apply custom sx prop to the icon container', () => {
    mockGetSystemIcon.mockReturnValue(() => (
      <HomeIcon data-testid="system-icon" />
    ));

    const { container } = render(
      <QuickstartItemIcon icon="home" sx={{ color: 'red' }} />,
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it('should apply custom sx prop only to the common icon container', () => {
    const { container } = render(
      <QuickstartItemIcon icon="Admin" sx={{ marginRight: 1 }} />,
    );

    const icon = container.querySelector(
      '[data-testid="AdminPanelSettingsOutlinedIcon"]',
    );
    expect(icon).toBeInTheDocument();
    expect(icon).not.toHaveStyle({ marginRight: '8px' });
  });

  it('should render Shapes fallback for invalid icon ids', () => {
    render(<QuickstartItemIcon icon="NotAValidIcon" />);
    expect(screen.getByTestId('ShapesOutlinedIcon')).toBeInTheDocument();
  });
});
