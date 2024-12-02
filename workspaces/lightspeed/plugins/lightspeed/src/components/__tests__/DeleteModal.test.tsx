/*
 * Copyright 2024 The Backstage Authors
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
import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { DeleteModal } from '../DeleteModal';

describe('DeleteModal', () => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should render the modal with correct content when open', () => {
    render(<DeleteModal isOpen onClose={onClose} onConfirm={onConfirm} />);

    expect(screen.getByText('Delete chat?')).toBeInTheDocument();
    expect(
      screen.getByText(
        "You'll no longer see this chat here. This will also delete related activity like prompts, responses, and feedback from your Lightspeed Activity.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('should not render when isOpen is false', () => {
    render(
      <DeleteModal isOpen={false} onClose={onClose} onConfirm={onConfirm} />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('should call onClose when the cancel button is clicked', () => {
    render(<DeleteModal isOpen onClose={onClose} onConfirm={onConfirm} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('should call onConfirm when the delete button is clicked', () => {
    render(<DeleteModal isOpen onClose={onClose} onConfirm={onConfirm} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
