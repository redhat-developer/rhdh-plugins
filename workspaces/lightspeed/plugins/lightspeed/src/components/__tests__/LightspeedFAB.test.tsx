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
import { LightspeedDrawerContext } from '../LightspeedDrawerContext';
import { LightspeedFAB } from '../LightspeedFAB';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

describe('LightspeedFAB', () => {
  const mockToggleChatbot = jest.fn();

  const createContextValue = (overrides = {}) => ({
    isChatbotActive: false,
    toggleChatbot: mockToggleChatbot,
    displayMode: ChatbotDisplayMode.default,
    setDisplayMode: jest.fn(),
    drawerWidth: 500,
    setDrawerWidth: jest.fn(),
    currentConversationId: undefined,
    setCurrentConversationId: jest.fn(),
    ...overrides,
  });

  const renderWithContext = (
    contextValue: ReturnType<typeof createContextValue>,
  ) => {
    return render(
      <LightspeedDrawerContext.Provider value={contextValue}>
        <LightspeedFAB />
      </LightspeedDrawerContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render FAB button when displayMode is overlay', () => {
    renderWithContext(
      createContextValue({
        displayMode: ChatbotDisplayMode.default,
      }),
    );

    expect(screen.getByTestId('lightspeed-fab')).toBeInTheDocument();
    expect(screen.getByLabelText('lightspeed-close')).toBeInTheDocument();
  });

  it('should render FAB button when displayMode is docked', () => {
    renderWithContext(
      createContextValue({
        displayMode: ChatbotDisplayMode.docked,
      }),
    );

    expect(screen.getByTestId('lightspeed-fab')).toBeInTheDocument();
    expect(screen.getByLabelText('lightspeed-close')).toBeInTheDocument();
  });

  it('should not render FAB button when displayMode is embedded', () => {
    renderWithContext(
      createContextValue({
        displayMode: ChatbotDisplayMode.embedded,
      }),
    );

    expect(screen.queryByTestId('lightspeed-fab')).not.toBeInTheDocument();
  });

  it('should call toggleChatbot when FAB button is clicked', () => {
    renderWithContext(
      createContextValue({
        displayMode: ChatbotDisplayMode.default,
      }),
    );

    const fabButton = screen.getByLabelText('lightspeed-close');
    fireEvent.click(fabButton);

    expect(mockToggleChatbot).toHaveBeenCalledTimes(1);
  });

  it('should show close icon when chatbot is active', () => {
    renderWithContext(
      createContextValue({
        isChatbotActive: true,
        displayMode: ChatbotDisplayMode.default,
      }),
    );

    expect(screen.getByTestId('CloseIcon')).toBeInTheDocument();
  });

  it('should show LightspeedFABIcon when chatbot is not active', () => {
    renderWithContext(
      createContextValue({
        isChatbotActive: false,
        displayMode: ChatbotDisplayMode.default,
      }),
    );

    expect(screen.getByTestId('lightspeed-fab-icon')).toBeInTheDocument();
  });

  it('should not render when displayMode is fullscreen', () => {
    renderWithContext(
      createContextValue({
        displayMode: ChatbotDisplayMode.fullscreen,
      }),
    );

    expect(screen.getByTestId('lightspeed-fab')).toBeInTheDocument();
  });
});
