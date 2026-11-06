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

import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { TimeSavedChip } from './TimeSavedChip';
import { TIME_SAVED_ANNOTATION_SNIPPET } from './timeSaved';

const messages: Record<string, string> = {
  'templateCard.timeSaved.estimate': 'Est. time saved: {{duration}}',
  'templateCard.timeSaved.estimateTooltip':
    'This number reflects the typical time to do this work without the template, as reported by the owner.',
  'templateCard.timeSaved.add': 'Add est. time saved',
  'templateCard.timeSaved.addTooltip':
    'Help others see the value of this template. Add this annotation to its template.yaml:',
  'templateCard.timeSaved.copy': 'Copy annotation',
  'templateCard.timeSaved.copied': 'Copied',
  'templateCard.timeSaved.minute_one': '{{count}} minute',
  'templateCard.timeSaved.minute_other': '{{count}} minutes',
  'templateCard.timeSaved.hour_one': '{{count}} hour',
  'templateCard.timeSaved.hour_other': '{{count}} hours',
  'templateCard.timeSaved.day_one': '{{count}} day',
  'templateCard.timeSaved.day_other': '{{count}} days',
};

jest.mock('@backstage/frontend-plugin-api', () => {
  const actual = jest.requireActual('@backstage/frontend-plugin-api');
  return {
    ...actual,
    useTranslationRef: () => ({
      t: (key: string, params?: { count?: number; duration?: string }) => {
        const resolved =
          typeof params?.count === 'number'
            ? `${key}_${params.count === 1 ? 'one' : 'other'}`
            : key;
        let message = messages[resolved] ?? key;
        if (params?.duration !== undefined) {
          message = message.replaceAll('{{duration}}', params.duration);
        }
        if (params?.count !== undefined) {
          message = message.replaceAll('{{count}}', String(params.count));
        }
        return message;
      },
    }),
  };
});

const theme = createTheme();

const renderChip = (annotations?: Record<string, string>) =>
  render(
    <ThemeProvider theme={theme}>
      <TimeSavedChip template={{ metadata: { annotations } }} />
    </ThemeProvider>,
  );

describe('TimeSavedChip', () => {
  it('shows the owner estimate in hours', () => {
    renderChip({ 'rhdh.redhat.com/time-saved': '600' });

    expect(screen.getByTestId('time-saved-estimate')).toHaveTextContent(
      'Est. time saved: 10 hours',
    );
  });

  it('shows hours and leftover minutes', () => {
    renderChip({ 'rhdh.redhat.com/time-saved': '90' });

    expect(screen.getByTestId('time-saved-estimate')).toHaveTextContent(
      'Est. time saved: 1 hour 30 minutes',
    );
  });

  it('shows a full day without leftover hours', () => {
    renderChip({ 'rhdh.redhat.com/time-saved': '1440' });

    expect(screen.getByTestId('time-saved-estimate')).toHaveTextContent(
      'Est. time saved: 1 day',
    );
  });

  it('shows multiple days', () => {
    renderChip({ 'rhdh.redhat.com/time-saved': '2880' });

    expect(screen.getByTestId('time-saved-estimate')).toHaveTextContent(
      'Est. time saved: 2 days',
    );
  });

  it('shows days and leftover hours', () => {
    renderChip({ 'rhdh.redhat.com/time-saved': '1680' });

    expect(screen.getByTestId('time-saved-estimate')).toHaveTextContent(
      'Est. time saved: 1 day 4 hours',
    );
  });

  it('shows days, hours, and leftover minutes', () => {
    renderChip({ 'rhdh.redhat.com/time-saved': '1710' });

    expect(screen.getByTestId('time-saved-estimate')).toHaveTextContent(
      'Est. time saved: 1 day 4 hours 30 minutes',
    );
  });

  it('offers to add the annotation when it is missing', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    renderChip();

    expect(screen.getByTestId('time-saved-add')).toHaveTextContent(
      'Add est. time saved',
    );

    fireEvent.mouseOver(screen.getByTestId('time-saved-add'));
    expect(
      await screen.findByText(
        'Help others see the value of this template. Add this annotation to its template.yaml:',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(TIME_SAVED_ANNOTATION_SNIPPET)).toBeInTheDocument();

    const copyButton = await screen.findByRole('button', {
      name: 'Copy annotation',
    });
    fireEvent.click(copyButton);
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(TIME_SAVED_ANNOTATION_SNIPPET);
  });
});
