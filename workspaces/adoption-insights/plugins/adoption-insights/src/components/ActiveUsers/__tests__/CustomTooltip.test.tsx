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
import React from 'react';

import { render, screen } from '@testing-library/react';
import CustomTooltip from '../CustomTooltip';
import { format } from 'date-fns';

const mockPayload = [{ value: 10 }, { value: 5 }];

describe('CustomTooltip Component', () => {
  it('should render tooltip with correct data when active', () => {
    const label = '2025-03-09T00:00:00.000Z';
    const formattedDate = format(new Date(label), 'MMMM, dd yyyy');

    render(<CustomTooltip active payload={mockPayload} label={label} />);

    expect(screen.getByText(formattedDate)).toBeInTheDocument();
    expect(screen.getByText('Returning users')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('New users')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should return null when inactive', () => {
    const { container } = render(
      <CustomTooltip active={false} payload={mockPayload} label="" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should handle missing payload safely', () => {
    render(<CustomTooltip active payload={[]} label="" />);
    expect(screen.queryByText('Returning users')).not.toBeInTheDocument();
    expect(screen.queryByText('New users')).not.toBeInTheDocument();
  });
});
