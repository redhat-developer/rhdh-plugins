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

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { EditActionDialog, EditActionDialogProps } from './EditActionDialog';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

const renderDialog = (props: Partial<EditActionDialogProps> = {}) => {
  const onConfirm = jest.fn();
  const onClose = jest.fn();
  const view = render(
    <EditActionDialog
      open
      title="Title"
      message="Message"
      confirmLabel="Do it"
      onConfirm={onConfirm}
      onClose={onClose}
      {...props}
    />,
  );
  return { onConfirm, onClose, ...view };
};

describe('EditActionDialog', () => {
  it('shows the title and message', () => {
    renderDialog();

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.queryByTestId('commit-message')).not.toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByText('Title')).not.toBeInTheDocument();
  });

  it('confirms and closes through its buttons', () => {
    const { onConfirm, onClose } = renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Do it' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('with a commit message', () => {
    const commitMessage = { label: 'Commit message', defaultValue: 'Default' };

    it('is prefilled with the default and confirms it', () => {
      const { onConfirm } = renderDialog({ commitMessage });

      expect(screen.getByTestId('commit-message')).toHaveValue('Default');
      fireEvent.click(screen.getByRole('button', { name: 'Do it' }));

      expect(onConfirm).toHaveBeenCalledWith('Default');
    });

    it('confirms the edited, trimmed message', () => {
      const { onConfirm } = renderDialog({ commitMessage });

      fireEvent.change(screen.getByTestId('commit-message'), {
        target: { value: '  Fix typo  ' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Do it' }));

      expect(onConfirm).toHaveBeenCalledWith('Fix typo');
    });

    it.each(['', '   '])('can not confirm a blank message (%p)', blank => {
      const { onConfirm } = renderDialog({ commitMessage });

      fireEvent.change(screen.getByTestId('commit-message'), {
        target: { value: blank },
      });

      const confirm = screen.getByRole('button', { name: 'Do it' });
      expect(confirm).toBeDisabled();
      fireEvent.click(confirm);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('restores the default when reopened', () => {
      const { rerender, onConfirm, onClose } = renderDialog({ commitMessage });
      fireEvent.change(screen.getByTestId('commit-message'), {
        target: { value: 'Edited' },
      });

      rerender(
        <EditActionDialog
          open={false}
          title="Title"
          message="Message"
          confirmLabel="Do it"
          commitMessage={commitMessage}
          onConfirm={onConfirm}
          onClose={onClose}
        />,
      );
      rerender(
        <EditActionDialog
          open
          title="Title"
          message="Message"
          confirmLabel="Do it"
          commitMessage={commitMessage}
          onConfirm={onConfirm}
          onClose={onClose}
        />,
      );

      expect(screen.getByTestId('commit-message')).toHaveValue('Default');
    });
  });

  describe('while busy', () => {
    it('disables the buttons and the commit message', () => {
      const { onConfirm, onClose } = renderDialog({
        isBusy: true,
        commitMessage: { label: 'Commit message', defaultValue: 'Default' },
      });

      expect(screen.getByRole('button', { name: 'Do it' })).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Keep editing' }),
      ).toBeDisabled();
      expect(screen.getByTestId('commit-message')).toBeDisabled();

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
