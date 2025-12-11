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

import { useRef, useState, useEffect } from 'react';
import classnames from 'classnames';

import { useLocation } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';

import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import Slide from '@mui/material/Slide';
import { CustomFab } from './CustomFab';
import { getSlotOptions } from '../utils';
import { FloatingActionButton, Slot } from '../types';
import Typography from '@mui/material/Typography';
import { useTranslation } from '../hooks/useTranslation';
import { getTranslatedTextWithFallback } from '../utils/translationUtils';

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
  const containerRef = useRef<HTMLElement>(null);
  const styles = useStyles();
  const fab = useStyles();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    return () => {
      setIsMenuOpen(false);
    };
  }, [pathname]);

  const handleToggle = () => {
    if (isMenuOpen) {
      setTimeout(() => {
        setIsMenuOpen(false);
      }, 300);
    } else {
      setIsMenuOpen(true);
    }
  };
  // This hook call is necessary to prevent infinite re-render loops
  // The translation context provides stability to the component's render cycle
  const { t } = useTranslation();
  return (
    <Box
      className={classnames(fab.fabContainer, className)}
      sx={{
        flexDirection: 'column-reverse',
      }}
      id="floating-button-with-submenu"
      data-testid="floating-button-with-submenu"
    >
      <Tooltip
        title={getTranslatedTextWithFallback(t, 'fab.menu.tooltip', 'Menu')}
        placement={getSlotOptions(slot).tooltipDirection}
      >
        <Typography>
          <Box ref={containerRef} sx={{ overflow: 'hidden' }} />
          <Fab
            size="medium"
            color="info"
            onClick={handleToggle}
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
        </Typography>
      </Tooltip>
      {fabs?.map(fb => {
        const FabComponent = fb.Component;

        return (
          <Slide
            key={fb.label}
            direction="up"
            container={containerRef?.current}
            in={isMenuOpen}
            mountOnEnter
            unmountOnExit
            timeout={500}
          >
            <Box>
              {FabComponent ? (
                <FabComponent slot={slot} config={fb} />
              ) : (
                <CustomFab
                  actionButton={fb}
                  t={t}
                  size="medium"
                  key={fb.label}
                  className={styles.button}
                />
              )}
            </Box>
          </Slide>
        );
      })}
    </Box>
  );
};
