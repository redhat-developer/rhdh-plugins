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
import { Typography, Button, makeStyles, Link, Theme } from '@material-ui/core';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { Header } from '@backstage/core-components';

const useStyles = makeStyles((theme: Theme) => ({
  link: {
    fontSize: '12px',
  },
  button: {
    textTransform: 'none',
    marginRight: theme.spacing(2),
  },
}));

interface SandboxHeaderProps {
  pageTitle: string;
  showSubTitle?: boolean;
}

export const SandboxHeader: React.FC<SandboxHeaderProps> = ({
  pageTitle,
  showSubTitle,
}) => {
  const classes = useStyles();
  return (
    <Header
      title={
        <Typography
          variant="h1"
          color="textPrimary"
          style={{ fontWeight: 700 }}
        >
          {pageTitle}
        </Typography>
      }
      subtitle={
        showSubTitle && (
          <Typography variant="body1" color="textSecondary">
            powered by{' '}
            <Link
              href="https://developers.redhat.com/rhdh/overview"
              target="_blank"
              underline="none"
            >
              Red Hat Developer Hub{' '}
            </Link>
            <OpenInNewIcon
              fontSize="small"
              color="primary"
              className={classes.link}
            />
          </Typography>
        )
      }
      style={{ background: 'none' }}
    >
      <Button
        variant="outlined"
        color="primary"
        startIcon={<SupportAgentIcon />}
        endIcon={<OpenInNewIcon />}
        className={classes.button}
      >
        Contact Red Hat Sales
      </Button>
    </Header>
  );
};
