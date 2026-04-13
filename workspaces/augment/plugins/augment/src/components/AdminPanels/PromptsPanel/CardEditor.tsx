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
import React, { useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { EditableCard, ValidationErrors } from '../usePromptGroupsEditor';
import { IconPicker } from './IconPicker';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CardEditorProps {
  readonly card: EditableCard;
  readonly groupKey: string;
  readonly validationErrors: ValidationErrors;
  readonly onUpdate: (
    groupKey: string,
    cardKey: string,
    updates: Partial<Omit<EditableCard, '_key'>>,
  ) => void;
  readonly onRemove: (groupKey: string, cardKey: string) => void;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const PAPER_SX = {
  px: 2,
  py: 1.5,
  mb: 1,
  borderRadius: 2,
} as const;

const ROW_SX = {
  display: 'flex',
  gap: 1,
  alignItems: 'flex-start',
} as const;

const CARD_DRAG_HANDLE_SX = {
  cursor: 'grab',
  color: 'text.disabled',
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  mt: 0.75,
  p: 0.25,
  borderRadius: 0.5,
  '&:hover': { color: 'text.secondary', bgcolor: 'action.hover' },
  '&:active': { cursor: 'grabbing' },
} as const;

const FIELDS_SX = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 1.25,
  minWidth: 0,
} as const;

const ACTIONS_SX = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 0.5,
  pt: 0.5,
} as const;

const CHAR_COUNT_SX = {
  fontSize: '0.7rem',
  color: 'text.disabled',
  textAlign: 'right',
  mt: -0.5,
} as const;

// ---------------------------------------------------------------------------
// Drag overlay shown when dragging a card (compact summary)
// ---------------------------------------------------------------------------

export const CardDragOverlay: React.FC<{ card: EditableCard }> = ({ card }) => (
  <Paper
    variant="outlined"
    sx={{
      px: 2,
      py: 1.5,
      borderRadius: 2,
      bgcolor: 'background.paper',
      boxShadow: 4,
      opacity: 0.95,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled' }} />
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {card.title || 'Untitled Card'}
      </Typography>
      {card.prompt && (
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ maxWidth: 300 }}
        >
          — {card.prompt}
        </Typography>
      )}
    </Box>
  </Paper>
);

// ---------------------------------------------------------------------------
// Main CardEditor
// ---------------------------------------------------------------------------

export const CardEditor: React.FC<CardEditorProps> = ({
  card,
  groupKey,
  validationErrors,
  onUpdate,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card._key });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 0 : 'auto',
  };

  const titleError = validationErrors.cards.get(`${card._key}:title`);
  const promptError = validationErrors.cards.get(`${card._key}:prompt`);

  const handleField = useCallback(
    (field: keyof Omit<EditableCard, '_key'>) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate(groupKey, card._key, { [field]: e.target.value });
      },
    [groupKey, card._key, onUpdate],
  );

  return (
    <Paper ref={setNodeRef} style={style} variant="outlined" sx={PAPER_SX}>
      <Box sx={ROW_SX}>
        <Box
          {...attributes}
          {...listeners}
          sx={CARD_DRAG_HANDLE_SX}
          tabIndex={0}
          role="button"
          aria-roledescription="sortable card"
          aria-label={`Drag to reorder card: ${card.title || 'Untitled'}`}
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>

        <Box sx={FIELDS_SX}>
          <TextField
            label="Title"
            size="small"
            value={card.title}
            onChange={handleField('title')}
            error={!!titleError}
            helperText={titleError}
            placeholder="e.g. List Projects"
            required
            fullWidth
          />

          <TextField
            label="Prompt"
            size="small"
            value={card.prompt}
            onChange={handleField('prompt')}
            error={!!promptError}
            helperText={promptError}
            placeholder="The message sent to the AI when user clicks this card"
            required
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
          />
          {card.prompt.length > 0 && (
            <Typography sx={CHAR_COUNT_SX}>
              {card.prompt.length} characters
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Description"
              size="small"
              value={card.description || ''}
              onChange={handleField('description')}
              placeholder="Optional subtitle shown below the title"
              sx={{ flex: 1 }}
            />
            <IconPicker
              value={card.icon}
              onChange={icon => onUpdate(groupKey, card._key, { icon })}
              sx={{ width: 140 }}
            />
          </Box>
        </Box>

        <Box sx={ACTIONS_SX}>
          <Tooltip title="Remove card">
            <IconButton
              size="small"
              onClick={() => onRemove(groupKey, card._key)}
              aria-label="Remove card"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
};
