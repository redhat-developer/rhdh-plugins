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
import { DeleteSavedPromptModal } from '../DeleteSavedPromptModal';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

describe('DeleteSavedPromptModal', () => {
  const defaultProps = {
    isOpen: true,
    promptName: 'Performance Optimization',
    isDeleting: false,
    error: null,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render confirmation title and message', () => {
    render(<DeleteSavedPromptModal {...defaultProps} />);
    expect(
      screen.getByText("Delete 'Performance Optimization'?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText('This saved prompt will be permanently removed.'),
    ).toBeInTheDocument();
  });

  it('should call onConfirm when Delete is clicked', () => {
    render(<DeleteSavedPromptModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('should call onClose when Cancel is clicked', () => {
    render(<DeleteSavedPromptModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should not render when closed', () => {
    render(<DeleteSavedPromptModal {...defaultProps} isOpen={false} />);
    expect(
      screen.queryByText("Delete 'Performance Optimization'?"),
    ).not.toBeInTheDocument();
  });
});
