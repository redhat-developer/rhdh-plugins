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
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { mockUseTranslation } from '../../../test-utils/mockTranslations';
import InfoComponent from '../Info';

// Mock translation hooks
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

describe('InfoComponent', () => {
  it('should render the InfoOutlinedIcon inside an IconButton', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <InfoComponent />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByTestId('InfoOutlinedIcon')).toBeInTheDocument();
  });

  it('should display tooltip text on hover', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <InfoComponent />
      </ThemeProvider>,
    );

    const user = userEvent.setup();
    const button = screen.getByRole('button');

    expect(
      screen.queryByText(
        'Set the number of licensed users in the app-config.yaml',
      ),
    ).not.toBeInTheDocument();

    await user.hover(button);

    expect(
      await screen.findByText(
        'Set the number of licensed users in the app-config.yaml',
      ),
    ).toBeInTheDocument();

    await user.unhover(button);
    await waitForElementToBeRemoved(() =>
      screen.queryByText(
        'Set the number of licensed users in the app-config.yaml',
      ),
    );
  });
});
