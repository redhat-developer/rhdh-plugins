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

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { useTheme, alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { glassSurface, borderRadius, typeScale } from '../../../theme/tokens';

const LIFECYCLE_STAGES = ['Draft', 'Pending', 'Published', 'Archived'];

interface LifecycleDetailShellProps {
  readonly onBack: () => void;
  readonly backLabel?: string;
  readonly currentStep: number;
  readonly children: ReactNode;
}

export function LifecycleDetailShell({
  onBack,
  backLabel = 'Agents',
  currentStep,
  children,
}: LifecycleDetailShellProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const glass = glassSurface(theme, 6);

  return (
    <>
      <Button
        size="small"
        startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
        onClick={onBack}
        sx={{
          textTransform: 'none',
          mb: 1.5,
          color: theme.palette.primary.main,
          fontWeight: 500,
        }}
      >
        {backLabel}
      </Button>

      <Box
        sx={{
          ...glass,
          borderRadius: borderRadius.lg,
          p: 3,
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {children}

        <Box sx={{ mt: 1 }}>
          <Stepper
            activeStep={currentStep}
            alternativeLabel
            sx={{
              '& .MuiStepLabel-label': {
                fontSize: typeScale.caption.fontSize,
                fontWeight: 500,
              },
              '& .MuiStepConnector-line': {
                borderColor: alpha(theme.palette.divider, isDark ? 0.3 : 0.2),
              },
            }}
          >
            {LIFECYCLE_STAGES.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Box>
    </>
  );
}
