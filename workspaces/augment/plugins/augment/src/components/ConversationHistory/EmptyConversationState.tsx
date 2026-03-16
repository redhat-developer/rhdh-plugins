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
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * Compact empty state for the conversation history sidebar.
 * Uses a lightweight layout suitable for narrow sidebar placement,
 * rather than the full-page Backstage EmptyState component.
 */
export function EmptyConversationState() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        p: 3,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
      }}
    >
      <ChatBubbleOutlineIcon
        sx={{
          fontSize: 40,
          color: alpha(theme.palette.text.secondary, 0.3),
          mb: 0.5,
        }}
      />
      <Typography
        variant="body2"
        sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}
      >
        {t('conversationHistory.noConversationsYet')}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}
      >
        {t('conversationHistory.startChatting')}
      </Typography>
    </Box>
  );
}
