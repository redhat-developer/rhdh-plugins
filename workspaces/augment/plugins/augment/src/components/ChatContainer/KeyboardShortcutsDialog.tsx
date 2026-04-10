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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme, alpha } from '@mui/material/styles';
import { useMemo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface ShortcutEntry {
  keys: string[];
  description: string;
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

function Kbd({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Box
      component="kbd"
      sx={{
        display: 'inline-block',
        px: 0.75,
        py: 0.25,
        borderRadius: 0.5,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: alpha(theme.palette.action.hover, 0.4),
        fontFamily: 'system-ui, sans-serif',
        fontSize: '0.75rem',
        fontWeight: 600,
        lineHeight: 1.4,
        minWidth: 22,
        textAlign: 'center',
      }}
    >
      {children}
    </Box>
  );
}

function ShortcutRow({ entry }: { entry: ShortcutEntry }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 0.75,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
        {entry.description}
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        {entry.keys.map((key, i) => (
          <Kbd key={i}>{key}</Kbd>
        ))}
      </Box>
    </Box>
  );
}

export function KeyboardShortcutsDialog({
  open,
  onClose,
}: KeyboardShortcutsDialogProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const chatShortcuts = useMemo<ShortcutEntry[]>(
    () => [
      { keys: ['/'], description: t('keyboardShortcuts.focusChatInput') },
      {
        keys: ['⌘', 'Shift', 'O'],
        description: t('keyboardShortcuts.newConversation'),
      },
      { keys: ['Esc'], description: t('keyboardShortcuts.cancelStreaming') },
      { keys: ['?'], description: t('keyboardShortcuts.showHelp') },
      { keys: ['↑', '↓'], description: 'Navigate between messages' },
    ],
    [t],
  );

  const approvalShortcuts = useMemo<ShortcutEntry[]>(
    () => [
      { keys: ['Enter'], description: t('keyboardShortcuts.approveTool') },
      { keys: ['Esc'], description: t('keyboardShortcuts.rejectTool') },
    ],
    [t],
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        {t('keyboardShortcuts.title')}
        <IconButton
          size="small"
          onClick={onClose}
          aria-label={t('keyboardShortcuts.close')}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.text.secondary,
            display: 'block',
            mb: 0.5,
          }}
        >
          {t('keyboardShortcuts.chatSection')}
        </Typography>
        {chatShortcuts.map((entry, i) => (
          <ShortcutRow key={i} entry={entry} />
        ))}

        <Typography
          variant="overline"
          sx={{
            color: theme.palette.text.secondary,
            display: 'block',
            mt: 2,
            mb: 0.5,
          }}
        >
          {t('keyboardShortcuts.approvalSection')}
        </Typography>
        {approvalShortcuts.map((entry, i) => (
          <ShortcutRow key={i} entry={entry} />
        ))}
      </DialogContent>
    </Dialog>
  );
}
