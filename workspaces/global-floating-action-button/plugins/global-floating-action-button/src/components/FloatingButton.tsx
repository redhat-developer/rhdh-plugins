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
import { FAB } from './FAB';
import { FloatingActionButton, Slot } from '../types';
import { filterAndSortButtons } from '../utils';

const useStyles = makeStyles(theme => ({
  fabContainer: {
    zIndex: 200,
    display: 'flex',
    position: 'fixed',
    gap: '10px',
  },
  'page-end': {
    bottom: theme && Object.keys(theme).length > 0 ? theme?.spacing(2) : '16px',
    right: theme && Object.keys(theme).length > 0 ? theme?.spacing(2) : '16px',
    alignItems: 'end',
  },
  'bottom-left': {
    bottom: theme && Object.keys(theme).length > 0 ? theme?.spacing(2) : '16px',
    paddingLeft:
      theme && Object.keys(theme).length > 0 ? theme?.spacing(2) : '16px',
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
  const { pathname } = useLocation();
  const fabButton = useStyles();
  const [targetElement, setTargetElement] = React.useState<Element | null>(
    null,
  );

  React.useEffect(() => {
    const checkTargetElement = () => {
      const element = document.querySelector('[class^="BackstagePage-root"]');
      if (element) {
        setTargetElement(element);
      } else {
        setTimeout(checkTargetElement);
      }
    };

    checkTargetElement();
  }, [pathname]);

  const fabs = React.useMemo(
    () => filterAndSortButtons(floatingButtons, pathname),
    [floatingButtons, pathname],
  );

  if (fabs?.length === 0) {
    return null;
  }

  if (!targetElement) {
    return null;
  }
  const fabDiv = (
    <div
      className={classnames(fabButton.fabContainer, fabButton[slot])}
      style={{
        flexDirection: 'column-reverse',
      }}
      id="floating-button"
      data-testId="floating-button"
    >
      {fabs.length > 1 ? (
        <FABWithSubmenu fabs={fabs} slot={slot} />
      ) : (
        <FAB actionButton={fabs[0]} />
      )}
    </div>
  );
  return createPortal(fabDiv, targetElement);
};
