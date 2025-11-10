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

import React from 'react';
import { Switch } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
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
});

type TableToolbarProps = {
  showPlatformSum: boolean;
  setShowPlatformSum: (showPlatformSum: boolean) => void;
  projectsCount: number;
};

/** @public */
export function TableToolbar(props: TableToolbarProps) {
  const { showPlatformSum, setShowPlatformSum, projectsCount } = props;
  const classes = useStyles();

  return (
    <>
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
            Projects ({projectsCount})
          </Typography>

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
      </div>
    </>
  );
}
