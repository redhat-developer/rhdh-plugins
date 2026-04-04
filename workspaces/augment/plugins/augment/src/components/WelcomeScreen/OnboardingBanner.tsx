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

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import { useTheme, alpha } from '@mui/material/styles';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ChatIcon from '@mui/icons-material/Chat';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from '../../hooks/useTranslation';

const STORAGE_KEY = 'augment:onboarding-dismissed';

interface OnboardingBannerProps {
  readonly appName: string;
  readonly primaryColor: string;
}

const STEP_DEFS = [
  {
    icon: SmartToyIcon,
    titleKey: 'onboardingBanner.step1Title',
    descriptionKey: 'onboardingBanner.step1Description',
  },
  {
    icon: ChatIcon,
    titleKey: 'onboardingBanner.step2Title',
    descriptionKey: 'onboardingBanner.step2Description',
  },
  {
    icon: AutoAwesomeIcon,
    titleKey: 'onboardingBanner.step3Title',
    descriptionKey: 'onboardingBanner.step3Description',
  },
] as const;

export const OnboardingBanner: React.FC<OnboardingBannerProps> = ({
  appName,
  primaryColor,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      /* storage unavailable */
    }
  }, []);

  return (
    <Collapse in={!dismissed} timeout={400} unmountOnExit>
      <Box
        sx={{
          mx: 2,
          mb: 2,
          p: 2.5,
          borderRadius: 3,
          position: 'relative',
          background: isDark
            ? `linear-gradient(135deg, ${alpha(primaryColor, 0.12)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
            : `linear-gradient(135deg, ${alpha(primaryColor, 0.06)} 0%, ${alpha(primaryColor, 0.02)} 100%)`,
          border: `1px solid ${alpha(primaryColor, isDark ? 0.2 : 0.12)}`,
        }}
      >
        <IconButton
          size="small"
          onClick={handleDismiss}
          aria-label={t('onboardingBanner.dismissAriaLabel')}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: theme.palette.text.secondary,
            '&:hover': { color: theme.palette.text.primary },
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>

        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            mb: 0.5,
            color: theme.palette.text.primary,
            fontSize: '1rem',
          }}
        >
          {t('onboardingBanner.title')}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '0.8rem',
            mb: 2,
            maxWidth: 480,
          }}
        >
          {t('onboardingBanner.subtitle', { appName })}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          {STEP_DEFS.map((step, idx) => {
            const StepIcon = step.icon;
            return (
              <Box
                key={step.titleKey}
                sx={{
                  flex: '1 1 140px',
                  minWidth: 140,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    bgcolor: alpha(primaryColor, isDark ? 0.2 : 0.1),
                    color: primaryColor,
                  }}
                >
                  <StepIcon sx={{ fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      color: theme.palette.text.primary,
                      lineHeight: 1.3,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        bgcolor: primaryColor,
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        mr: 0.75,
                        verticalAlign: 'middle',
                      }}
                    >
                      {idx + 1}
                    </Box>
                    {t(step.titleKey)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.7rem',
                      lineHeight: 1.4,
                      display: 'block',
                      mt: 0.25,
                    }}
                  >
                    {t(step.descriptionKey)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Collapse>
  );
};
