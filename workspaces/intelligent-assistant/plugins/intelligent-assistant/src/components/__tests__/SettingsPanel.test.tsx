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
import { SettingsPanel } from '../SettingsPanel';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

jest.mock('../McpServersSettings', () => ({
  McpServersSettings: () => <div data-testid="mcp-servers-settings" />,
}));

jest.mock('../SavedPromptsSettings', () => ({
  SavedPromptsSettings: () => <div data-testid="saved-prompts-settings" />,
}));

describe('SettingsPanel', () => {
  const onTabChange = jest.fn();
  const onClose = jest.fn();

  const defaultProps = {
    activeTab: 'mcp-servers' as const,
    onTabChange,
    onClose,
    isSavedPromptsEnabled: true,
    onEnableSavedPrompts: jest.fn(),
    onApplySavedPromptToInput: jest.fn(),
    onSendSavedPromptDirectly: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render translated settings panel title', () => {
    render(<SettingsPanel {...defaultProps} />);

    expect(
      screen.getByRole('heading', { name: 'Settings' }),
    ).toBeInTheDocument();
  });

  it('should render MCP settings when MCP tab is active', () => {
    render(<SettingsPanel {...defaultProps} activeTab="mcp-servers" />);

    expect(screen.getByTestId('mcp-servers-settings')).toBeInTheDocument();
    expect(
      screen.queryByTestId('saved-prompts-settings'),
    ).not.toBeInTheDocument();
  });

  it('should render saved prompts settings when saved prompts tab is active', () => {
    render(<SettingsPanel {...defaultProps} activeTab="saved-prompts" />);

    expect(screen.getByTestId('saved-prompts-settings')).toBeInTheDocument();
    expect(
      screen.queryByTestId('mcp-servers-settings'),
    ).not.toBeInTheDocument();
  });

  it('should call onTabChange when saved prompts tab is clicked', () => {
    render(<SettingsPanel {...defaultProps} activeTab="mcp-servers" />);

    fireEvent.click(screen.getByRole('button', { name: 'Saved prompts' }));

    expect(onTabChange).toHaveBeenCalledWith('saved-prompts');
  });

  it('should call onClose when close button is clicked', () => {
    render(<SettingsPanel {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close MCP settings' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
