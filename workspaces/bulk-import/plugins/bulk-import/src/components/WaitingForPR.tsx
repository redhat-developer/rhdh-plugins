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

import { Link, StatusPending } from '@backstage/core-components';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Typography from '@mui/material/Typography';

import GitAltIcon from '../components/GitAltIcon';
import GitLabIcon from '../components/GitLabIcon';

export const WaitingForPR = ({
  url,
  isApprovalToolGitlab,
}: {
  url: string;
  isApprovalToolGitlab: boolean;
}) => {
  return (
    <Typography
      component="span"
      style={{
        display: 'flex',
      }}
    >
      <StatusPending />
      {isApprovalToolGitlab ? (
        <GitLabIcon
          style={{
            height: '1.4em',
            width: '2em',
            paddingRight: '5px',
            marginTop: '2px',
          }}
        />
      ) : (
        <GitAltIcon
          style={{
            height: '1.4em',
            width: '2em',
            paddingRight: '5px',
          }}
        />
      )}
      <Typography component="span" style={{ color: '#757575' }}>
        Waiting for approval
      </Typography>
      {url && (
        <Link
          to={url}
          data-testid="pull request url"
          style={{
            paddingLeft: '5px',
            display: 'inline-flex',
          }}
        >
          PR
          <OpenInNewIcon sx={{ paddingBottom: '5px', paddingTop: '3px' }} />
        </Link>
      )}
    </Typography>
  );
};
