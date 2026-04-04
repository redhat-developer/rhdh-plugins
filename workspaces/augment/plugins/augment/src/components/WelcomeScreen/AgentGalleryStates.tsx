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

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme, alpha } from '@mui/material/styles';
import { useTranslation } from '../../hooks/useTranslation';

export function AgentGalleryFetchError(props: {
  error: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const { error, onRetry } = props;
  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <Alert
        severity="error"
        action={
          <Button
            size="small"
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            sx={{ textTransform: 'none' }}
          >
            {t('agentGallery.retry')}
          </Button>
        }
        sx={{ borderRadius: 2 }}
      >
        {error}
      </Alert>
    </Box>
  );
}

export function AgentGallerySkeleton() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <SmartToyIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {t('agentGallery.heading')}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {[1, 2, 3, 4].map(i => (
          <Box key={i} sx={{ width: 280 }}>
            <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function AgentGalleryNoAgents() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <Box
        sx={{
          textAlign: 'center',
          py: 4,
          px: 3,
          borderRadius: 3,
          border: `1px dashed ${alpha(theme.palette.text.disabled, 0.3)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.5),
        }}
      >
        <SmartToyIcon sx={{ fontSize: 40, color: theme.palette.text.disabled, mb: 1 }} />
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
          {t('agentGallery.noAgentsTitle')}
        </Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.disabled, display: 'block', mt: 0.5 }}>
          {t('agentGallery.noAgentsHint')}
        </Typography>
      </Box>
    </Box>
  );
}
