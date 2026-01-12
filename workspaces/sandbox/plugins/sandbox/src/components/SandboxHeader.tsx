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
import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { Header, Link } from '@backstage/core-components';
import { useTrackAnalytics } from '../utils/eddl-utils';

interface SandboxHeaderProps {
  pageTitle: string;
}

export const SandboxHeader: React.FC<SandboxHeaderProps> = ({ pageTitle }) => {
  const trackAnalytics = useTrackAnalytics();

  useEffect(() => {
    const initializeAnalytics = async () => {
      // Check if script is already loaded
      if (!document.getElementById('trustarc')) {
        const script = document.createElement('script');
        script.id = 'trustarc';
        script.src =
          '//static.redhat.com/libs/redhat/marketing/latest/trustarc/trustarc.js';
        document.body.appendChild(script);
      }
      if (!document.getElementById('dpal')) {
        const script = document.createElement('script');
        script.id = 'dpal';
        script.src = 'https://www.redhat.com/ma/dpal.js';
        document.body.appendChild(script);
      }
    };

    initializeAnalytics();
  }, []);

  const theme = useTheme();

  // Handle Contact Sales click for analytics tracking
  const handleContactSalesClick = async (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    await trackAnalytics(
      'Contact Red Hat Sales',
      'Support',
      'https://www.redhat.com/en/contact',
      undefined,
      'cta',
    );

    // Navigate after tracking completes
    window.open('https://www.redhat.com/en/contact', '_blank');
  };

  return (
    <Header
      pageTitleOverride={pageTitle}
      title={
        <Typography
          color="textPrimary"
          style={{
            fontWeight: 900,
            fontSize: theme.typography.h1.fontSize,
            fontFamily: theme.typography.h1.fontFamily,
          }}
        >
          {pageTitle}
        </Typography>
      }
      subtitle={
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
      }
      style={{
        background: 'none',
        padding: '29.5px',
        borderBottom: '1px solid',
        borderColor: theme.palette.mode === 'light' ? '#C7C7C7' : '#383838',
      }}
    >
      <Box
        sx={{ display: { xs: 'none', sm: 'none', md: 'block', lg: 'block' } }}
      >
        <Link
          to="https://www.redhat.com/en/contact"
          underline="none"
          target="_blank"
          onClick={handleContactSalesClick}
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
      </Box>
    </Header>
  );
};
