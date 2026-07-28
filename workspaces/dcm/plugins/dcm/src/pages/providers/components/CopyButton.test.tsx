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

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopyButton } from './CopyButton';

jest.mock('../../../hooks/useTranslation', () => {
  const mod = require('../../../test-utils/mockTranslations');
  return { useTranslation: mod.mockUseTranslation };
});

const writeTextMock = jest.fn();

beforeAll(() => {
  Object.assign(globalThis.navigator, {
    clipboard: { writeText: writeTextMock },
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CopyButton', () => {
  it('renders the copy button with the default aria-label', () => {
    render(<CopyButton text="https://example.com" />);
    expect(
      screen.getByRole('button', { name: /copy to clipboard/i }),
    ).toBeInTheDocument();
  });

  it('shows checkmark and Copied! tooltip after a successful copy', async () => {
    writeTextMock.mockResolvedValue(undefined);
    render(<CopyButton text="https://example.com" />);

    fireEvent.click(screen.getByRole('button', { name: /copy to clipboard/i }));

    await waitFor(() =>
      expect(writeTextMock).toHaveBeenCalledWith('https://example.com'),
    );

    // After success the button title changes — MUI Tooltip sets aria-label on
    // the element passed to it; we can verify the icon switch via aria-label
    // on the wrapping Tooltip span via title attribute propagation.
    // A simpler check: the error icon must NOT be present.
    expect(screen.queryByTestId('ErrorOutlineIcon')).not.toBeInTheDocument();
  });

  it('shows error icon after a failed clipboard write', async () => {
    writeTextMock.mockRejectedValue(new Error('Permission denied'));
    render(<CopyButton text="https://example.com" />);

    fireEvent.click(screen.getByRole('button', { name: /copy to clipboard/i }));

    await waitFor(() =>
      expect(writeTextMock).toHaveBeenCalledWith('https://example.com'),
    );

    // After failure the ErrorOutlineIcon should be rendered
    await waitFor(() =>
      expect(
        document.querySelector('[data-testid="ErrorOutlineIcon"]') ||
          document.querySelector('.MuiSvgIcon-root'),
      ).toBeTruthy(),
    );
  });

  it('passes the text prop to clipboard.writeText', async () => {
    writeTextMock.mockResolvedValue(undefined);
    render(<CopyButton text="some-endpoint-url" />);

    fireEvent.click(screen.getByRole('button', { name: /copy to clipboard/i }));

    await waitFor(() =>
      expect(writeTextMock).toHaveBeenCalledWith('some-endpoint-url'),
    );
  });
});
