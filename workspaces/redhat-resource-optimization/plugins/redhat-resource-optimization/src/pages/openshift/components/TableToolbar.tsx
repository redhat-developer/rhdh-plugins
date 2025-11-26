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

import React, { useState } from 'react';
import {
  Switch,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Box,
} from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import ViewWeekIcon from '@material-ui/icons/ViewWeek';
import GraySvgIcon from './grey-csv-icon.svg';

const useStyles = makeStyles({
  switchOff: {
    '& .MuiSwitch-thumb': {
      backgroundColor: '#6A6E73',
    },
    '& .MuiSwitch-track': {
      backgroundColor: '#6A6E73',
    },
  },
  menuItem: {
    padding: '12px 16px',
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
  menuItemLabel: {
    marginLeft: 0,
    marginRight: 0,
    width: '100%',
  },
  menuItemDescription: {
    fontSize: '0.75rem',
    color: '#6A6E73',
    marginTop: '4px',
    marginLeft: '32px',
  },
});

type TableToolbarProps = {
  showPlatformSum: boolean;
  setShowPlatformSum: (showPlatformSum: boolean) => void;
  projectsCount: number;
  groupBy: string;
  showMonthOverMonthChange: boolean;
  setShowMonthOverMonthChange: (show: boolean) => void;
  showInfrastructureCost: boolean;
  setShowInfrastructureCost: (show: boolean) => void;
  showSupplementaryCost: boolean;
  setShowSupplementaryCost: (show: boolean) => void;
};

/** @public */
export function TableToolbar(props: TableToolbarProps) {
  const {
    showPlatformSum,
    setShowPlatformSum,
    projectsCount,
    groupBy,
    showMonthOverMonthChange,
    setShowMonthOverMonthChange,
    showInfrastructureCost,
    setShowInfrastructureCost,
    showSupplementaryCost,
    setShowSupplementaryCost,
  } = props;
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getTableTitle = (groupByValue: string): string => {
    const titleMap: Record<string, string> = {
      project: 'Projects',
      cluster: 'Clusters',
      node: 'Nodes',
      tag: 'Tags',
    };
    return titleMap[groupByValue] || 'Projects';
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: 48,
        }}
      >
        <Typography variant="h2" style={{ fontWeight: 'bold' }}>
          {getTableTitle(groupBy)} ({projectsCount})
        </Typography>

        {groupBy === 'project' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Switch
              checked={showPlatformSum}
              onChange={e => setShowPlatformSum(e.target.checked)}
              className={classes.switchOff}
            />
            <Typography variant="body2" style={{ color: '#6A6E73' }}>
              Sum platform costs
            </Typography>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <img src={GraySvgIcon} alt="CSV" style={{ cursor: 'pointer' }} />
        </div>
      </div>
      <IconButton
        aria-label="menu"
        style={{ color: '#6A6E73', padding: '8px' }}
        onClick={handleMenuOpen}
      >
        <ViewWeekIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          style: {
            minWidth: '300px',
            padding: '8px 0',
          },
        }}
      >
        <Box px={2} py={1}>
          <Typography variant="subtitle2" style={{ fontWeight: 'bold' }}>
            Add or remove columns
          </Typography>
        </Box>
        <MenuItem
          className={classes.menuItem}
          onClick={e => {
            e.stopPropagation();
            setShowMonthOverMonthChange(!showMonthOverMonthChange);
          }}
        >
          <FormControlLabel
            className={classes.menuItemLabel}
            control={
              <Checkbox
                checked={showMonthOverMonthChange}
                onChange={e => {
                  e.stopPropagation();
                  setShowMonthOverMonthChange(e.target.checked);
                }}
                onClick={e => e.stopPropagation()}
              />
            }
            label="Month over month change"
            onClick={e => e.stopPropagation()}
          />
        </MenuItem>
        <MenuItem
          className={classes.menuItem}
          onClick={e => {
            e.stopPropagation();
            setShowInfrastructureCost(!showInfrastructureCost);
          }}
        >
          <Box>
            <FormControlLabel
              className={classes.menuItemLabel}
              control={
                <Checkbox
                  checked={showInfrastructureCost}
                  onChange={e => {
                    e.stopPropagation();
                    setShowInfrastructureCost(e.target.checked);
                  }}
                  onClick={e => e.stopPropagation()}
                />
              }
              label="Infrastructure cost"
              onClick={e => e.stopPropagation()}
            />
            <Typography className={classes.menuItemDescription}>
              The cost based on raw usage data from the underlying
              infrastructure.
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem
          className={classes.menuItem}
          onClick={e => {
            e.stopPropagation();
            setShowSupplementaryCost(!showSupplementaryCost);
          }}
        >
          <Box>
            <FormControlLabel
              className={classes.menuItemLabel}
              control={
                <Checkbox
                  checked={showSupplementaryCost}
                  onChange={e => {
                    e.stopPropagation();
                    setShowSupplementaryCost(e.target.checked);
                  }}
                  onClick={e => e.stopPropagation()}
                />
              }
              label="Supplementary cost"
              onClick={e => e.stopPropagation()}
            />
            <Typography className={classes.menuItemDescription}>
              All costs not directly attributed to the infrastructure.
              <br />
              These costs are determined by applying a price list within a cost
              model to OpenShift cluster metrics.
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </div>
  );
}
