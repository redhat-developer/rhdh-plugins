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
import CustomTooltip from '../CustomTooltip';
import { format } from 'date-fns';

const mockPayload = [{ value: 100 }];
const mockLabel = '2025-03-01';

describe('CustomTooltip Component', () => {
  it('should render tooltip when active with correct data', () => {
    render(<CustomTooltip active payload={mockPayload} label={mockLabel} />);

    const formattedDate = format(new Date(mockLabel), 'MMMM, dd yyyy');
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
    expect(screen.getByText('Number of searches')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should not render tooltip when inactive', () => {
    const { container } = render(
      <CustomTooltip active={false} payload={mockPayload} label={mockLabel} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should handle empty payload safely', () => {
    render(<CustomTooltip active payload={[]} label={mockLabel} />);
    expect(screen.queryByText('Number of searches')).not.toBeInTheDocument();
  });

  it('should render current month when label is missing', () => {
    render(<CustomTooltip active payload={mockPayload} />);

    const currentDate = format(new Date(), 'MMMM, dd yyyy');
    expect(screen.getByText(currentDate)).toBeInTheDocument();
  });
});
