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
import Popover from '@mui/material/Popover';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTheme } from '@mui/material/styles';
import Image from '../../assets/images/sandbox-banner-image.svg';
import { useSandboxContext } from '../../hooks/useSandboxContext';
import { calculateDaysBetweenDates } from '../../utils/common';

export const SandboxCatalogBanner: React.FC = () => {
  const theme = useTheme();
  const { userData, pendingApproval, verificationRequired, loading } =
    useSandboxContext();
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const calculateDaysLeft = React.useCallback(() => {
    if (userData?.endDate) {
      const trialEndDate = new Date(userData?.endDate);
      return calculateDaysBetweenDates(new Date(), trialEndDate);
    }
    // unable to compute days
    return undefined;
  }, [userData?.endDate]);

  const handleInfoClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

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
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="inherit"
                      color="textPrimary"
                      sx={{
                        fontWeight: 400,
                        fontSize: {
                          xs: '1rem',
                          sm: '1.25rem',
                          md: '1.5625rem',
                        },
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
                    {userData?.endDate && (
                      <IconButton
                        onClick={handleInfoClick}
                        size="small"
                        sx={{
                          padding: 0,
                          color: theme.palette.text.secondary,
                          '&:hover': {
                            color: theme.palette.primary.main,
                          },
                        }}
                        aria-label="Show trial information"
                      >
                        <InfoOutlinedIcon
                          sx={{
                            fontSize: {
                              xs: '1.2rem',
                              sm: '1.4rem',
                              md: '1.5rem',
                            },
                          }}
                        />
                      </IconButton>
                    )}
                  </Box>
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

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: {
              maxWidth: '360px',
              borderRadius: '8px',
              boxShadow: theme.shadows[8],
              mt: 1,
            },
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            padding: theme.spacing(3),
          }}
        >
          <IconButton
            onClick={handlePopoverClose}
            size="small"
            sx={{
              position: 'absolute',
              right: theme.spacing(1),
              top: theme.spacing(1),
              color: theme.palette.text.secondary,
            }}
            aria-label="Close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '1rem',
              marginBottom: theme.spacing(2),
              paddingRight: theme.spacing(3),
            }}
          >
            Sandbox access
          </Typography>

          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              color: theme.palette.text.secondary,
              marginBottom: theme.spacing(2),
              lineHeight: 1.5,
            }}
          >
            Once this trial expires, you can start a new one right afterwards.
            If you have work to save, please follow the instructions in the
            documentation.
          </Typography>

          <Link
            href="https://developers.redhat.com/learn/openshift/export-your-application-sandbox-red-hat-openshift-service-aws?source=sso"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              color: theme.palette.primary.main,
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            View documentation
            <OpenInNewIcon sx={{ fontSize: '1rem' }} />
          </Link>
        </Box>
      </Popover>
    </Card>
  );
};
