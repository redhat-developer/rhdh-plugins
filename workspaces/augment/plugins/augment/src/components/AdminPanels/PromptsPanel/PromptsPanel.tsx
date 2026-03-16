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
import { useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import ViewCarouselOutlinedIcon from '@mui/icons-material/ViewCarouselOutlined';
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
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { usePromptGroupsEditor } from '../usePromptGroupsEditor';
import { PromptsPanelHeader } from './PromptsPanelHeader';
import { GroupEditor, GroupDragOverlay } from './GroupEditor';
import { LivePreview } from './LivePreview';

const CONTAINER_SX = {
  p: 3,
  width: '100%',
  maxWidth: 960,
  mx: 'auto',
} as const;

const LOADING_SX = {
  p: 4,
  display: 'flex',
  justifyContent: 'center',
} as const;

const EMPTY_STATE_SX = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 1.5,
  py: 6,
  px: 2,
} as const;

const EMPTY_ICON_SX = {
  fontSize: 48,
  color: 'text.disabled',
} as const;

const SNACKBAR_ANCHOR = {
  vertical: 'bottom' as const,
  horizontal: 'center' as const,
};

const GROUP_MODIFIERS = [restrictToVerticalAxis];

export const PromptsPanel = () => {
  const {
    groups,
    previewGroups,
    dirty,
    loading,
    saving,
    error,
    source,
    toast,
    validationErrors,
    handleSave,
    handleReset,
    updateGroup,
    updateCard,
    addCard,
    removeCard,
    addGroup,
    removeGroup,
    moveGroup,
    moveCard,
    dismissToast,
  } = usePromptGroupsEditor();

  const [showPreview, setShowPreview] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const togglePreview = useCallback(() => setShowPreview(prev => !prev), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const groupIds = useMemo(() => groups.map(g => g._key), [groups]);

  const handleGroupDragStart = useCallback((event: DragStartEvent) => {
    setActiveGroupId(String(event.active.id));
  }, []);

  const handleGroupDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveGroupId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const fromIndex = groups.findIndex(g => g._key === active.id);
      const toIndex = groups.findIndex(g => g._key === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        moveGroup(fromIndex, toIndex);
      }
    },
    [groups, moveGroup],
  );

  const handleGroupDragCancel = useCallback(() => {
    setActiveGroupId(null);
  }, []);

  if (loading) {
    return (
      <Box sx={LOADING_SX}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const hasGroups = groups.length > 0;
  const activeGroup = activeGroupId
    ? groups.find(g => g._key === activeGroupId)
    : undefined;

  return (
    <Box sx={CONTAINER_SX}>
      <PromptsPanelHeader
        source={source}
        dirty={dirty}
        saving={saving}
        showPreview={showPreview}
        onSave={handleSave}
        onReset={handleReset}
        onTogglePreview={togglePreview}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <LivePreview open={showPreview} groups={previewGroups} />

      {hasGroups ? (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={GROUP_MODIFIERS}
            onDragStart={handleGroupDragStart}
            onDragEnd={handleGroupDragEnd}
            onDragCancel={handleGroupDragCancel}
          >
            <SortableContext
              items={groupIds}
              strategy={verticalListSortingStrategy}
            >
              {groups.map(group => (
                <GroupEditor
                  key={group._key}
                  group={group}
                  validationErrors={validationErrors}
                  onUpdateGroup={updateGroup}
                  onUpdateCard={updateCard}
                  onAddCard={addCard}
                  onRemoveCard={removeCard}
                  onRemoveGroup={removeGroup}
                  onMoveCard={moveCard}
                />
              ))}
            </SortableContext>

            <DragOverlay>
              {activeGroup ? <GroupDragOverlay group={activeGroup} /> : null}
            </DragOverlay>
          </DndContext>

          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={addGroup}
            sx={{ mt: 2, textTransform: 'none' }}
          >
            Add Prompt Group
          </Button>
        </>
      ) : (
        <Box sx={EMPTY_STATE_SX}>
          <ViewCarouselOutlinedIcon sx={EMPTY_ICON_SX} />
          <Typography variant="body1" color="textSecondary" textAlign="center">
            No prompt groups configured yet.
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            textAlign="center"
            sx={{ maxWidth: 360 }}
          >
            Create prompt groups to help users get started with common tasks.
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={addGroup}
            sx={{ mt: 1, textTransform: 'none' }}
          >
            Add Prompt Group
          </Button>
        </Box>
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={dismissToast}
        message={toast}
        anchorOrigin={SNACKBAR_ANCHOR}
      />
    </Box>
  );
};
