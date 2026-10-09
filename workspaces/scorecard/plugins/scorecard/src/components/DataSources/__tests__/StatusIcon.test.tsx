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
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { StatusIcon } from '../StatusIcon';

const mockResolveStatusColor = jest.fn();
jest.mock('../../../utils', () => ({
  resolveStatusColor: function resolveStatusColor() {
    return mockResolveStatusColor.apply(null, arguments);
  },
}));

const mockScorecardIcon = jest.fn((_props: Record<string, unknown>) => (
  <span data-testid="scorecard-icon" />
));
jest.mock('../../ScorecardIcon/ScorecardIcon', () => ({
  ScorecardIcon: (props: Record<string, unknown>) => mockScorecardIcon(props),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

describe('StatusIcon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveStatusColor.mockReturnValue('#2e7d32');
  });

  it('should return null when icon is empty string', () => {
    const { container } = render(<StatusIcon icon="" color="success" />, {
      wrapper: TestWrapper,
    });
    expect(container.firstChild).toBeNull();
  });

  it('should render ScorecardIcon with resolved color when icon is provided', () => {
    const { getByTestId } = render(
      <StatusIcon icon="check_circle" color="success" />,
      { wrapper: TestWrapper },
    );
    expect(getByTestId('scorecard-icon')).toBeInTheDocument();
    expect(mockResolveStatusColor).toHaveBeenCalledWith(
      expect.objectContaining({ palette: expect.any(Object) }),
      'success',
    );
  });

  it('should pass correct props to ScorecardIcon', () => {
    mockResolveStatusColor.mockReturnValue('#d32f2f');

    render(<StatusIcon icon="warning" color="error" />, {
      wrapper: TestWrapper,
    });

    expect(mockScorecardIcon).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: 'warning',
        size: 'small',
        sx: { fontSize: 18, color: '#d32f2f' },
      }),
    );
  });
});
