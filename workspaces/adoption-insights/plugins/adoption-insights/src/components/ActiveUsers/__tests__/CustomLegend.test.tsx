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
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  MockTrans,
  mockUseTranslation,
} from '../../../test-utils/mockTranslations';

import CustomLegend from '../CustomLegend';

// Mock translation hooks
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../Trans', () => ({
  Trans: MockTrans,
}));

describe('CustomLegend Component', () => {
  const theme = createTheme();

  const renderComponent = (payload: any) => {
    return render(
      <ThemeProvider theme={theme}>
        <CustomLegend payload={payload} />
      </ThemeProvider>,
    );
  };

  it('should render legend items correctly', () => {
    const mockPayload = [
      { value: 'new_users', color: 'blue' },
      { value: 'returning_users', color: 'green' },
    ];

    renderComponent(mockPayload);

    expect(screen.getByText('New users')).toBeInTheDocument();
    expect(screen.getByText('Returning users')).toBeInTheDocument();
  });

  it('should apply the correct styles for legend markers', () => {
    const mockPayload = [{ value: 'new_users', color: 'red' }];
    renderComponent(mockPayload);

    const legendMarker = screen.getByText('New users').previousSibling;
    expect(legendMarker).toBeTruthy();
  });
});
