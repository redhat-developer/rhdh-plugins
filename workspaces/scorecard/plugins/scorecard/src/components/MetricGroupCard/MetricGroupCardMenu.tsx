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

import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export interface MenuAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface MetricGroupCardMenuProps {
  ariaLabel: string;
  actions: MenuAction[];
}

export const MetricGroupCardMenu = ({
  ariaLabel,
  actions,
}: MetricGroupCardMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = useCallback(
    (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget),
    [],
  );

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleAction = useCallback(
    (action: MenuAction) => () => {
      handleClose();
      action.onClick();
    },
    [handleClose],
  );

  if (actions.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', pr: 2 }}>
      <IconButton size="small" onClick={handleOpen} aria-label={ariaLabel}>
        <MoreVertIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: { borderRadius: 2, minWidth: 200 },
          },
        }}
      >
        {actions.map(action => (
          <MenuItem
            key={action.id}
            onClick={handleAction(action)}
            disableRipple
            sx={{
              py: 1.5,
              '&:hover': { backgroundColor: 'action.hover' },
              '&.Mui-focusVisible': { backgroundColor: 'transparent' },
            }}
          >
            <ListItemIcon>{action.icon}</ListItemIcon>
            <ListItemText primary={action.label} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};
