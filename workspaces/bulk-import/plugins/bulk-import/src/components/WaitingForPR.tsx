/*
 * Copyright 2024 The Backstage Authors
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

import { Link, StatusPending } from '@backstage/core-components';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { makeStyles } from '@mui/styles';

import GitAltIcon from '../components/GitAltIcon';

const useStyles = makeStyles(() => ({
  urlLink: {
    paddingLeft: '5px',
    display: 'inline-flex',
  },
  openInNew: { paddingBottom: '5px', paddingTop: '3px' },
}));

export const WaitingForPR = ({ url }: { url: string }) => {
  const styles = useStyles();
  return (
    <span
      style={{
        display: 'flex',
      }}
    >
      <StatusPending />
      <GitAltIcon
        style={{
          height: '1.4em',
          width: '2em',
          paddingRight: '5px',
        }}
      />
      <span style={{ color: '#757575' }}>Waiting for approval</span>
      {url && (
        <Link
          to={url}
          data-testid="pull request url"
          className={styles.urlLink}
        >
          PR
          <OpenInNewIcon className={styles.openInNew} />
        </Link>
      )}
    </span>
  );
};
