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
import { configApiRef, useApiHolder } from '@backstage/core-plugin-api';

import { QuickstartMenuItemLayout } from '../QuickstartMenuItemLayout';
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

  const handleClick = useCallback(() => {
    toggleDrawer();
    onClick();
  }, [toggleDrawer, onClick]);

  if (!roleLoading && filteredItems.length === 0) {
    return null;
  }

  return (
    <QuickstartMenuItemLayout
      label={title || t('button.quickstart')}
      onActivate={handleClick}
      style={style}
      data-testid="quickstart-button"
    />
  );
};
