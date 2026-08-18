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

import { render } from '@testing-library/react';

import { ScorecardIcon } from '../ScorecardIcon';

const mockGetSystemIcon = jest.fn();

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApp: () => ({
    getSystemIcon: mockGetSystemIcon,
  }),
}));

describe('ScorecardIcon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null for empty icon string', () => {
    const { container } = render(<ScorecardIcon icon="" />);
    expect(container.firstChild).toBeNull();
  });

  it('should use system icon when registered', () => {
    const MockIcon = (props: any) => (
      <span data-testid="system-icon" {...props} />
    );
    mockGetSystemIcon.mockReturnValue(MockIcon);

    const { getByTestId } = render(
      <ScorecardIcon icon="scorecardSuccessStatusIcon" />,
    );

    expect(mockGetSystemIcon).toHaveBeenCalledWith(
      'scorecardSuccessStatusIcon',
    );
    expect(getByTestId('system-icon')).toBeInTheDocument();
  });

  it('should fall back to built-in icon when system icon is not registered', () => {
    mockGetSystemIcon.mockReturnValue(undefined);

    const { container } = render(
      <ScorecardIcon icon="scorecardSuccessStatusIcon" />,
    );

    expect(mockGetSystemIcon).toHaveBeenCalledWith(
      'scorecardSuccessStatusIcon',
    );
    expect(
      container.querySelector('[data-testid="CheckCircleOutlineIcon"]'),
    ).toBeInTheDocument();
  });

  it('should fall back to built-in warning icon', () => {
    mockGetSystemIcon.mockReturnValue(undefined);

    const { container } = render(
      <ScorecardIcon icon="scorecardWarningStatusIcon" />,
    );

    expect(
      container.querySelector('[data-testid="WarningAmberIcon"]'),
    ).toBeInTheDocument();
  });

  it('should fall back to built-in error icon', () => {
    mockGetSystemIcon.mockReturnValue(undefined);

    const { container } = render(
      <ScorecardIcon icon="scorecardErrorStatusIcon" />,
    );

    expect(
      container.querySelector('[data-testid="DangerousOutlinedIcon"]'),
    ).toBeInTheDocument();
  });

  it('should prefer system icon over built-in icon', () => {
    const OverrideIcon = (props: any) => (
      <span data-testid="override-icon" {...props} />
    );
    mockGetSystemIcon.mockReturnValue(OverrideIcon);

    const { getByTestId, container } = render(
      <ScorecardIcon icon="scorecardSuccessStatusIcon" />,
    );

    expect(getByTestId('override-icon')).toBeInTheDocument();
    expect(
      container.querySelector('[data-testid="CheckCircleOutlineIcon"]'),
    ).not.toBeInTheDocument();
  });

  it('should render URL-based icon as image', () => {
    mockGetSystemIcon.mockReturnValue(undefined);

    const { container } = render(
      <ScorecardIcon icon="https://example.com/icon.png" />,
    );

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute('src')).toBe('https://example.com/icon.png');
  });

  it('should render unknown icon string as Material Design ligature', () => {
    mockGetSystemIcon.mockReturnValue(undefined);

    const { container } = render(<ScorecardIcon icon="settings" />);

    const muiIcon = container.querySelector('.material-icons-outlined');
    expect(muiIcon).toBeInTheDocument();
    expect(muiIcon?.textContent).toBe('settings');
  });
});
