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
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import Image from '../../assets/images/sandbox-banner-image.svg';
import { useSandboxContext } from '../../hooks/useSandboxContext';
import { calculateDaysBetweenDates } from '../../utils/common';

export const SandboxCatalogBanner: React.FC = () => {
  const theme = useTheme();
  const { userData, pendingApproval, verificationRequired, loading } =
    useSandboxContext();

  const calculateDaysLeft = React.useCallback(() => {
    if (userData?.endDate) {
      const trialEndDate = new Date(userData?.endDate);
      return calculateDaysBetweenDates(new Date(), trialEndDate);
    }
    // unable to compute days
    return undefined;
  }, [userData?.endDate]);

  return (
    <Card
      elevation={0}
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: theme.spacing(4),
        backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#0E1214',
        borderRadius: '0',
      }}
    >
      <Stack direction="row">
        <Box
          sx={{ display: { xs: 'none', sm: 'none', md: 'block', lg: 'block' } }}
        >
          <img
            src={Image}
            alt="Red Hat Trial"
            style={{
              maxWidth: '207px',
              height: 'auto',
              display: 'block',
            }}
          />
        </Box>

        <Box mt={2} ml={{ xs: 0, sm: 0, md: 4, lg: 4 }}>
          {loading ? (
            <>
              <Skeleton
                animation="wave"
                variant="rounded"
                width={500}
                height="25px"
                sx={{ my: '10px', borderRadius: 10 }}
                data-testid="MuiSkeleton-root"
              />
              <Skeleton
                animation="wave"
                variant="rounded"
                width={510}
                height="25px"
                sx={{ my: '15px', borderRadius: 10 }}
                data-testid="MuiSkeleton-root"
              />
              <Skeleton
                animation="wave"
                variant="rounded"
                width={300}
                height="25px"
                sx={{ my: '15px', borderRadius: 10 }}
                data-testid="MuiSkeleton-root"
              />
            </>
          ) : (
            <>
              {userData ? (
                <>
                  <Typography
                    variant="h1"
                    sx={{
                      mt: '1rem',
                      fontWeight: 700,
                      fontSize: {
                        xs: '2rem',
                        sm: '2.5rem',
                        md: '3.125rem',
                      },
                    }}
                  >
                    Welcome, {userData.givenName || userData.compliantUsername}
                  </Typography>
                  <Typography
                    variant="inherit"
                    color="textPrimary"
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5625rem' },
                    }}
                    key={`user-status-${
                      userData.endDate || ''
                    }-${verificationRequired}-${pendingApproval}`}
                  >
                    {(() => {
                      if (verificationRequired) {
                        return 'Click on "Try it" to initiate your free, no commitment 30-day trial.';
                      }
                      if (pendingApproval) {
                        return 'Please wait for your trial to be approved.';
                      }
                      if (userData?.endDate) {
                        const daysLeft = calculateDaysLeft();
                        return `Your free trial expires in ${daysLeft} ${
                          daysLeft === 1 ? 'day' : 'days'
                        }`;
                      }
                      return '';
                    })()}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography
                    variant="h1"
                    sx={{
                      fontWeight: 700,
                      fontSize: {
                        xs: '2rem',
                        sm: '2.5rem',
                        md: '3.125rem',
                      },
                    }}
                  >
                    Try Red Hat products
                  </Typography>
                  <Typography
                    variant="inherit"
                    color="textPrimary"
                    sx={{
                      fontWeight: 400,
                      fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5625rem' },
                    }}
                  >
                    Explore, experiment, and see what's possible
                  </Typography>
                  <Typography
                    color="textPrimary"
                    sx={{
                      marginTop: '10px',
                      fontWeight: 450,
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                    }}
                  >
                    Click on "Try it" to initiate your free, no commitment
                    30-day trial.
                  </Typography>
                </>
              )}
            </>
          )}
        </Box>
      </Stack>
    </Card>
  );
};
