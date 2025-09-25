/*
 * Copyright The Backstage Authors
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

import { useState, useLayoutEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

import { ErrorBoundary } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';

import { MarketplacePackageContentLoader } from './MarketplacePackageContent';

export const MarketplacePackageDrawer = () => {
  const [open, setOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  useLayoutEffect(() => {
    setOpen(!!searchParams.get('package'));
  }, [searchParams]);

  const navigate = useNavigate();
  const theme = useTheme();
  const handleClose = () => {
    setOpen(false);
    const params = new URLSearchParams(location.search);
    params.delete('package');
    const qs = params.toString();
    const target = qs ? `${location.pathname}?${qs}` : location.pathname;
    setTimeout(
      () => navigate(target),
      theme.transitions.duration.leavingScreen,
    );
  };

  return (
    <Drawer
      open={open}
      anchor="right"
      onClose={handleClose}
      PaperProps={{ sx: { minWidth: '300px', width: '55vw' } }}
    >
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          color: 'grey.500',
        }}
      >
        <CloseIcon />
      </IconButton>
      <ErrorBoundary>
        <Box sx={{ '> article': { backgroundColor: 'transparent' } }}>
          <MarketplacePackageContentLoader />
        </Box>
      </ErrorBoundary>
    </Drawer>
  );
};
