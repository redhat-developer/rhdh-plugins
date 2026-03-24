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
import React, { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import { getIconForName } from '../../WelcomeScreen/iconUtils';
import type {
  EditableGroup,
  EditableCard,
  ValidationErrors,
} from '../usePromptGroupsEditor';
import { CardEditor, CardDragOverlay } from './CardEditor';
import { ColorPicker } from './ColorPicker';
import { DeleteConfirmButton } from './DeleteConfirmButton';
import { IconPicker } from './IconPicker';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GroupEditorProps {
  readonly group: EditableGroup;
  readonly validationErrors: ValidationErrors;
  readonly onUpdateGroup: (
    groupKey: string,
    updates: Partial<Omit<EditableGroup, '_key' | 'cards'>>,
  ) => void;
  readonly onUpdateCard: (
    groupKey: string,
    cardKey: string,
    updates: Partial<Omit<EditableCard, '_key'>>,
  ) => void;
  readonly onAddCard: (groupKey: string) => void;
  readonly onRemoveCard: (groupKey: string, cardKey: string) => void;
  readonly onRemoveGroup: (groupKey: string) => void;
  readonly onMoveCard: (
    groupKey: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_GROUP_COLOR = '#1976d2';

const CARD_MODIFIERS = [restrictToVerticalAxis, restrictToParentElement];

const HEADER_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  mb: 2,
} as const;

const GROUP_DRAG_HANDLE_SX = {
  cursor: 'grab',
  color: 'text.disabled',
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  p: 0.25,
  borderRadius: 0.5,
  '&:hover': { color: 'text.secondary', bgcolor: 'action.hover' },
  '&:active': { cursor: 'grabbing' },
} as const;

const ICON_PREVIEW_SX = {
  width: 28,
  height: 28,
  borderRadius: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'common.white',
  '& svg': { fontSize: 16 },
  flexShrink: 0,
} as const;

const GROUP_FIELDS_SX = {
  display: 'flex',
  gap: 1.5,
  mb: 2,
  flexWrap: 'wrap',
} as const;

// ---------------------------------------------------------------------------
// Drag overlay shown when dragging a group (just the header bar)
// ---------------------------------------------------------------------------

export const GroupDragOverlay: React.FC<{ group: EditableGroup }> = ({
  group,
}) => {
  const groupColor = group.color || DEFAULT_GROUP_COLOR;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        borderLeft: `4px solid ${groupColor}`,
        bgcolor: 'background.paper',
        boxShadow: 6,
        opacity: 0.95,
        maxWidth: 960,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled' }} />
        <Box sx={{ ...ICON_PREVIEW_SX, backgroundColor: groupColor }}>
          {getIconForName(group.icon)}
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {group.title || 'Untitled Group'}
        </Typography>
        <Chip
          label={`${group.cards.length} card${
            group.cards.length !== 1 ? 's' : ''
          }`}
          size="small"
          variant="outlined"
        />
      </Box>
    </Paper>
  );
};

// ---------------------------------------------------------------------------
// Main GroupEditor
// ---------------------------------------------------------------------------

export const GroupEditor: React.FC<GroupEditorProps> = ({
  group,
  validationErrors,
  onUpdateGroup,
  onUpdateCard,
  onAddCard,
  onRemoveCard,
  onRemoveGroup,
  onMoveCard,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group._key });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 0 : 'auto',
  };

  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const titleError = validationErrors.groups.get(`${group._key}:title`);
  const cardsError = validationErrors.groups.get(`${group._key}:cards`);
  const groupColor = group.color || DEFAULT_GROUP_COLOR;

  const handleGroupField = useCallback(
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateGroup(group._key, { [field]: e.target.value });
    },
    [group._key, onUpdateGroup],
  );

  const cardIds = useMemo(() => group.cards.map(c => c._key), [group.cards]);

  const cardSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleCardDragStart = useCallback((event: DragStartEvent) => {
    setActiveCardId(String(event.active.id));
  }, []);

  const handleCardDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCardId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const fromIndex = group.cards.findIndex(c => c._key === active.id);
      const toIndex = group.cards.findIndex(c => c._key === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        onMoveCard(group._key, fromIndex, toIndex);
      }
    },
    [group._key, group.cards, onMoveCard],
  );

  const handleCardDragCancel = useCallback(() => {
    setActiveCardId(null);
  }, []);

  const activeCard = activeCardId
    ? group.cards.find(c => c._key === activeCardId)
    : undefined;

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      variant="outlined"
      sx={{
        mb: 1.5,
        borderRadius: 2,
        borderLeft: `4px solid ${groupColor}`,
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={HEADER_SX}>
          <Box
            {...attributes}
            {...listeners}
            sx={GROUP_DRAG_HANDLE_SX}
            tabIndex={0}
            role="button"
            aria-roledescription="sortable group"
            aria-label={`Drag to reorder group: ${group.title || 'Untitled'}`}
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
          <Box sx={{ ...ICON_PREVIEW_SX, backgroundColor: groupColor }}>
            {getIconForName(group.icon)}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
            {group.title || 'Untitled Group'}
          </Typography>
          <Chip
            label={`${group.cards.length} card${
              group.cards.length !== 1 ? 's' : ''
            }`}
            size="small"
            variant="outlined"
          />
          {cardsError && (
            <Typography variant="caption" color="error">
              {cardsError}
            </Typography>
          )}
          <DeleteConfirmButton
            confirmLabel={`Delete group & ${group.cards.length} card${
              group.cards.length !== 1 ? 's' : ''
            }?`}
            tooltipTitle="Delete group"
            onConfirm={() => onRemoveGroup(group._key)}
          />
        </Box>

        <Box sx={GROUP_FIELDS_SX}>
          <TextField
            label="Group Title"
            size="small"
            value={group.title}
            onChange={handleGroupField('title')}
            error={!!titleError}
            helperText={
              titleError || 'Give this group a name, e.g. "DevOps Tasks"'
            }
            placeholder="e.g. DevOps Tasks"
            sx={{ flex: 1, minWidth: 200 }}
            required
          />
          <IconPicker
            value={group.icon}
            onChange={icon => onUpdateGroup(group._key, { icon })}
            sx={{ width: 150 }}
          />
          <ColorPicker
            value={group.color}
            onChange={color => onUpdateGroup(group._key, { color })}
          />
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <DndContext
          sensors={cardSensors}
          collisionDetection={closestCenter}
          modifiers={CARD_MODIFIERS}
          onDragStart={handleCardDragStart}
          onDragEnd={handleCardDragEnd}
          onDragCancel={handleCardDragCancel}
        >
          <SortableContext
            items={cardIds}
            strategy={verticalListSortingStrategy}
          >
            {group.cards.map(card => (
              <CardEditor
                key={card._key}
                card={card}
                groupKey={group._key}
                validationErrors={validationErrors}
                onUpdate={onUpdateCard}
                onRemove={onRemoveCard}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeCard ? <CardDragOverlay card={activeCard} /> : null}
          </DragOverlay>
        </DndContext>

        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => onAddCard(group._key)}
          sx={{ mt: 0.5, textTransform: 'none' }}
        >
          Add Card
        </Button>
      </Box>
    </Paper>
  );
};
