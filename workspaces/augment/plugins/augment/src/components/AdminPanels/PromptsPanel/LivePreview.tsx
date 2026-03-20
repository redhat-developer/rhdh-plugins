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
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import { useTheme } from '@mui/material/styles';
import type { PromptGroup } from '../../../types';
import { PromptGroupRow } from '../../WelcomeScreen/PromptGroupRow';

export interface LivePreviewProps {
  readonly open: boolean;
  readonly groups: readonly PromptGroup[];
}

const PREVIEW_PAPER_SX = {
  mb: 2,
  p: 2,
  borderRadius: 2,
  border: '1px dashed',
  borderColor: 'divider',
  bgcolor: 'background.default',
} as const;

const LABEL_SX = {
  fontSize: '0.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'text.disabled',
  mb: 1.5,
} as const;

const EMPTY_SX = {
  py: 3,
  textAlign: 'center',
  color: 'text.disabled',
  fontSize: '0.8125rem',
} as const;

const noop = () => {};

export const LivePreview: React.FC<LivePreviewProps> = ({ open, groups }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const validGroups = groups.filter(g => g.cards.length > 0);

  return (
    <Collapse in={open} unmountOnExit>
      <Paper variant="outlined" sx={PREVIEW_PAPER_SX}>
        <Typography sx={LABEL_SX}>Preview -- What users will see</Typography>
        {validGroups.length > 0 ? (
          <Box>
            {validGroups.map(group => (
              <PromptGroupRow
                key={group.id}
                promptGroup={group}
                onCardClick={noop}
                isDark={isDark}
              />
            ))}
          </Box>
        ) : (
          <Typography sx={EMPTY_SX}>
            Nothing to preview yet. Add a group with at least one card.
          </Typography>
        )}
      </Paper>
    </Collapse>
  );
};
