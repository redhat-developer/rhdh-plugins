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
import Fade from '@mui/material/Fade';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useTheme, alpha } from '@mui/material/styles';
import LockIcon from '@mui/icons-material/Lock';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import { useTranslation } from '../../hooks/useTranslation';

interface AuthRequiredCardProps {
  authType: 'oauth' | 'secret';
  url?: string;
  demands?: {
    secrets?: Array<{ name: string; description?: string }>;
    [key: string]: unknown;
  };
  onOAuthConfirm?: () => void;
  onSecretsSubmit?: (secrets: Record<string, string>) => void;
}

export const AuthRequiredCard: React.FC<AuthRequiredCardProps> = ({
  authType,
  url,
  demands,
  onOAuthConfirm,
  onSecretsSubmit,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const secrets = demands?.secrets || [];

  const [secretValues, setSecretValues] = useState<Record<string, string>>({});
  const [oauthOpened, setOauthOpened] = useState(false);

  const handleSecretChange = useCallback((name: string, val: string) => {
    setSecretValues(prev => ({ ...prev, [name]: val }));
  }, []);

  const allSecretsFilled = secrets.every(s => (secretValues[s.name] || '').trim().length > 0);

  if (authType === 'oauth') {
    return (
      <Fade in timeout={300}>
      <Box
        sx={{
          mt: 1.5,
          mb: 1,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
          borderLeft: `3px solid ${theme.palette.warning.main}`,
          bgcolor: alpha(theme.palette.warning.main, isDark ? 0.06 : 0.02),
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1.25,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          }}
        >
          <LockIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {t('authRequiredCard.oauthTitle')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              {t('authRequiredCard.oauthSubtitle')}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-start' }}>
          {url && !oauthOpened && (
            <Button
              variant="contained"
              startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOauthOpened(true)}
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              {t('authRequiredCard.signIn')}
            </Button>
          )}
          {oauthOpened && (
            <>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                {t('authRequiredCard.afterSignInHint')}
              </Typography>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                onClick={onOAuthConfirm}
                sx={{ textTransform: 'none', fontWeight: 500 }}
              >
                {t('authRequiredCard.signedIn')}
              </Button>
            </>
          )}
          {!url && (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
              {t('authRequiredCard.noUrlHint')}
            </Typography>
          )}
        </Box>
      </Box>
      </Fade>
    );
  }

  return (
    <Fade in timeout={300}>
    <Box
      sx={{
        mt: 1.5,
        mb: 1,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
        borderLeft: `3px solid ${theme.palette.warning.main}`,
        bgcolor: alpha(theme.palette.warning.main, isDark ? 0.06 : 0.02),
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.25,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        }}
      >
        <VpnKeyIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
            {t('authRequiredCard.credentialsTitle')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            {t('authRequiredCard.credentialsSubtitle')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {secrets.map(secret => (
          <TextField
            key={secret.name}
            label={secret.name}
            helperText={secret.description}
            type="password"
            value={secretValues[secret.name] || ''}
            onChange={e => handleSecretChange(secret.name, e.target.value)}
            size="small"
            fullWidth
            required
          />
        ))}
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          px: 2,
          py: 1.25,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        }}
      >
        <Button
          size="small"
          variant="contained"
          startIcon={<SendIcon sx={{ fontSize: 14 }} />}
          disabled={!allSecretsFilled}
          onClick={() => onSecretsSubmit?.(secretValues)}
          sx={{ textTransform: 'none', fontSize: '0.8rem' }}
        >
          {t('authRequiredCard.submitCredentials')}
        </Button>
      </Box>
    </Box>
    </Fade>
  );
};
