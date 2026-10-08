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

import { QuickstartIcon } from './QuickstartIcon';

const mockGetSystemIcon = jest.fn();

jest.mock('@backstage/core-plugin-api', () => ({
  useApp: jest.fn(() => ({
    getSystemIcon: mockGetSystemIcon,
  })),
}));

describe('QuickstartIcon', () => {
  beforeEach(() => {
    mockGetSystemIcon.mockReset();
    mockGetSystemIcon.mockReturnValue(null);
  });

  it('returns null when icon is not provided', () => {
    const { container } = render(<QuickstartIcon icon="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders system icon when available', () => {
    mockGetSystemIcon.mockReturnValue(() => (
      <HomeIcon data-testid="system-home-icon" />
    ));

    render(<QuickstartIcon icon="home" />);
    expect(screen.getByTestId('system-home-icon')).toBeInTheDocument();
    expect(mockGetSystemIcon).toHaveBeenCalledWith('home');
  });

  it('renders inline svg icons', () => {
    const svgString = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    const { container } = render(<QuickstartIcon icon={svgString} />);
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('renders remote image urls', () => {
    const { container } = render(
      <QuickstartIcon icon="https://example.com/icon.png" />,
    );
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/icon.png',
    );
  });

  it('renders HTTP image urls', () => {
    const { container } = render(
      <QuickstartIcon icon="http://example.com/icon.png" />,
    );
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'http://example.com/icon.png',
    );
  });

  it('renders relative image paths', () => {
    const { container } = render(<QuickstartIcon icon="/assets/icon.png" />);
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/assets/icon.png',
    );
  });

  it('renders data:image URIs', () => {
    const dataUri =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const { container } = render(<QuickstartIcon icon={dataUri} />);
    expect(container.querySelector('img')).toHaveAttribute('src', dataUri);
  });

  it('falls back to material ligature for legacy Import icon', () => {
    render(<QuickstartIcon icon="Import" />);
    expect(screen.getByText('login')).toHaveClass('material-icons-outlined');
  });

  it('falls back to material ligature for legacy SelfService icon', () => {
    render(<QuickstartIcon icon="SelfService" />);
    expect(screen.getByText('control_point')).toHaveClass(
      'material-icons-outlined',
    );
  });

  it('falls back to material ligature for legacy Rbac icon', () => {
    render(<QuickstartIcon icon="Rbac" />);
    expect(screen.getByText('security')).toHaveClass('material-icons-outlined');
  });

  it('falls back to material ligature for lowercase config ids', () => {
    render(<QuickstartIcon icon="settings" />);
    expect(screen.getByText('settings')).toHaveClass('material-icons-outlined');
  });

  it('renders MUI fallback for invalid icon ids', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(<QuickstartIcon icon="NotAValidIcon" />);

    expect(screen.getByTestId('QuickstartIconFallback')).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('NotAValidIcon'),
    );

    warnSpy.mockRestore();
  });
});
