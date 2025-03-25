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
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { Header, Link } from '@backstage/core-components';

interface SandboxHeaderProps {
  pageTitle: string;
  showSubTitle?: boolean;
}

export const SandboxHeader: React.FC<SandboxHeaderProps> = ({
  pageTitle,
  showSubTitle,
}) => {
  const theme = useTheme();
  return (
    <Header
      title={
        <Typography
          color="textPrimary"
          style={{
            fontWeight: 700,
            fontSize: theme.typography.h1.fontSize,
            fontFamily: theme.typography.h1.fontFamily,
          }}
        >
          {pageTitle}
        </Typography>
      }
      subtitle={
        showSubTitle && (
          <Typography variant="body1" color="textSecondary">
            powered by{' '}
            <Link
              to="https://developers.redhat.com/rhdh/overview"
              underline="none"
            >
              Red Hat Developer Hub{' '}
            </Link>
            <OpenInNewIcon
              fontSize="small"
              color="primary"
              sx={{ fontSize: '12px' }}
            />
          </Typography>
        )
      }
      style={{ background: 'none' }}
    >
      <Link
        to="https://www.redhat.com/en/contact"
        underline="none"
        target="_blank"
      >
        <Button
          variant="outlined"
          color="primary"
          startIcon={<SupportAgentIcon />}
          endIcon={<OpenInNewIcon />}
          sx={{
            textTransform: 'none',
            marginRight: theme.spacing(2),
            border: `1px solid ${theme.palette.primary.main}`,
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
              borderColor: '#1976d2',
            },
          }}
        >
          Contact Red Hat Sales
        </Button>
      </Link>
    </Header>
  );
};
