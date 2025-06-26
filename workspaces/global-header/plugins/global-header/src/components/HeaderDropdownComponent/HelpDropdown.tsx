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

import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { HeaderDropdownComponent } from './HeaderDropdownComponent';
import { useDropdownManager } from '../../hooks';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useHelpDropdownMountPoints } from '../../hooks/useHelpDropdownMountPoints';
import { MenuSection } from './MenuSection';

/**
 * @public
 * Props for Help Dropdown
 */
export interface HelpDropdownProps {
  layout?: CSSProperties;
}

export const HelpDropdown = ({ layout }: HelpDropdownProps) => {
  const { anchorEl, handleOpen, handleClose } = useDropdownManager();

  const helpDropdownMountPoints = useHelpDropdownMountPoints();

  const menuItems = useMemo(() => {
    return (helpDropdownMountPoints ?? [])
      .map(mp => ({
        Component: mp.Component,
        icon: mp.config?.props?.icon,
        label: mp.config?.props?.title,
        link: mp.config?.props?.link,
        tooltip: mp.config?.props?.tooltip,
        style: mp.config?.style,
        priority: mp.config?.priority ?? 0,
      }))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }, [helpDropdownMountPoints]);

  if (menuItems.length === 0) {
    return null;
  }

  return (
    <HeaderDropdownComponent
      isIconButton
      tooltip="Help"
      buttonContent={<HelpOutlineIcon />}
      buttonProps={{
        color: 'inherit',
        sx: layout,
      }}
      onOpen={handleOpen}
      onClose={handleClose}
      anchorEl={anchorEl}
    >
      <MenuSection hideDivider items={menuItems} handleClose={handleClose} />
    </HeaderDropdownComponent>
  );
};
