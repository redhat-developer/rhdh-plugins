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

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import type Button from '@mui/material/Button';

import { useGlobalHeaderMenuItems } from '../extensions/GlobalHeaderContext';
import { buildDropdownEntries } from '../utils/menuItemGrouping';
import { useDropdownManager } from '../../hooks';
import { HeaderDropdownComponent } from '../../components/HeaderDropdownComponent/HeaderDropdownComponent';
import { GlobalHeaderDropdownContent } from './GlobalHeaderDropdownContent';

/**
 * Props for {@link GlobalHeaderDropdown}.
 *
 * @alpha
 */
export interface GlobalHeaderDropdownProps {
  /** Extension target name that items are collected from (e.g. `'help'`, `'create'`). */
  target: string;
  /** Content rendered inside the trigger button. */
  buttonContent: ReactNode;
  /** MUI Button props forwarded to the trigger. */
  buttonProps?: ComponentProps<typeof Button>;
  /** Render an `IconButton` instead of a regular `Button`. */
  isIconButton?: boolean;
  /** Tooltip shown on hover of the trigger button. */
  tooltip?: string;
  /** Rendered when no menu items are contributed (or all render empty when `trackValidity` is on). */
  emptyState?: ReactNode;
  /**
   * When `true`, the dropdown checks the rendered MenuList for visible
   * `[role="menuitem"]` elements after each render. If none are found,
   * the `emptyState` is shown instead.
   */
  trackValidity?: boolean;
}

/**
 * High-level dropdown building block for the global header.
 *
 * Collects menu items from a named extension `target`, groups them
 * by section, sorts by priority, and renders them inside a
 * `HeaderDropdownComponent`.
 *
 * @alpha
 */
export const GlobalHeaderDropdown = ({
  target,
  buttonContent,
  buttonProps,
  isIconButton,
  tooltip,
  emptyState,
  trackValidity = false,
}: GlobalHeaderDropdownProps) => {
  const { anchorEl, handleOpen, handleClose } = useDropdownManager();
  const menuItems = useGlobalHeaderMenuItems(target);
  const entries = useMemo(() => buildDropdownEntries(menuItems), [menuItems]);

  const menuListRef = useRef<HTMLUListElement>(null);
  const [hasVisibleItems, setHasVisibleItems] = useState(true);
  const isOpen = Boolean(anchorEl);

  useLayoutEffect(() => {
    if (!trackValidity || !isOpen || !menuListRef.current) return;
    const found =
      menuListRef.current.querySelector('[role="menuitem"]') !== null;
    if (found !== hasVisibleItems) {
      setHasVisibleItems(found);
    }
  }, [trackValidity, hasVisibleItems, isOpen]);

  if (menuItems.length === 0 && !emptyState) return null;

  const showEmpty = entries.length === 0 || (trackValidity && !hasVisibleItems);

  return (
    <HeaderDropdownComponent
      buttonContent={buttonContent}
      buttonProps={buttonProps}
      isIconButton={isIconButton}
      tooltip={tooltip}
      onOpen={handleOpen}
      onClose={handleClose}
      anchorEl={anchorEl}
      menuListRef={trackValidity ? menuListRef : undefined}
    >
      {showEmpty ? (
        emptyState
      ) : (
        <GlobalHeaderDropdownContent
          entries={entries}
          target={target}
          handleClose={handleClose}
        />
      )}
    </HeaderDropdownComponent>
  );
};
