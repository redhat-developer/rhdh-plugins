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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockUseTranslation } from '../test-utils/mockTranslations';
import { TruncatedId } from './TruncatedId';

jest.mock('../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

const clipboardDescriptor = Object.getOwnPropertyDescriptor(
  window.navigator,
  'clipboard',
);

const setClipboard = (clipboard?: Clipboard) => {
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: clipboard,
  });
};

afterEach(() => {
  if (clipboardDescriptor) {
    Object.defineProperty(window.navigator, 'clipboard', clipboardDescriptor);
  } else {
    Reflect.deleteProperty(window.navigator, 'clipboard');
  }
});

describe('TruncatedId', () => {
  it('does not truncate values at or below the threshold', () => {
    setClipboard({ writeText: jest.fn() } as unknown as Clipboard);

    render(<TruncatedId value="123456789012" />);

    expect(screen.getByText('123456789012')).toBeInTheDocument();
  });

  it('copies the full value through an accessible control', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard({ writeText } as unknown as Clipboard);
    const value = '1234567890abcdef';

    render(<TruncatedId value={value} />);

    const button = screen.getByRole('button', {
      name: 'Copy to clipboard',
    });
    await userEvent.setup().click(button);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(value));
    expect(screen.getByText('123456…cdef')).toBeInTheDocument();
    expect(screen.getByTitle(value)).toBeInTheDocument();
  });

  it('disables copying when the Clipboard API is unavailable', () => {
    setClipboard(undefined);

    render(<TruncatedId value="job-123" />);

    expect(
      screen.getByRole('button', { name: 'Copy unavailable' }),
    ).toBeDisabled();
  });

  it('shows a failure state when copying is rejected', async () => {
    const writeText = jest.fn().mockRejectedValue(new Error('denied'));
    setClipboard({ writeText } as unknown as Clipboard);

    render(<TruncatedId value="job-123" />);

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Copy to clipboard' }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Copy failed' }),
      ).toBeInTheDocument();
    });
  });
});
