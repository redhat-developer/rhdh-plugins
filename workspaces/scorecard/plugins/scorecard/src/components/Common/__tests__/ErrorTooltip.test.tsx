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

import { ErrorTooltip } from '../ErrorTooltip';

// MUI Tooltip uses portals + transitions
// disable them for stable tests
jest.mock('@mui/material/Tooltip', () => {
  return ({ children, title, open }: any) => (
    <div>
      {children}
      {open && title && <span data-testid="tooltip">{title}</span>}
    </div>
  );
});

describe('ErrorTooltip Component', () => {
  it('should render tooltip when title is provided', () => {
    render(
      <ErrorTooltip
        title="Error occurred"
        tooltipPosition={{ x: 100, y: 200 }}
      />,
    );

    expect(screen.getByTestId('tooltip')).toHaveTextContent('Error occurred');
  });

  it('should position tooltip correctly', () => {
    const { container } = render(
      <ErrorTooltip title="Position test" tooltipPosition={{ x: 50, y: 75 }} />,
    );

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper).toHaveStyle({
      left: '50px',
      top: '75px',
      position: 'absolute',
    });
  });

  it('should not render tooltip text when title is undefined', () => {
    render(
      <ErrorTooltip title={undefined} tooltipPosition={{ x: 10, y: 10 }} />,
    );

    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });

  it('should not render when tooltipPosition is undefined', () => {
    const { container } = render(
      <ErrorTooltip title="No position" tooltipPosition={undefined} />,
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });
});
