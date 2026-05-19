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

import { type ReactElement, type ReactNode, useCallback, useId } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';

export interface WizardShellProps {
  open: boolean;
  title: string;
  subtitle?: string;
  steps: string[];
  activeStep: number;
  formStepCount: number;
  stepIcons: Record<string, ReactElement>;
  stepDescriptions: Record<string, string>;
  isBuildStep: boolean;
  buildActive: boolean;
  submitting: boolean;
  submitError: string | null;
  onSubmitErrorClose: () => void;
  submitLabel: string;
  submittingLabel: string;
  successOpen: boolean;
  successMessage: string;
  onSuccessClose: () => void;
  onClose: () => void;
  onCloseBuild: () => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  children: ReactNode;
}

export function WizardShell({
  open,
  title,
  subtitle,
  steps,
  activeStep,
  formStepCount,
  stepIcons,
  stepDescriptions,
  isBuildStep,
  buildActive,
  submitting,
  submitError,
  onSubmitErrorClose,
  submitLabel,
  submittingLabel,
  successOpen,
  successMessage,
  onSuccessClose,
  onClose,
  onCloseBuild,
  onBack,
  onNext,
  onSubmit,
  children,
}: WizardShellProps) {
  const titleId = useId();

  const handleDialogClose = useCallback(
    (_: object, reason: 'backdropClick' | 'escapeKeyDown') => {
      if (submitting) return;
      if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
        if (buildActive) {
          onCloseBuild();
        } else {
          onClose();
        }
      }
    },
    [onClose, submitting, buildActive, onCloseBuild],
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        aria-labelledby={titleId}
      >
        <DialogTitle id={titleId}>
          {title}
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel
                  StepIconProps={{
                    icon: stepIcons[label] ?? undefined,
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {!isBuildStep && stepDescriptions[steps[activeStep]] && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, mt: -1 }}
            >
              {stepDescriptions[steps[activeStep]]}
            </Typography>
          )}

          {submitError && !isBuildStep && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={onSubmitErrorClose}>
              {submitError}
            </Alert>
          )}

          {children}
        </DialogContent>

        {!isBuildStep && (
          <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
            <Button
              onClick={onClose}
              disabled={submitting}
              startIcon={
                <Typography component="span" sx={{ fontSize: '1.1em' }}>
                  &larr;
                </Typography>
              }
              sx={{ textTransform: 'none' }}
            >
              {activeStep === 0 ? 'Back' : 'Cancel'}
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {activeStep > 0 && (
                <Button
                  onClick={onBack}
                  disabled={submitting}
                  sx={{ textTransform: 'none' }}
                >
                  Back
                </Button>
              )}
              {activeStep < formStepCount - 1 ? (
                <Button
                  variant="contained"
                  onClick={onNext}
                  disabled={submitting}
                  sx={{ textTransform: 'none' }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={onSubmit}
                  disabled={submitting}
                  startIcon={
                    submitting ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : undefined
                  }
                  sx={{ textTransform: 'none' }}
                >
                  {submitting ? submittingLabel : submitLabel}
                </Button>
              )}
            </Box>
          </DialogActions>
        )}
      </Dialog>

      <Snackbar
        open={successOpen}
        autoHideDuration={4000}
        onClose={onSuccessClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={onSuccessClose}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
