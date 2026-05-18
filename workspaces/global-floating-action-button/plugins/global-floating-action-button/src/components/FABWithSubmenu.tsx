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

import { useLocation } from 'react-router-dom';
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
import type { SxProps, Theme } from '@mui/material/styles';

export const FABWithSubmenu = ({
  sx: sxProp,
  fabs,
  slot,
}: {
  fabs: FloatingActionButton[];
  slot: Slot;
  sx?: SxProps<Theme>;
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    return () => {
      setIsMenuOpen(false);
    };
  }, [pathname]);

  const handleClick = () => {
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
      sx={[
        {
          zIndex: 200,
          display: 'flex',
          position: 'fixed',
          alignItems: 'center',
          gap: '10px',
          flexDirection: 'column-reverse',
        },
        ...(Array.isArray(sxProp) ? sxProp : [sxProp]),
      ]}
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
            onClick={handleClick}
            aria-label="Menu"
            variant="circular"
            sx={{ zIndex: 1000 }}
          >
            {isMenuOpen ? (
              <CloseIcon sx={{ color: 'white' }} />
            ) : (
              <MenuIcon sx={{ color: 'white' }} />
            )}
          </Fab>
        </Typography>
      </Tooltip>
      {fabs?.map(fb => {
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
              <CustomFab
                actionButton={fb}
                t={t}
                size="medium"
                key={fb.label}
                sx={theme => ({
                  zIndex: 205,
                  color:
                    theme && Object.keys(theme).length > 0
                      ? theme.palette.grey[500]
                      : '#9e9e9e',
                })}
              />
            </Box>
          </Slide>
        );
      })}
    </Box>
  );
};
