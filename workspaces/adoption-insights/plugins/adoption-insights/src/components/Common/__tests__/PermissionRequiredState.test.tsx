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

import {
  MockTrans,
  mockUseTranslation,
} from '../../../test-utils/mockTranslations';

import PermissionRequiredState from '../PermissionRequiredState';

// Mock translation hooks
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../Trans', () => ({
  Trans: MockTrans,
}));

jest.mock('@mui/icons-material/OpenInNew', () => () => (
  <svg data-testid="mock-open-in-new-icon" />
));

jest.mock('../PermissionRequiredIcon', () => ({
  __esModule: true,
  PermissionRequiredIcon: () => (
    <div data-testid="mock-permission-icon">Icon</div>
  ),
}));

describe('PermissionRequiredState', () => {
  it('should render the missing permissions alert', () => {
    render(<PermissionRequiredState />);

    // Title
    expect(screen.getByText('Missing permissions')).toBeInTheDocument();

    // Description
    expect(
      screen.getByText(
        /To view "Adoption Insights" plugin, contact your administrator/i,
      ),
    ).toBeInTheDocument();

    // Custom Icon
    expect(screen.getByTestId('mock-permission-icon')).toBeInTheDocument();

    // Action Button
    const readMoreLink = screen.getByRole('link', { name: /read more/i });
    expect(readMoreLink).toBeInTheDocument();
    expect(readMoreLink).toHaveAttribute(
      'href',
      'https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/adoption-insights/plugins/adoption-insights/README.md#permission-framework-support',
    );

    // OpenInNewIcon
    expect(screen.getByTestId('mock-open-in-new-icon')).toBeInTheDocument();
  });
});
