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

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import classnames from 'classnames';

import { makeStyles } from '@mui/styles';
import { FABWithSubmenu } from './FABWithSubmenu';
import { CustomFab } from './CustomFab';
import { FloatingActionButton, Slot } from '../types';
import { filterAndSortButtons } from '../utils';

const useStyles = makeStyles(theme => ({
  fabButton: {
    zIndex: 200,
    display: 'flex',
    position: 'fixed',
  },
  'page-end': {
    bottom: theme?.spacing?.(2) ?? '16px',
    right: theme?.spacing?.(2) ?? '16px',
    alignItems: 'end',
  },
  'bottom-left': {
    bottom: theme?.spacing?.(2) ?? '16px',
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
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const { pathname } = useLocation();
  const fabButton = useStyles();
  const [targetElement, setTargetElement] = React.useState<Element | null>(
    null,
  );

  React.useEffect(() => {
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

  const fabs = React.useMemo(
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
    fabDiv = (
      <div
        className={classnames(fabButton.fabButton, fabButton[slot])}
        id="floating-button"
        data-testid="floating-button"
      >
        <CustomFab
          actionButton={{ color: 'info', iconColor: 'white', ...fabs[0] }}
        />
      </div>
    );
  }
  return targetElement
    ? createPortal(fabDiv, targetElement)
    : createPortal(fabDiv, document.body);
};
