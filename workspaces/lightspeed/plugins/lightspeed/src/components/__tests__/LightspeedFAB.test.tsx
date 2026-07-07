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

import { useLightspeedDrawer } from '../../hooks/useLightspeedDrawer';
import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { LightspeedFAB } from '../LightspeedFAB';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

jest.mock('../../hooks/useLightspeedDrawer', () => ({
  useLightspeedDrawer: jest.fn(),
}));

const mockUseLightspeedDrawer = useLightspeedDrawer as jest.MockedFunction<
  typeof useLightspeedDrawer
>;

describe('LightspeedFAB', () => {
  const mockToggleChatbot = jest.fn();

  const createMockReturn = (overrides = {}) => ({
    isChatbotActive: false,
    toggleChatbot: mockToggleChatbot,
    displayMode: ChatbotDisplayMode.default,
    setDisplayMode: jest.fn(),
    drawerWidth: 500,
    setDrawerWidth: jest.fn(),
    currentConversationId: undefined,
    setCurrentConversationId: jest.fn(),
    draftMessage: '',
    setDraftMessage: jest.fn(),
    draftFileContents: [],
    setDraftFileContents: jest.fn(),
    consumePendingOverlayThreadHandoff: jest.fn(() => false),
    shellViewTab: 0,
    setShellViewTab: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLightspeedDrawer.mockReturnValue(createMockReturn());
  });

  it('should render FAB button when displayMode is overlay', () => {
    mockUseLightspeedDrawer.mockReturnValue(
      createMockReturn({ displayMode: ChatbotDisplayMode.default }),
    );
    render(<LightspeedFAB />);

    expect(screen.getByTestId('lightspeed-fab')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Open intelligent assistant'),
    ).toBeInTheDocument();
  });

  it('should render FAB button when displayMode is docked', () => {
    mockUseLightspeedDrawer.mockReturnValue(
      createMockReturn({ displayMode: ChatbotDisplayMode.docked }),
    );
    render(<LightspeedFAB />);

    expect(screen.getByTestId('lightspeed-fab')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Open intelligent assistant'),
    ).toBeInTheDocument();
  });

  it('should not render FAB button when displayMode is embedded', () => {
    mockUseLightspeedDrawer.mockReturnValue(
      createMockReturn({ displayMode: ChatbotDisplayMode.embedded }),
    );
    render(<LightspeedFAB />);

    expect(screen.queryByTestId('lightspeed-fab')).not.toBeInTheDocument();
  });

  it('should call toggleChatbot when FAB button is clicked', () => {
    mockUseLightspeedDrawer.mockReturnValue(
      createMockReturn({ displayMode: ChatbotDisplayMode.default }),
    );
    render(<LightspeedFAB />);

    const fabButton = screen.getByLabelText('Open intelligent assistant');
    fireEvent.click(fabButton);

    expect(mockToggleChatbot).toHaveBeenCalledTimes(1);
  });

  it('should show chevron-down icon when chatbot is active', () => {
    mockUseLightspeedDrawer.mockReturnValue(
      createMockReturn({
        isChatbotActive: true,
        displayMode: ChatbotDisplayMode.default,
      }),
    );
    render(<LightspeedFAB />);

    expect(screen.getByTestId('lightspeed-fab-open-icon')).toBeInTheDocument();
  });

  it('should show LightspeedFABIcon when chatbot is not active', () => {
    mockUseLightspeedDrawer.mockReturnValue(
      createMockReturn({
        isChatbotActive: false,
        displayMode: ChatbotDisplayMode.default,
      }),
    );
    render(<LightspeedFAB />);

    expect(screen.getByTestId('lightspeed-fab-icon')).toBeInTheDocument();
  });

  it('should not render when displayMode is fullscreen', () => {
    mockUseLightspeedDrawer.mockReturnValue(
      createMockReturn({ displayMode: ChatbotDisplayMode.fullscreen }),
    );
    render(<LightspeedFAB />);

    expect(screen.getByTestId('lightspeed-fab')).toBeInTheDocument();
  });
});
