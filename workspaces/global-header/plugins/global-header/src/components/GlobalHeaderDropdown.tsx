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

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import type Button from '@mui/material/Button';

import { useGlobalHeaderMenuItems } from '../extensions/GlobalHeaderContext';
import { buildDropdownEntries } from '../utils/menuItemGrouping';
import { useDropdownManager } from '../hooks';
import { HeaderDropdownComponent } from './HeaderDropdownComponent/HeaderDropdownComponent';
import { GlobalHeaderDropdownContent } from './GlobalHeaderDropdownContent';

/**
 * Settle delays for lazy menu items.
 * Matches the legacy OFS HelpDropdown validity tracking behaviour.
 */
const VALIDITY_CHECK_MS = [500, 1500] as const;

type MenuValidity = 'pending' | 'valid' | 'empty';

/**
 * Props for {@link GlobalHeaderDropdown}.
 *
 * @public
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
   * When enabled, waits for lazy menu items to settle before deciding whether
   * to display the empty state.
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
 * @public
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
  const [menuValidity, setMenuValidity] = useState<MenuValidity>('pending');

  const isOpen = Boolean(anchorEl);

  useEffect(() => {
    if (!trackValidity) {
      return;
    }

    if (!isOpen) {
      setMenuValidity('pending');
      return;
    }

    const list = menuListRef.current;
    if (!list) {
      return;
    }

    const syncFromDom = () => {
      if (list.querySelector('[role="menuitem"]')) {
        setMenuValidity('valid');
      }
    };

    // Handle items that rendered synchronously.
    syncFromDom();

    const observer = new MutationObserver(syncFromDom);

    observer.observe(list, {
      childList: true,
      subtree: true,
    });

    const concludeEmpty = () => {
      if (!list.querySelector('[role="menuitem"]')) {
        setMenuValidity(prev => (prev === 'valid' ? prev : 'empty'));
      }
    };

    const timers = VALIDITY_CHECK_MS.map(ms =>
      window.setTimeout(concludeEmpty, ms),
    );

    // eslint-disable-next-line consistent-return
    return () => {
      observer.disconnect();
      timers.forEach(id => window.clearTimeout(id));
    };
  }, [trackValidity, isOpen]);

  if (menuItems.length === 0 && !emptyState) {
    return null;
  }

  const hasNoContributions = entries.length === 0;

  const showEmptyState =
    hasNoContributions || (trackValidity && menuValidity === 'empty');

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
      {hasNoContributions ? (
        emptyState
      ) : (
        <>
          {/*
           * Keep the menu content mounted while showing the empty state so
           * lazy ExtensionBoundary items can still render and recover.
           * This prevents permanently latching into the empty state if a
           * menu item appears after the initial validity check.
           */}
          <div hidden={trackValidity && showEmptyState}>
            <GlobalHeaderDropdownContent
              entries={entries}
              target={target}
              handleClose={handleClose}
            />
          </div>

          {trackValidity && showEmptyState ? emptyState : null}
        </>
      )}
    </HeaderDropdownComponent>
  );
};
