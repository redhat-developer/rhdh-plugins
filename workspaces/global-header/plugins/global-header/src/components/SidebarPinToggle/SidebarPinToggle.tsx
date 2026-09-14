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

import { useSidebarPinState } from '@backstage/core-components';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';

import { useTranslation } from '../../hooks/useTranslation';

/**
 * A toolbar button that toggles the sidebar pin state.
 *
 * Hidden on mobile because the sidebar pin mode does not apply there.
 *
 * @public
 */
export const SidebarPinToggle = () => {
  const { isPinned, toggleSidebarPinState, isMobile } = useSidebarPinState();
  const { t } = useTranslation();

  if (isMobile) {
    return null;
  }

  const label = isPinned ? t('sidebar.unpinSidebar') : t('sidebar.pinSidebar');

  return (
    <Tooltip title={label}>
      <IconButton
        onClick={toggleSidebarPinState}
        color="inherit"
        size="small"
        aria-label={label}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};
