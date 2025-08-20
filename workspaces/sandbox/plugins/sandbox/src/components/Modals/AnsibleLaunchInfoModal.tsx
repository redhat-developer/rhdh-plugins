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
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopy from '@mui/icons-material/ContentCopy';
import ErrorIcon from '@mui/icons-material/Error';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link } from '@backstage/core-components';
import { useSandboxContext } from '../../hooks/useSandboxContext';
import { AnsibleStatus } from '../../utils/aap-utils';
import { useTrackAnalytics } from '../../utils/eddl-utils';
import { Intcmp } from '../../hooks/useProductURLs';

// Import the logos
import AnsibleLogo from '../../assets/logos/ansible.svg';
import RedHatLogo from '../../assets/logos/logo_hat-only.svg';

type AnsibleLaunchInfoModalProps = {
  modalOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const AnsibleLaunchInfoModal: React.FC<AnsibleLaunchInfoModalProps> = ({
  modalOpen,
  setOpen,
}) => {
  const theme = useTheme();

  const {
    ansibleUILink,
    ansibleUIUser,
    ansibleUIPassword,
    ansibleError,
    ansibleStatus,
  } = useSandboxContext();

  const trackAnalytics = useTrackAnalytics();

  // Handle CTA click for analytics
  const handleAnsibleCtaClick = async () => {
    if (ansibleUILink) {
      await trackAnalytics(
        'Get Started - Ansible',
        'Catalog',
        ansibleUILink,
        Intcmp.AAP,
        'cta',
      );
    }
  };
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <Dialog
      open={modalOpen}
      onClose={handleClose}
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor:
            theme.palette.mode === 'dark'
              ? '#383838'
              : theme.palette.background.paper,
        },
      }}
    >
      {ansibleStatus === AnsibleStatus.READY ? (
        <>
          <DialogTitle
            variant="h3"
            sx={{ fontWeight: 700, padding: '32px 24px 0 24px' }}
          >
            <div
              style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}
            >
              <CheckCircleIcon
                sx={{
                  color: 'success.main',
                  fontSize: 28,
                }}
              />
              <div style={{ width: '30rem' }}>
                Ansible Automation Platform instance provisioned
              </div>
            </div>
          </DialogTitle>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 16,
              top: 24,
              color: theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent
            sx={{ padding: '24px', backgroundColor: 'transparent !important' }}
          >
            <Typography
              variant="body1"
              sx={{ mb: 3, fontSize: '16px', fontWeight: 400 }}
            >
              To get started with your AAP instance, you will need{' '}
              <strong style={{ color: '#8B4513' }}>
                two different accounts
              </strong>
              :
            </Typography>

            {/* Section 1: AAP admin account */}
            <Box sx={{ mb: 4, backgroundColor: 'transparent !important' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2,
                  backgroundColor: 'transparent !important',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 1 }}>
                  1.
                </Typography>
                <Box
                  component="img"
                  src={AnsibleLogo}
                  alt="Ansible"
                  sx={{ width: 48, height: 48 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  AAP admin account
                </Typography>
              </Box>

              <Typography
                variant="body1"
                sx={{ mb: 2, fontSize: '16px', fontWeight: 400 }}
              >
                Log in to your AAP admin account within the new tab. Use the
                provided username and password to access your AAP instance.
              </Typography>

              <Box sx={{ mb: 3, backgroundColor: 'transparent !important' }}>
                <Stack
                  direction="row"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    mb: 1,
                    backgroundColor: 'transparent !important',
                  }}
                >
                  <InputLabel
                    style={{
                      width: '8rem',
                      fontSize: '16px',
                      fontWeight: 450,
                    }}
                  >
                    Username:
                  </InputLabel>

                  <TextField
                    variant="filled"
                    fullWidth
                    value={ansibleUIUser}
                    InputProps={{
                      disableUnderline: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() =>
                              window.navigator.clipboard.writeText(
                                ansibleUIUser || '',
                              )
                            }
                          >
                            <ContentCopy />
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        fontWeight: 450,
                        color: theme.palette.text.secondary,
                        height: '2rem',
                        width: '20rem',
                        paddingY: '4px',
                        '& .v5-MuiInputBase-input': {
                          paddingY: '10px',
                        },
                      },
                    }}
                  />
                </Stack>

                <Stack
                  direction="row"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: 'transparent !important',
                  }}
                >
                  <InputLabel
                    style={{
                      width: '8rem',
                      fontSize: '16px',
                      fontWeight: 450,
                    }}
                  >
                    Password:
                  </InputLabel>

                  <TextField
                    variant="filled"
                    value={ansibleUIPassword}
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    InputProps={{
                      disableUnderline: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              onClick={handleTogglePassword}
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                window.navigator.clipboard.writeText(
                                  ansibleUIPassword || '',
                                )
                              }
                            >
                              <ContentCopy />
                            </IconButton>
                          </Box>
                        </InputAdornment>
                      ),
                      sx: {
                        fontWeight: 450,
                        color: theme.palette.text.secondary,
                        height: '2rem',
                        width: '20rem',
                        paddingY: '4px',
                        '& .v5-MuiInputBase-input': {
                          paddingY: '10px',
                        },
                      },
                    }}
                  />
                </Stack>
              </Box>
            </Box>

            {/* Section 2: Red Hat account */}
            <Box sx={{ mb: 4, backgroundColor: 'transparent !important' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2,
                  backgroundColor: 'transparent !important',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 1 }}>
                  2.
                </Typography>
                <Box
                  component="img"
                  src={RedHatLogo}
                  alt="Red Hat"
                  sx={{ width: 48, height: 48 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Red Hat account
                </Typography>
              </Box>

              <Typography
                variant="body1"
                sx={{ mb: 2, fontSize: '16px', fontWeight: 400 }}
              >
                Once logged in, you'll need to activate your subscription. On
                the activation form, select "username and password" and then
                enter your Red Hat account credentials.
              </Typography>
            </Box>

            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ fontSize: '16px', fontWeight: 450 }}
            >
              Access this information again by clicking the{' '}
              <strong>Launch</strong> button on the Ansible Automation Platform
              sandbox card.
            </Typography>

            {ansibleError &&
              !ansibleUIUser &&
              !ansibleUIPassword &&
              !ansibleUILink && (
                <Typography
                  color="error"
                  style={{
                    fontSize: '16px',
                    fontWeight: 400,
                    marginTop: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <ErrorIcon color="error" style={{ fontSize: '16px' }} />
                    {ansibleError}
                  </div>
                </Typography>
              )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'flex-start', pl: 3, pb: 3 }}>
            <Link
              to={ansibleUILink || ''}
              underline="none"
              target="_blank"
              onClick={handleAnsibleCtaClick}
              data-analytics-track-by-analytics-manager="false"
            >
              <Button
                variant="contained"
                color="primary"
                endIcon={<OpenInNewIcon />}
                sx={{
                  textTransform: 'none',
                  marginRight: theme.spacing(2),
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  },
                }}
              >
                Get started
              </Button>
            </Link>
          </DialogActions>
        </>
      ) : (
        <>
          {' '}
          <DialogTitle
            variant="h3"
            sx={{ fontWeight: 700, padding: '32px 24px 0 24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '30rem' }}>
                Provisioning Ansible Automation Platform (AAP) instance
              </div>
            </div>
          </DialogTitle>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 16,
              top: 24,
              color: theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>{' '}
          <DialogContent
            sx={{
              padding: '6px 24px',
              backgroundColor: 'transparent !important',
            }}
          >
            <Typography
              variant="body1"
              sx={{ mr: 2, my: 0.5, fontSize: '16px', fontWeight: 420 }}
            >
              Provisioning can take up to 30 minutes. When ready, your instance
              will remain active for several hours.
            </Typography>
            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'transparent',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontSize: '16px',
                  fontWeight: 420,
                }}
              >
                New to Ansible Automation Platform? Get up to speed with our{' '}
                <Link to="http://red.ht/ansibledevsandboxpath" underline="none">
                  introductory learning path.
                </Link>
                <OpenInNewIcon />
              </Typography>
            </div>
            <div
              style={{
                backgroundColor: 'transparent',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 4,
                  mb: 4,
                  backgroundColor: 'transparent',
                }}
              >
                <CircularProgress size="5rem" />
              </Box>
              <Alert variant="outlined" severity="info">
                <Typography
                  variant="body1"
                  sx={{ fontSize: '16px', fontWeight: 500 }}
                >
                  You can close this modal. Follow the status of your instance
                  on the AAP sandbox card.
                </Typography>
              </Alert>
            </div>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'flex-start', pl: 3 }}>
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{
                width: '15%',
                textTransform: 'none',
                marginTop: theme.spacing(2),
                marginBottom: theme.spacing(2),
                border: `1px solid ${theme.palette.primary.main}`,
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  borderColor: '#1976d2',
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default AnsibleLaunchInfoModal;
