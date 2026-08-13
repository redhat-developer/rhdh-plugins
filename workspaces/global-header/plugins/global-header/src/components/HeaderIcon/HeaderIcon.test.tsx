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
import { HeaderIcon } from './HeaderIcon';

const mockGetSystemIcon = jest.fn();

jest.mock('@backstage/core-plugin-api', () => ({
  useApp: () => ({
    getSystemIcon: mockGetSystemIcon,
  }),
}));

describe('HeaderIcon', () => {
  beforeEach(() => {
    mockGetSystemIcon.mockReset();
  });

  it('returns null when icon is not provided', () => {
    const { container } = render(<HeaderIcon icon="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders system icon when available', () => {
    mockGetSystemIcon.mockReturnValue(() => (
      <HomeIcon data-testid="system-home-icon" />
    ));

    render(<HeaderIcon icon="home" />);
    expect(screen.getByTestId('system-home-icon')).toBeInTheDocument();
    expect(mockGetSystemIcon).toHaveBeenCalledWith('home');
  });

  it('renders inline svg icons', () => {
    const svgString = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    const { container } = render(<HeaderIcon icon={svgString} />);
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('renders remote image urls', () => {
    const { container } = render(
      <HeaderIcon icon="https://example.com/icon.png" />,
    );
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/icon.png',
    );
  });

  it('returns null for unknown icon ids', () => {
    const { container } = render(<HeaderIcon icon="unknown_custom_icon" />);
    expect(container).toBeEmptyDOMElement();
  });
});
