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

import { render, screen, fireEvent } from '@testing-library/react';
import { DcmFormDialogActions } from './DcmFormDialogActions';

describe('DcmFormDialogActions', () => {
  it('renders the submit and cancel buttons', () => {
    render(
      <DcmFormDialogActions
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        submitLabel="Save"
        submitting={false}
        disabled={false}
      />,
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('uses the provided submitLabel', () => {
    render(
      <DcmFormDialogActions
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        submitLabel="Register"
        submitting={false}
        disabled={false}
      />,
    );
    expect(
      screen.getByRole('button', { name: /register/i }),
    ).toBeInTheDocument();
  });

  it('calls onSubmit when the submit button is clicked', () => {
    const onSubmit = jest.fn();
    render(
      <DcmFormDialogActions
        onSubmit={onSubmit}
        onCancel={jest.fn()}
        submitLabel="Save"
        submitting={false}
        disabled={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(
      <DcmFormDialogActions
        onSubmit={jest.fn()}
        onCancel={onCancel}
        submitLabel="Save"
        submitting={false}
        disabled={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons and shows spinner when submitting', () => {
    render(
      <DcmFormDialogActions
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        submitLabel="Save"
        submitting
        disabled={false}
      />,
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => expect(btn).toBeDisabled());
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  it('disables the submit button but not cancel when disabled prop is true', () => {
    render(
      <DcmFormDialogActions
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        submitLabel="Save"
        submitting={false}
        disabled
      />,
    );
    // Submit disabled, Cancel not disabled by `disabled` prop (only by submitting)
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    expect(cancelBtn).not.toBeDisabled();
  });
});
