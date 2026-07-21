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
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { mockUseTranslation } from '../../../test-utils/mockTranslations';
import { TimeSavedBadge } from '../TimeSavedBadge';

jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

describe('TimeSavedBadge', () => {
  const theme = createTheme();
  const user = userEvent.setup();

  const renderBadge = (annotations?: Record<string, string>) =>
    render(
      <ThemeProvider theme={theme}>
        <TimeSavedBadge annotations={annotations} />
      </ThemeProvider>,
    );

  describe('when annotation is present', () => {
    it('renders badge with formatted time', () => {
      renderBadge({ 'rhdh.redhat.com/time-saved': '180' });
      expect(screen.getByText(/Est\. time saved: 3h/)).toBeInTheDocument();
    });

    it('renders badge with days and hours for large values', () => {
      renderBadge({ 'rhdh.redhat.com/time-saved': '1530' });
      expect(screen.getByText(/Est\. time saved: 1d 1h/)).toBeInTheDocument();
    });

    it('renders badge with minutes for small values', () => {
      renderBadge({ 'rhdh.redhat.com/time-saved': '30' });
      expect(screen.getByText(/Est\. time saved: 30 min/)).toBeInTheDocument();
    });

    it('shows explanatory tooltip on hover', async () => {
      renderBadge({ 'rhdh.redhat.com/time-saved': '180' });
      const chip = screen.getByText(/Est\. time saved/);
      await user.hover(chip);
      expect(
        await screen.findByText(/This number reflects the typical time/),
      ).toBeInTheDocument();
    });
  });

  describe('when annotation is absent', () => {
    it('renders add badge when annotations are undefined', () => {
      renderBadge(undefined);
      expect(screen.getByText('Add est. time saved')).toBeInTheDocument();
    });

    it('renders add badge when annotation key is missing', () => {
      renderBadge({ 'some.other/annotation': 'value' });
      expect(screen.getByText('Add est. time saved')).toBeInTheDocument();
    });

    it('renders add badge for invalid annotation value', () => {
      renderBadge({ 'rhdh.redhat.com/time-saved': 'not-a-number' });
      expect(screen.getByText('Add est. time saved')).toBeInTheDocument();
    });

    it('renders add badge for zero value', () => {
      renderBadge({ 'rhdh.redhat.com/time-saved': '0' });
      expect(screen.getByText('Add est. time saved')).toBeInTheDocument();
    });

    it('shows copyable annotation tooltip on hover', async () => {
      renderBadge(undefined);
      const chip = screen.getByText('Add est. time saved');
      await user.hover(chip);
      expect(
        await screen.findByText(/Help users see the value/),
      ).toBeInTheDocument();
      expect(
        await screen.findByText(/rhdh\.redhat\.com\/time-saved/),
      ).toBeInTheDocument();
    });

    it('copies annotation snippet when copy button is clicked', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(window.navigator, 'clipboard', {
        value: { writeText },
        writable: true,
        configurable: true,
      });

      renderBadge(undefined);
      const chip = screen.getByText('Add est. time saved');
      await user.hover(chip);

      const copyButton = await screen.findByRole('button', {
        name: 'Copy annotation',
      });
      await user.click(copyButton);

      expect(writeText).toHaveBeenCalledWith(
        "rhdh.redhat.com/time-saved: '<duration>'",
      );
      expect(await screen.findByText('Copied!')).toBeInTheDocument();
    });
  });
});
