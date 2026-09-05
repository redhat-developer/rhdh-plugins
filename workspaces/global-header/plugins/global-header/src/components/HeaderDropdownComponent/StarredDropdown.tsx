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

import { lazy, Suspense } from 'react';
import { AppIcon } from '@backstage/core-components';
import StarBorderIcon from '@mui/icons-material/StarBorder';

import { useDropdownManager } from '../../hooks';
import { HEADER_TOOLBAR_ICON_SIZE } from '../../icons/headerToolbarIcon';
import { HeaderDropdownComponent } from './HeaderDropdownComponent';
import { useTranslation } from '../../hooks/useTranslation';

const StarredDropdownMenu = lazy(() =>
  import(
    /* webpackChunkName: "global-header-starred-menu" */ './StarredDropdownMenu'
  ).then(m => ({
    default: m.StarredDropdownMenu,
  })),
);

export const StarredDropdown = () => {
  const { anchorEl, handleOpen, handleClose } = useDropdownManager();
  const { t } = useTranslation();
  const isOpen = Boolean(anchorEl);

  return (
    <HeaderDropdownComponent
      buttonContent={
        <AppIcon
          id="unstarred"
          Fallback={StarBorderIcon}
          fontSize={HEADER_TOOLBAR_ICON_SIZE}
        />
      }
      onOpen={handleOpen}
      onClose={handleClose}
      anchorEl={anchorEl}
      tooltip={t('starred.title')}
      isIconButton
    >
      {isOpen ? (
        <Suspense fallback={null}>
          <StarredDropdownMenu handleClose={handleClose} />
        </Suspense>
      ) : null}
    </HeaderDropdownComponent>
  );
};
