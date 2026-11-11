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

import { CSSProperties, useCallback } from 'react';
import { Box, Flex, Text } from '@backstage/ui';
import { RiHand } from '@remixicon/react';
import { configApiRef, useApiHolder } from '@backstage/core-plugin-api';

import { useQuickstartDrawerContext } from '../../hooks/useQuickstartDrawerContext';
import { useTranslation } from '../../hooks/useTranslation';
import { QuickstartItemData } from '../../types';
import { filterQuickstartItemsByRole } from '../../utils';

/**
 * Props for the QuickstartButton component
 * @public
 */
export interface QuickstartButtonProps {
  /**
   * The title text to display in the button
   * @defaultValue 'Quick start'
   */
  title?: string;
  /**
   * Custom CSS styles to apply to the button
   */
  style?: CSSProperties;
  /**
   * Optional callback function to execute when the button is clicked
   */
  onClick?: () => void;
}

/**
 * Quickstart button component for the global header help dropdown
 * @public
 */
export const QuickstartButton = ({
  title,
  style,
  onClick = () => {},
}: QuickstartButtonProps) => {
  const { t } = useTranslation();
  const { toggleDrawer, userRole, roleLoading } = useQuickstartDrawerContext();

  const apiHolder = useApiHolder();
  const config = apiHolder.get(configApiRef);
  const quickstartItems: QuickstartItemData[] = config?.has('app.quickstart')
    ? config.get('app.quickstart')
    : [];

  const filteredItems =
    !roleLoading && userRole
      ? filterQuickstartItemsByRole(quickstartItems, userRole)
      : [];

  const defaultTitle = t('button.quickstart');

  const handleClick = useCallback(() => {
    toggleDrawer();
    onClick();
  }, [toggleDrawer, onClick]);

  if (!roleLoading && filteredItems.length === 0) {
    return null;
  }

  return (
    <Box
      role="menuitem"
      tabIndex={0}
      style={{
        display: 'flex',
        width: '100%',
        boxSizing: 'border-box',
        padding: 0,
        border: 'none',
        // Use backgroundColor (not shorthand) so consumer `style` can override it
        backgroundColor: 'transparent',
        color: 'inherit',
        cursor: 'pointer',
        listStyle: 'none',
        ...style,
      }}
      data-testid="quickstart-button"
      onClick={handleClick}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      }}
    >
      <Flex
        align="center"
        justify="between"
        px="4"
        my="2"
        style={{ width: '100%' }}
      >
        <Flex align="center" gap="2">
          <Box
            aria-hidden
            style={{ display: 'flex', color: 'var(--bui-fg-disabled)' }}
          >
            <RiHand size={20} />
          </Box>
          <Text variant="body-small">{title || defaultTitle}</Text>
        </Flex>
      </Flex>
    </Box>
  );
};
