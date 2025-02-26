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
import classnames from 'classnames';

import { useLocation } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';

import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import Slide from '@mui/material/Slide';

import Fade from '@mui/material/Fade';
import { FAB } from './FAB';
import { slotOptions } from '../utils';
import { FloatingActionButton, Slot } from '../types';

const useStyles = makeStyles(theme => ({
  fabContainer: {
    zIndex: 200,
    display: 'flex',
    position: 'fixed',
    alignItems: 'center',
    gap: '10px',
  },
  button: {
    zIndex: 205,
    color:
      theme && Object.keys(theme).length > 0
        ? theme.palette.grey[500]
        : '#9e9e9e',
  },
  menuButtonStyle: {
    color: 'white',
  },
}));

export const FABWithSubmenu = ({
  className,
  fabs,
  slot,
}: {
  fabs: FloatingActionButton[];
  slot: Slot;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLElement>(null);
  const styles = useStyles();
  const fab = useStyles();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [fadeOut, setFadeOut] = React.useState(false);

  React.useEffect(() => {
    return () => {
      setIsMenuOpen(false);
    };
  }, [pathname]);

  const handleClick = () => {
    if (isMenuOpen) {
      setFadeOut(true);
      setTimeout(() => {
        setIsMenuOpen(false);
        setFadeOut(false);
      }, 300);
    } else {
      setIsMenuOpen(true);
    }
  };

  return (
    <Box
      className={classnames(fab.fabContainer, className)}
      sx={{
        flexDirection: 'column-reverse',
      }}
      id="floating-button-with-submenu"
      data-testid="floating-button-with-submenu"
      ref={containerRef}
    >
      <Tooltip title="Menu" placement={slotOptions[slot].tooltipDirection}>
        <Fab
          size="medium"
          color="info"
          onClick={handleClick}
          aria-label="Menu"
          variant="circular"
          sx={{ zIndex: 1000 }}
        >
          {isMenuOpen ? (
            <CloseIcon className={styles.menuButtonStyle} />
          ) : (
            <MenuIcon className={styles.menuButtonStyle} />
          )}
        </Fab>
      </Tooltip>
      {fabs?.map(fb => {
        return (
          <Fade in={isMenuOpen} timeout={{ enter: 500, exit: 1000 }}>
            <Slide
              direction="up"
              container={containerRef.current}
              in={isMenuOpen}
              timeout={{ appear: 1500, enter: 500, exit: 1000 }}
              mountOnEnter
              unmountOnExit
            >
              {/* <FAB
                actionButton={fb}
                size="medium"
                key={fb.label}
                className={styles.button}
              /> */}
              <Fab
                size="small"
                sx={{
                  zIndex: 205,
                }}
              >
                {fb.icon}
              </Fab>
            </Slide>
          </Fade>
        );
      })}
    </Box>
  );
};
