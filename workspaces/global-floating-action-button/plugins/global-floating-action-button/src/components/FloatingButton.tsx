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

import { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';

import { makeStyles } from '@mui/styles';
import { FABWithSubmenu } from './FABWithSubmenu';
import { CustomFab } from './CustomFab';
import { FloatingActionButton, Slot } from '../types';
import { filterAndSortButtons } from '../utils';
import { useTranslation } from '../hooks/useTranslation';

const useStyles = makeStyles(theme => ({
  'page-end': {
    bottom: `calc(${theme?.spacing?.(2) ?? '16px'} + 1.5em)`,
    right: `calc(${theme?.spacing?.(2) ?? '16px'} + 1.5em)`,
    alignItems: 'end',

    // When quickstart drawer is open, adjust margin
    '.quickstart-drawer-open &': {
      transition: 'margin-right 0.3s ease',
      marginRight: 'var(--quickstart-drawer-width, 500px) ',
    },
  },
  'bottom-left': {
    bottom: `calc(${theme?.spacing?.(2) ?? '16px'} + 1.5em)`,
    paddingLeft: theme?.spacing?.(2) ?? '16px',
    alignItems: 'start',
  },
}));

export const FloatingButton = ({
  floatingButtons,
  slot,
}: {
  floatingButtons: FloatingActionButton[];
  slot: Slot;
}) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { pathname } = useLocation();
  const fabButton = useStyles();
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const checkTargetElement = () => {
      const element =
        document.querySelector('[class^="BackstagePage-root"]') ??
        document.querySelector('main');
      if (element) {
        setTargetElement(element);
      } else {
        timeoutRef.current = setTimeout(checkTargetElement, 300);
      }
    };
    checkTargetElement();
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [pathname, targetElement]);

  const fabs = useMemo(
    () => filterAndSortButtons(floatingButtons, pathname),
    [floatingButtons, pathname],
  );

  if (fabs?.length === 0) {
    return null;
  }

  let fabDiv;
  if (fabs.length > 1) {
    fabDiv = (
      <FABWithSubmenu className={fabButton[slot]} fabs={fabs} slot={slot} />
    );
  } else {
    const singleFab = fabs[0];
    const FabComponent = singleFab.Component;

    // If a custom FAB component is provided, render it instead of CustomFab
    fabDiv = (
      <div
        style={{
          zIndex: 200,
          display: 'flex',
          position: 'fixed',
        }}
        className={fabButton[slot]}
        id="floating-button"
        data-testid="floating-button"
      >
        {FabComponent ? (
          <FabComponent slot={slot} config={singleFab} />
        ) : (
          <CustomFab
            actionButton={{ color: 'info', iconColor: 'white', ...singleFab }}
            t={t}
          />
        )}
      </div>
    );
  }
  return targetElement
    ? createPortal(fabDiv, targetElement)
    : createPortal(fabDiv, document.body);
};
