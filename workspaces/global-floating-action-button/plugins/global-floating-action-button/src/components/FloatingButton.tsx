/*
 * Copyright 2025 The Backstage Authors
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
import { FlexDirection, FloatingActionButton, Slot } from '../types';
import { filterAndSortButtons } from '../utils';

const useStyles = makeStyles(theme => ({
  button: {
    zIndex: 200,
    display: 'flex',
    position: 'fixed',
    maxWidth: '150px',
    gap: '10px',
  },
  'page-end': {
    bottom: theme.spacing(4),
    right: theme.spacing(4),
  },
  'bottom-center': {
    bottom: theme.spacing(4),
    left: '50%',
  },
}));

export const FloatingButton = ({
  floatingButtons,
  position,
}: {
  floatingButtons: FloatingActionButton[];
  position: Slot;
}) => {
  const { pathname } = useLocation();
  const subMenuRef = React.useRef<HTMLDivElement>(null);
  const [subMenuDirection, setSubMenuDirection] =
    React.useState<FlexDirection>('column');
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
      className={classnames(fabButton.button, fabButton[position])}
      style={{
        flexDirection: subMenuDirection || 'column-reverse',
      }}
      id="floating-button"
      data-testId="floating-button"
      ref={subMenuRef}
    >
      {fabs.length > 1 ? (
        <FABWithSubmenu fabs={fabs} ref={subMenuRef.current} />
      ) : (
        <FAB actionButton={fabs[0]} />
      )}
    </div>
  );
};
