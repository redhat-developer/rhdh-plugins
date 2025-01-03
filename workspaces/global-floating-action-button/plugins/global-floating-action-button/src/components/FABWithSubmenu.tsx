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
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import Slide from '@mui/material/Slide';
import { FloatingActionButton } from '../types';
import { FAB } from './FAB';

export const FABWithSubmenu = ({
  fabs,
  ref,
}: {
  fabs: FloatingActionButton[];
  ref: HTMLDivElement | null;
}) => {
  const theme = useTheme();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    return () => {
      setIsMenuOpen(false);
    };
  }, [pathname]);

  const handleClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  return (
    <>
      <Tooltip title="Menu" placement="left">
        <Fab
          size="medium"
          color="default"
          onClick={handleClick}
          aria-label="Menu"
          variant="circular"
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </Fab>
      </Tooltip>
      {isMenuOpen && (
        <Slide
          container={ref}
          easing={{
            enter: theme.transitions.easing.easeOut,
            exit: theme.transitions.easing.sharp,
          }}
        >
          <>
            {fabs?.map(fb => {
              return <FAB actionButton={fb} size="medium" key={fb.label} />;
            })}
          </>
        </Slide>
      )}
    </>
  );
};
