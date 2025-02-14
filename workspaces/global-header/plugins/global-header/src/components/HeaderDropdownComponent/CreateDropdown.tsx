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

import React, { useMemo } from 'react';

import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';

import { ComponentType } from '../../types';
import { MenuItemConfig } from './MenuSection';
import { useCreateDropdownMountPoints } from '../../hooks/useCreateDropdownMountPoints';
import { useDropdownManager } from '../../hooks';
import { HeaderDropdownComponent } from './HeaderDropdownComponent';

/**
 * @public
 * Props for each dropdown section component
 */
interface SectionComponentProps {
  handleClose: () => void;
  hideDivider: boolean;
  items?: MenuItemConfig[];
}

export const CreateDropdown = () => {
  const { anchorEl, handleOpen, handleClose } = useDropdownManager();

  const createDropdownMountPoints = useCreateDropdownMountPoints();

  const menuSections = useMemo(() => {
    return (createDropdownMountPoints ?? [])
      .map(mp => ({
        Component: mp.Component as React.ComponentType<SectionComponentProps>,
        type: mp.config?.type ?? ComponentType.LINK,
        priority: mp.config?.priority ?? 0,
      }))
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }, [createDropdownMountPoints]);

  if (menuSections.length === 0) {
    return null;
  }

  return (
    <HeaderDropdownComponent
      buttonContent={
        <>
          Create <ArrowDropDownOutlinedIcon sx={{ ml: 1 }} />
        </>
      }
      buttonProps={{
        variant: 'outlined',
        sx: {
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          '&:hover, &.Mui-focusVisible': {
            border: '1px solid #fff',
          },
          mr: 1.5,
        },
      }}
      onOpen={handleOpen}
      onClose={handleClose}
      anchorEl={anchorEl}
    >
      {menuSections.map((section, index) => (
        <section.Component
          key={`menu-section-${index.toString()}`}
          hideDivider={index === menuSections.length - 1}
          handleClose={handleClose}
        />
      ))}
    </HeaderDropdownComponent>
  );
};
