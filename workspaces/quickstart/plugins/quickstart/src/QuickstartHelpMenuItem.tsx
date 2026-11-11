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

import { useAppDrawer } from '@red-hat-developer-hub/backstage-plugin-app-react';

import { QuickstartMenuItemLayout } from './components/QuickstartMenuItemLayout';
import { QUICKSTART_DRAWER_ID } from './const';
import { useTranslation } from './hooks/useTranslation';

/**
 * Help-dropdown menu item that toggles the Quick start drawer.
 *
 * Uses a local menu-item control styled like global-header dropdown entries so
 * this module does not bundle `global-header/components` (and its
 * `@backstage/core-components` transitive deps) into the quickstart MF graph.
 * The help menu blueprint `loader` still defers fetching until the dropdown
 * opens.
 */
export const QuickstartHelpMenuItem = ({
  handleClose,
}: {
  handleClose?: () => void;
}) => {
  const { t } = useTranslation();
  const { toggleDrawer } = useAppDrawer();

  return (
    <QuickstartMenuItemLayout
      as="li"
      label={t('button.quickstart')}
      onActivate={() => {
        toggleDrawer(QUICKSTART_DRAWER_ID);
        handleClose?.();
      }}
    />
  );
};
