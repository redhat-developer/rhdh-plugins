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
      <span data-testid="system-home-icon" />
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

  it('should render legacy Rbac icon', () => {
    render(<QuickstartItemIcon icon="Rbac" />);
    expect(screen.getByTestId('RbacIcon')).toBeInTheDocument();
  });

  it('should render legacy Git icon', () => {
    render(<QuickstartItemIcon icon="Git" />);
    expect(screen.getByTestId('GitIcon')).toBeInTheDocument();
  });

  it('should render legacy Plugins icon', () => {
    render(<QuickstartItemIcon icon="Plugins" />);
    expect(screen.getByTestId('PluginsIcon')).toBeInTheDocument();
  });

  it('should render legacy Import icon', () => {
    render(<QuickstartItemIcon icon="Import" />);
    expect(screen.getByTestId('ImportIcon')).toBeInTheDocument();
  });

  it('should render legacy Catalog icon', () => {
    render(<QuickstartItemIcon icon="Catalog" />);
    expect(screen.getByTestId('CatalogIcon')).toBeInTheDocument();
  });

  it('should render legacy SelfService icon', () => {
    render(<QuickstartItemIcon icon="SelfService" />);
    expect(screen.getByTestId('SelfServiceIcon')).toBeInTheDocument();
  });

  it('should render legacy Learning icon', () => {
    render(<QuickstartItemIcon icon="Learning" />);
    expect(screen.getByTestId('LearningIcon')).toBeInTheDocument();
  });

  it('should render legacy Admin icon', () => {
    render(<QuickstartItemIcon icon="Admin" />);
    expect(screen.getByTestId('AdminIcon')).toBeInTheDocument();
  });

  it('should render Lightspeed common icon at the same 24px size as Remix step icons', () => {
    const { container } = render(<QuickstartItemIcon icon="Lightspeed" />);
    const svg = container.querySelector('svg.pf-v6-svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('should fall back to material ligature for lowercase config ids', () => {
    render(<QuickstartItemIcon icon="settings" />);
    expect(screen.getByText('settings')).toHaveClass('material-icons-outlined');
  });

  it('should apply custom className to the icon container', () => {
    mockGetSystemIcon.mockReturnValue(() => <span data-testid="system-icon" />);

    const { container } = render(
      <QuickstartItemIcon icon="home" className="custom-icon" />,
    );

    expect(container.firstChild).toHaveClass('custom-icon');
  });

  it('should apply custom className to the common icon container', () => {
    const { container } = render(
      <QuickstartItemIcon icon="Admin" className="custom-admin" />,
    );

    expect(container.firstChild).toHaveClass('custom-admin');
    expect(screen.getByTestId('AdminIcon')).toBeInTheDocument();
  });

  it('should render Remix fallback for invalid icon ids', () => {
    render(<QuickstartItemIcon icon="NotAValidIcon" />);
    expect(screen.getByTestId('QuickstartIconFallback')).toBeInTheDocument();
  });
});
