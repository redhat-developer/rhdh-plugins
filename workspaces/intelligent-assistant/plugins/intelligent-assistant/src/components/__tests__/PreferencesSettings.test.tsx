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
import { PreferencesSettings } from '../PreferencesSettings';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

describe('PreferencesSettings', () => {
  const defaultProps = {
    isPinningChatsEnabled: true,
    onPinnedChatsToggle: jest.fn(),
    isSavedPromptsEnabled: true,
    onSavedPromptsToggle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders pinned chats and saved prompts switches', () => {
    render(<PreferencesSettings {...defaultProps} />);

    expect(screen.getByText('Pinned chats')).toBeInTheDocument();
    expect(screen.getByText('Saved prompts')).toBeInTheDocument();
    expect(screen.queryByText('Screen context')).not.toBeInTheDocument();
  });

  it('toggles pinned chats and saved prompts', () => {
    render(<PreferencesSettings {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Pinned chats'));
    expect(defaultProps.onPinnedChatsToggle).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByLabelText('Saved prompts'));
    expect(defaultProps.onSavedPromptsToggle).toHaveBeenCalledWith(false);
  });

  it('shows and toggles screen context when admin enabled', () => {
    const onScreenContextSharingToggle = jest.fn();
    render(
      <PreferencesSettings
        {...defaultProps}
        screenContextAdminEnabled
        isScreenContextSharingEnabled={false}
        onScreenContextSharingToggle={onScreenContextSharingToggle}
      />,
    );

    expect(screen.getByText('Screen context')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Screen context'));
    expect(onScreenContextSharingToggle).toHaveBeenCalledWith(true);
  });
});
