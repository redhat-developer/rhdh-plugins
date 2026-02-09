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
import { mockUseTranslation } from '../../test-utils/mockTranslations';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

import { renderInTestApp } from '@backstage/test-utils';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserPromptDialog } from './UserPromptDialog';

describe('UserPromptDialog', () => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render dialog content when closed', async () => {
    await renderInTestApp(
      <UserPromptDialog open={false} onClose={onClose} onConfirm={onConfirm} />,
    );

    // When closed, no visible dialog (MUI may keep dialog in DOM with aria-hidden)
    expect(
      screen.queryByRole('dialog', { hidden: false }),
    ).not.toBeInTheDocument();
  });

  it('renders dialog with title when open', async () => {
    await renderInTestApp(
      <UserPromptDialog open onClose={onClose} onConfirm={onConfirm} />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Run next phase')).toBeInTheDocument();
  });

  it('renders title with phase name when phaseName is provided', async () => {
    await renderInTestApp(
      <UserPromptDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        phaseName="Analyze"
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Run next phase: Analyze')).toBeInTheDocument();
  });

  it('renders moduleName description when moduleName is provided', async () => {
    await renderInTestApp(
      <UserPromptDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        moduleName="my-module"
      />,
    );

    expect(
      screen.getByText(
        'Provide additional requirements before triggering the next phase for the my-module module',
      ),
    ).toBeInTheDocument();
  });

  it('has prompt input and run button', async () => {
    await renderInTestApp(
      <UserPromptDialog open onClose={onClose} onConfirm={onConfirm} />,
    );

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByTestId('user-prompt-input')).toBeInTheDocument();
    expect(within(dialog).getByTestId('user-prompt-run')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    await renderInTestApp(
      <UserPromptDialog open onClose={onClose} onConfirm={onConfirm} />,
    );

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm with empty string and onClose when Run is clicked with no input', async () => {
    const user = userEvent.setup();
    await renderInTestApp(
      <UserPromptDialog open onClose={onClose} onConfirm={onConfirm} />,
    );

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByTestId('user-prompt-run'));

    expect(onConfirm).toHaveBeenCalledWith('');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm with trimmed prompt and onClose when Run is clicked with input', async () => {
    const user = userEvent.setup();
    await renderInTestApp(
      <UserPromptDialog open onClose={onClose} onConfirm={onConfirm} />,
    );

    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByTestId('user-prompt-input');
    await user.type(input, '  my custom prompt  ');
    await user.click(within(dialog).getByTestId('user-prompt-run'));

    expect(onConfirm).toHaveBeenCalledWith('my custom prompt');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not show moduleName text when moduleName is not provided', async () => {
    await renderInTestApp(
      <UserPromptDialog open onClose={onClose} onConfirm={onConfirm} />,
    );

    expect(
      screen.queryByText(/Provide additional requirements before triggering/),
    ).not.toBeInTheDocument();
  });
});
