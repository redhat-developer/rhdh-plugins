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
import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { fireEvent, render, screen } from '@testing-library/react';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { LightspeedChatBoxHeader } from '../LightspeedChatBoxHeader';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

describe('LightspeedChatBoxHeader', () => {
  const defaultProps = {
    displayMode: ChatbotDisplayMode.default,
    selectedModel: 'gpt-4',
    handleSelectedModel: jest.fn(),
    models: [{ label: 'GPT-4', value: 'gpt-4', provider: 'openai' }],
    isPinningChatsEnabled: true,
    onPinnedChatsToggle: jest.fn(),
    isSavedPromptsEnabled: true,
    onSavedPromptsToggle: jest.fn(),
    onMcpSettingsClick: jest.fn(),
    setDisplayMode: jest.fn(),
  };

  it('should render without crashing', () => {
    const { container } = render(<LightspeedChatBoxHeader {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should show model selector by default', () => {
    render(<LightspeedChatBoxHeader {...defaultProps} />);
    expect(screen.getByText('gpt-4')).toBeInTheDocument();
  });

  it('should hide model selector when hideModelSelector is true', () => {
    render(<LightspeedChatBoxHeader {...defaultProps} hideModelSelector />);
    expect(screen.queryByText('gpt-4')).not.toBeInTheDocument();
  });

  it('should accept isSavedPromptsEnabled prop without error', () => {
    expect(() =>
      render(
        <LightspeedChatBoxHeader
          {...defaultProps}
          isSavedPromptsEnabled={false}
        />,
      ),
    ).not.toThrow();
  });

  it('should accept onSavedPromptsToggle prop without error', () => {
    const toggleFn = jest.fn();
    expect(() =>
      render(
        <LightspeedChatBoxHeader
          {...defaultProps}
          onSavedPromptsToggle={toggleFn}
        />,
      ),
    ).not.toThrow();
  });

  it('should show MCP and Prompt Settings when showMcpSettings is true', () => {
    render(<LightspeedChatBoxHeader {...defaultProps} showMcpSettings />);

    fireEvent.click(screen.getByLabelText('Options'));
    expect(screen.getByText('MCP and Prompt Settings')).toBeInTheDocument();
  });

  it('should show Prompt Settings when showMcpSettings is false', () => {
    render(
      <LightspeedChatBoxHeader {...defaultProps} showMcpSettings={false} />,
    );

    fireEvent.click(screen.getByLabelText('Options'));
    expect(screen.getByText('Prompt Settings')).toBeInTheDocument();
    expect(
      screen.queryByText('MCP and Prompt Settings'),
    ).not.toBeInTheDocument();
  });

  it('hides screen context kebab items when admin flag is off', () => {
    render(
      <LightspeedChatBoxHeader
        {...defaultProps}
        screenContextAdminEnabled={false}
      />,
    );

    fireEvent.click(screen.getByLabelText('Options'));
    expect(screen.queryByText('Enable screen context')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Disable screen context'),
    ).not.toBeInTheDocument();
  });

  it('shows Enable screen context when admin on and sharing off', () => {
    const onToggle = jest.fn();
    render(
      <LightspeedChatBoxHeader
        {...defaultProps}
        screenContextAdminEnabled
        isScreenContextSharingEnabled={false}
        onScreenContextSharingToggle={onToggle}
      />,
    );

    fireEvent.click(screen.getByLabelText('Options'));
    fireEvent.click(screen.getByText('Enable screen context'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('shows Disable screen context when admin on and sharing on', () => {
    const onToggle = jest.fn();
    render(
      <LightspeedChatBoxHeader
        {...defaultProps}
        screenContextAdminEnabled
        isScreenContextSharingEnabled
        onScreenContextSharingToggle={onToggle}
      />,
    );

    fireEvent.click(screen.getByLabelText('Options'));
    fireEvent.click(screen.getByText('Disable screen context'));
    expect(onToggle).toHaveBeenCalledWith(false);
  });
});
