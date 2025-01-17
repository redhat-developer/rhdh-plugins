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
import { makeStyles } from '@mui/styles';
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import Collapse from '@mui/material/Collapse';
import { FAB } from './FAB';
import { slotOptions } from '../utils';
import { FloatingActionButton, Slot } from '../types';

const useStyles = makeStyles(theme => ({
  button: {
    paddingTop: '10px',
    color:
      theme && Object.keys(theme).length > 0
        ? theme.palette.grey[500]
        : '#9e9e9e',
  },
  menuButtonStyle: {
    color: '#1f1f1f',
  },
}));

export const FABWithSubmenu = ({
  fabs,
  slot,
}: {
  fabs: FloatingActionButton[];
  slot: Slot;
}) => {
  const styles = useStyles();
  const theme = useTheme();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    return () => {
      setIsMenuOpen(false);
    };
  }, [pathname]);

  const handleClick = () => {
    setIsMenuOpen(prev => !prev);
  };
  return (
    <>
      <Tooltip title="Menu" placement={slotOptions[slot].tooltipDirection}>
        <Fab
          size="medium"
          color="info"
          onClick={handleClick}
          aria-label="Menu"
          variant="circular"
          data-testid="fab-with-submenu"
        >
          {isMenuOpen ? (
            <CloseIcon className={styles.menuButtonStyle} />
          ) : (
            <MenuIcon className={styles.menuButtonStyle} />
          )}
        </Fab>
      </Tooltip>
      <Collapse
        style={{ textAlign: slotOptions[slot].textAlign }}
        in={isMenuOpen}
        mountOnEnter
        unmountOnExit
        orientation="vertical"
        easing={{
          enter: theme.transitions.easing.easeOut,
          exit: theme.transitions.easing.sharp,
        }}
      >
        <>
          {fabs?.map(fb => {
            return (
              <FAB
                actionButton={fb}
                size="medium"
                key={fb.label}
                className={styles.button}
              />
            );
          })}
        </>
      </Collapse>
    </>
  );
};
