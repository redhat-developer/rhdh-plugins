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
import { DcmDeleteDialog } from './DcmDeleteDialog';

describe('DcmDeleteDialog', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    resourceName: 'my-provider',
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders the resource name in the confirmation message', () => {
    render(<DcmDeleteDialog {...defaultProps} />);
    expect(screen.getByText(/my-provider/i)).toBeInTheDocument();
  });

  it('uses the default resource label "item" in the title', () => {
    render(<DcmDeleteDialog {...defaultProps} />);
    expect(screen.getByText(/delete item/i)).toBeInTheDocument();
  });

  it('uses a custom resource label in the title', () => {
    render(<DcmDeleteDialog {...defaultProps} resourceLabel="provider" />);
    expect(screen.getByText(/delete provider/i)).toBeInTheDocument();
  });

  it('calls onConfirm when the Delete button is clicked', () => {
    render(<DcmDeleteDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the Cancel button is clicked', () => {
    render(<DcmDeleteDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when open is false', () => {
    render(<DcmDeleteDialog {...defaultProps} open={false} />);
    expect(screen.queryByText(/my-provider/i)).not.toBeInTheDocument();
  });
});
