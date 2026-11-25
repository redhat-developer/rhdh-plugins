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
    onSettingsClick: jest.fn(),
    setDisplayMode: jest.fn(),
  };

  it('should render without crashing', () => {
    const { container } = render(<LightspeedChatBoxHeader {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should show model selector by default', () => {
    render(<LightspeedChatBoxHeader {...defaultProps} />);
    expect(screen.getByText('GPT-4')).toBeInTheDocument();
  });

  it('should hide model selector when hideModelSelector is true', () => {
    render(<LightspeedChatBoxHeader {...defaultProps} hideModelSelector />);
    expect(screen.queryByText('gpt-4')).not.toBeInTheDocument();
  });

  it('should show Settings menu item when chat tab options are enabled', () => {
    render(<LightspeedChatBoxHeader {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Options'));
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should call onSettingsClick when Settings is clicked', () => {
    const onSettingsClick = jest.fn();
    render(
      <LightspeedChatBoxHeader
        {...defaultProps}
        onSettingsClick={onSettingsClick}
      />,
    );

    fireEvent.click(screen.getByLabelText('Options'));
    fireEvent.click(screen.getByText('Settings'));
    expect(onSettingsClick).toHaveBeenCalledTimes(1);
  });

  it('should hide Settings when showChatTabOptions is false', () => {
    render(
      <LightspeedChatBoxHeader {...defaultProps} showChatTabOptions={false} />,
    );

    fireEvent.click(screen.getByLabelText('Options'));
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    expect(screen.getByText('Display mode')).toBeInTheDocument();
  });

  it('should not show preference toggles in the 3-dots menu', () => {
    render(<LightspeedChatBoxHeader {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('Options'));
    expect(screen.queryByText('Enable pinned chats')).not.toBeInTheDocument();
    expect(screen.queryByText('Disable pinned chats')).not.toBeInTheDocument();
    expect(screen.queryByText('Enable saved prompts')).not.toBeInTheDocument();
    expect(screen.queryByText('Enable screen context')).not.toBeInTheDocument();
  });
});
