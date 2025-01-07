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
    bottom: theme.spacing(2),
    right: theme.spacing(2),
    alignItems: 'end',
  },
  'bottom-left': {
    bottom: theme.spacing(2),
    paddingLeft: theme.spacing(2),
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
  const [subMenuDirection, setSubMenuDirection] = React.useState<
    'column' | 'column-reverse'
  >('column');
  const fabButton = useStyles();

  React.useEffect(() => {
    const floatingButtonElement = document.getElementById('floating-button');
    const screenHeight = window.innerHeight;
    if (floatingButtonElement) {
      const { top } = floatingButtonElement?.getBoundingClientRect();
      if (top < screenHeight / 2) {
        setSubMenuDirection('column');
      } else {
        setSubMenuDirection('column-reverse');
      }
    }
  }, [pathname]);

  const fabs = React.useMemo(
    () => filterAndSortButtons(floatingButtons, pathname),
    [floatingButtons, pathname],
  );

  if (fabs?.length === 0) {
    return null;
  }
  return (
    <div
      className={classnames(fabButton.fabContainer, fabButton[slot])}
      style={{
        flexDirection: subMenuDirection,
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
};
